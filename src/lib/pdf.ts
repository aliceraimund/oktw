import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import type { FichaEntrega } from '@/types/database'
import { formatDateBR, formatDateTimeBR } from './utils'

async function sha256(data: string): Promise<string> {
  const encoder = new TextEncoder()
  const bytes = encoder.encode(data)
  const hashBuffer = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}


// ─── Ficha com múltiplos EPIs + Termo de Responsabilidade ────────────────────

const TERMO_PARAGRAFOS = [
  'Recebi da empresa OKTW COMERCIO E SERVICOS LTDA, CNPJ: 51.747.453/0001-17, a título de empréstimo, para meu uso exclusivo e obrigatório nas dependências da empresa, conforme determinado no PGR Programa de Gerenciamento de Risco da Portaria 3214/78 em sua NR-01 os equipamentos discriminados a seguir, comprometendo-me a mantê-los em perfeito estado de uso e conservação, ficando ciente de que:',
  '1- Recebi treinamento quanto à necessidade na utilização dos referidos EPI\'s, a maneira correta de usá-los, guardá-los e higienizá-los, bem como da minha responsabilidade quanto a seu uso, conforme determinado na Portaria 3214/78 em sua NR-01;',
  '2- Se o equipamento foi danificado ou inutilizado por emprego inadequado, mau uso, negligência ou extravio, a empresa me fornecerá novo equipamento e cobrará o valor de um equipamento da mesma marca ou equivalente (Art. 462 em seu parágrafo 1º da C.L.T.);',
  '3- Fico proibido de dar ou emprestar o equipamento que estiver sob a minha responsabilidade, só podendo fazê-lo se receber ordem por escrito de pessoas autorizadas para tal fim;',
  '4- Em caso de dano, inutilização ou extravio do equipamento, deverei comunicar imediatamente ao setor competente;',
  '5- Terminados os serviços, ou no caso de rescisão do contrato de trabalho, devolverei o equipamento completo e em perfeito estado de conservação, considerando-se o tempo de uso do mesmo, ao setor competente;',
  '6- Estando os equipamentos em minha posse, estarei sujeito a inspeções sem prévio aviso.',
  '7- Fico ciente de que pela não utilização do equipamento de proteção individual em serviço, estarei sujeito às sanções disciplinares cabíveis, que irão desde a simples advertência até a dispensa por justa causa, nos termos do Art. 482 letra "h" da C.L.T., combinado com a Portaria 3214/78 em suas NR-01 e NR-06.',
]

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    if ((current + ' ' + word).trim().length <= maxChars) {
      current = (current + ' ' + word).trim()
    } else {
      if (current) lines.push(current)
      current = word
    }
  }
  if (current) lines.push(current)
  return lines
}

export async function gerarFichaEntregaPDFv2(
  ficha: FichaEntrega,
  assinaturaBase64: string
): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const page = doc.addPage([595, 842]) // A4
  const { width, height } = page.getSize()

  const fontBold    = await doc.embedFont(StandardFonts.HelveticaBold)
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica)

  const colaborador = ficha.colaborador!
  const itens       = ficha.itens ?? []
  const hash        = await sha256(assinaturaBase64)

  const margin = 50
  let y = height - margin

  // Tipo determina os textos do documento
  const tipoLabel    = ficha.tipo === 'retirada' ? 'RETIRADA' : 'ENTREGA'
  const tipoSubtitle = ficha.tipo === 'retirada'
    ? 'Ficha de Retirada de EPI — NR-6'
    : 'Ficha de Entrega de EPI — NR-6'

  // ── Cabeçalho ──────────────────────────────────────────────
  page.drawRectangle({ x: 0, y: height - 80, width, height: 80, color: rgb(0.06, 0.09, 0.16) })
  page.drawText('OKTW', { x: margin, y: height - 46, size: 24, font: fontBold, color: rgb(1, 1, 1) })
  page.drawText(tipoSubtitle, {
    x: margin, y: height - 64, size: 9, font: fontRegular, color: rgb(0.72, 0.84, 1),
  })
  y = height - 110

  // ── Título ─────────────────────────────────────────────────
  page.drawText(`TERMO DE RESPONSABILIDADE PELA GUARDA E USO DO EPI — ${tipoLabel}`, {
    x: margin, y, size: 9, font: fontBold, color: rgb(0.06, 0.09, 0.16),
  })
  y -= 24

  // ── Colaborador ────────────────────────────────────────────
  page.drawText('DADOS DO COLABORADOR', { x: margin, y, size: 8, font: fontBold, color: rgb(0.4, 0.4, 0.4) })
  y -= 16

  for (const [label, valor] of [
    ['Nome', colaborador.nome],
    ['Cargo', colaborador.cargo ?? '—'],
    ['Setor', colaborador.setor ?? '—'],
    ['CTPS', colaborador.ctps ?? '—'],
    ['Tipo', tipoLabel === 'RETIRADA' ? 'Retirada de EPI' : 'Entrega de EPI'],
    [`Data de ${tipoLabel.toLowerCase()}`, formatDateBR(ficha.data_entrega)],
  ] as [string, string][]) {
    page.drawText(`${label}:`, { x: margin, y, size: 8, font: fontBold })
    page.drawText(valor, { x: margin + 110, y, size: 8, font: fontRegular })
    y -= 14
  }

  y -= 8
  page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 0.5, color: rgb(0.85, 0.85, 0.85) })
  y -= 16

  // ── EPIs ───────────────────────────────────────────────────
  page.drawText('EQUIPAMENTOS RECEBIDOS', { x: margin, y, size: 8, font: fontBold, color: rgb(0.4, 0.4, 0.4) })
  y -= 14

  // Cabeçalho da tabela
  const cols = { epi: margin, ca: margin + 200, qtd: margin + 300, venc: margin + 360 }
  page.drawRectangle({ x: margin - 4, y: y - 4, width: width - margin * 2 + 8, height: 16, color: rgb(0.95, 0.95, 0.95) })
  page.drawText('Equipamento', { x: cols.epi, y, size: 7, font: fontBold })
  page.drawText('CA', { x: cols.ca, y, size: 7, font: fontBold })
  page.drawText('Qtd', { x: cols.qtd, y, size: 7, font: fontBold })
  page.drawText('Vencimento', { x: cols.venc, y, size: 7, font: fontBold })
  y -= 18

  for (const item of itens) {
    const nome = (item.epi?.nome ?? '').substring(0, 35)
    page.drawText(nome, { x: cols.epi, y, size: 8, font: fontRegular })
    page.drawText(item.epi?.ca ?? '', { x: cols.ca, y, size: 8, font: fontRegular })
    page.drawText(String(item.quantidade), { x: cols.qtd, y, size: 8, font: fontRegular })
    page.drawText(formatDateBR(item.data_vencimento), { x: cols.venc, y, size: 8, font: fontRegular })
    y -= 14
  }

  y -= 10
  page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 0.5, color: rgb(0.85, 0.85, 0.85) })
  y -= 16

  // ── Termo de Responsabilidade ──────────────────────────────
  page.drawText('TERMO DE RESPONSABILIDADE', { x: margin, y, size: 8, font: fontBold, color: rgb(0.4, 0.4, 0.4) })
  y -= 14

  for (const paragrafo of TERMO_PARAGRAFOS) {
    const linhas = wrapText(paragrafo, 95)
    for (const linha of linhas) {
      if (y < 180) break  // reservar espaço para assinatura
      page.drawText(linha, { x: margin, y, size: 7, font: fontRegular, color: rgb(0.2, 0.2, 0.2) })
      y -= 11
    }
    y -= 4
  }

  y -= 10
  page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 0.5, color: rgb(0.85, 0.85, 0.85) })
  y -= 20

  // ── Assinatura ─────────────────────────────────────────────
  page.drawText('ASSINATURA ELETRÔNICA DO COLABORADOR', { x: margin, y, size: 8, font: fontBold, color: rgb(0.4, 0.4, 0.4) })
  y -= 14

  page.drawText(
    `Assinado em: ${ficha.assinado_em ? formatDateTimeBR(ficha.assinado_em) : new Date().toLocaleString('pt-BR')}`,
    { x: margin, y, size: 8, font: fontRegular }
  )
  y -= 14

  try {
    const base64Data = assinaturaBase64.replace(/^data:image\/\w+;base64,/, '')
    const imgBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0))
    const img = await doc.embedPng(imgBytes).catch(() => doc.embedJpg(imgBytes))
    const imgDims = img.scale(0.35)
    const imgH = Math.min(imgDims.height, 60)
    const imgW = Math.min(imgDims.width, 180)
    y -= imgH + 10
    page.drawImage(img, { x: margin, y, width: imgW, height: imgH })
    y -= 4
  } catch {
    y -= 60
  }

  page.drawLine({ start: { x: margin, y }, end: { x: margin + 200, y }, thickness: 1, color: rgb(0, 0, 0) })
  page.drawText(colaborador.nome, { x: margin, y: y - 12, size: 8, font: fontRegular })

  // ── Rodapé ─────────────────────────────────────────────────
  page.drawLine({ start: { x: margin, y: 55 }, end: { x: width - margin, y: 55 }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) })
  page.drawText('Hash SHA-256:', { x: margin, y: 42, size: 6, font: fontBold, color: rgb(0.5, 0.5, 0.5) })
  page.drawText(hash, { x: margin, y: 32, size: 5.5, font: fontRegular, color: rgb(0.5, 0.5, 0.5) })
  page.drawText('Sistema OKTW EPI Manager — Conforme NR-6 / Portaria 3214/78', {
    x: margin, y: 20, size: 6.5, font: fontRegular, color: rgb(0.6, 0.6, 0.6),
  })

  return doc.save()
}
