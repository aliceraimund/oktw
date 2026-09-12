import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import type { FichaEntrega, Profile } from '@/types/database'
import { formatDateBR, formatDateTimeBR, formatCA } from './utils'
import { aplicarPlaceholders } from './pdf-config'
import { carregarConfigPdf } from './pdf-config-server'

async function sha256(data: string): Promise<string> {
  const encoder = new TextEncoder()
  const bytes = encoder.encode(data)
  const hashBuffer = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}


const MOTIVO_LABEL: Record<string, string> = {
  substituicao: 'Substituição',
  desligamento: 'Desligamento',
  higienizacao: 'Higienização',
}

// ─── Ficha com múltiplos EPIs + Termo de Responsabilidade ────────────────────

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

  const fontBold    = await doc.embedFont(StandardFonts.HelveticaBold)
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica)

  const colaborador = ficha.colaborador!
  const itens       = ficha.itens ?? []
  const hash        = await sha256(assinaturaBase64)
  const config      = await carregarConfigPdf()

  const W = 595, H = 842, margin = 50 // A4
  const width = W, height = H

  // Tipo determina os textos do documento
  const ehDev        = ficha.tipo === 'retirada'
  const tipoLabel    = ehDev ? 'DEVOLUÇÃO' : 'ENTREGA'
  const tipoSubtitle = ehDev
    ? 'Confirmação de Devolução de EPI — NR-6'
    : 'Ficha de Entrega de EPI — NR-6'

  // ── Cabeçalho e rodapé reutilizáveis (garantem consistência entre páginas) ──
  function desenharCabecalho(p: ReturnType<typeof doc.addPage>) {
    p.drawRectangle({ x: 0, y: H - 80, width: W, height: 80, color: rgb(0.06, 0.09, 0.16) })
    p.drawText('OKTW', { x: margin, y: H - 46, size: 24, font: fontBold, color: rgb(1, 1, 1) })
    p.drawText(tipoSubtitle, {
      x: margin, y: H - 64, size: 9, font: fontRegular, color: rgb(0.72, 0.84, 1),
    })
    return H - 110
  }

  function desenharRodape(p: ReturnType<typeof doc.addPage>) {
    p.drawLine({ start: { x: margin, y: 55 }, end: { x: W - margin, y: 55 }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) })
    p.drawText('Hash SHA-256:', { x: margin, y: 42, size: 6, font: fontBold, color: rgb(0.5, 0.5, 0.5) })
    p.drawText(hash, { x: margin, y: 32, size: 5.5, font: fontRegular, color: rgb(0.5, 0.5, 0.5) })
    p.drawText('Sistema OKTW EPI Manager — Conforme NR-6 item 6.5.1 / Lei 14.063/2020', {
      x: margin, y: 20, size: 6.5, font: fontRegular, color: rgb(0.6, 0.6, 0.6),
    })
  }

  let page = doc.addPage([W, H])
  let y = desenharCabecalho(page)

  // ── Título ─────────────────────────────────────────────────
  page.drawText(
    ehDev
      ? 'CONFIRMAÇÃO DE DEVOLUÇÃO DE EPI'
      : `TERMO DE RESPONSABILIDADE PELA GUARDA E USO DO EPI — ${tipoLabel}`,
    { x: margin, y, size: 9, font: fontBold, color: rgb(0.06, 0.09, 0.16) }
  )
  y -= 24

  // ── Colaborador ────────────────────────────────────────────
  page.drawText('DADOS DO COLABORADOR', { x: margin, y, size: 8, font: fontBold, color: rgb(0.4, 0.4, 0.4) })
  y -= 16

  const camposColaborador: [string, string][] = [['Nome', colaborador.nome]]
  if (config.campos.cpf)   camposColaborador.push(['CPF', colaborador.cpf ?? '—'])
  if (config.campos.cargo) camposColaborador.push(['Cargo', colaborador.cargo ?? '—'])
  if (config.campos.setor) camposColaborador.push(['Setor', colaborador.setor ?? '—'])
  if (config.campos.ctps)  camposColaborador.push(['CTPS', colaborador.ctps ?? '—'])
  camposColaborador.push(['Tipo', ehDev ? 'Devolução de EPI' : 'Entrega de EPI'])
  if (config.campos.data)  camposColaborador.push([`Data da ${ehDev ? 'devolução' : 'entrega'}`, formatDateBR(ficha.data_entrega)])

  for (const [label, valor] of camposColaborador) {
    page.drawText(`${label}:`, { x: margin, y, size: 8, font: fontBold })
    page.drawText(valor, { x: margin + 110, y, size: 8, font: fontRegular })
    y -= 14
  }

  y -= 8
  page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 0.5, color: rgb(0.85, 0.85, 0.85) })
  y -= 16

  // ── EPIs ───────────────────────────────────────────────────
  page.drawText(ehDev ? 'EQUIPAMENTOS DEVOLVIDOS' : 'EQUIPAMENTOS RECEBIDOS', { x: margin, y, size: 8, font: fontBold, color: rgb(0.4, 0.4, 0.4) })
  y -= 14

  // Cabeçalho da tabela (5 colunas: nome | CA | Val.CA | Qtd | Vencimento)
  const cols = { epi: margin, ca: margin + 170, valca: margin + 250, qtd: margin + 335, venc: margin + 370 }
  page.drawRectangle({ x: margin - 4, y: y - 4, width: width - margin * 2 + 8, height: 16, color: rgb(0.95, 0.95, 0.95) })
  page.drawText('Equipamento',  { x: cols.epi,   y, size: 7, font: fontBold })
  page.drawText('CA',           { x: cols.ca,    y, size: 7, font: fontBold })
  page.drawText('Val. CA',      { x: cols.valca, y, size: 7, font: fontBold })
  page.drawText('Qtd',          { x: cols.qtd,   y, size: 7, font: fontBold })
  page.drawText('Vencimento',   { x: cols.venc,  y, size: 7, font: fontBold })
  y -= 18

  for (const item of itens) {
    const nome = (item.epi?.nome ?? '').substring(0, 30)
    const validadeCa = item.epi?.validade_ca ? formatDateBR(item.epi.validade_ca) : '—'
    page.drawText(nome, { x: cols.epi, y, size: 8, font: fontRegular })
    page.drawText(formatCA(item.epi?.ca), { x: cols.ca, y, size: 8, font: fontRegular })
    page.drawText(validadeCa, { x: cols.valca, y, size: 8, font: fontRegular })
    page.drawText(String(item.quantidade), { x: cols.qtd, y, size: 8, font: fontRegular })
    page.drawText(formatDateBR(item.data_vencimento), { x: cols.venc, y, size: 8, font: fontRegular })
    y -= 14
  }

  y -= 10
  page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 0.5, color: rgb(0.85, 0.85, 0.85) })
  y -= 16

  // ── Termo / Declaração ─────────────────────────────────────
  page.drawText(ehDev ? 'DECLARAÇÃO DE DEVOLUÇÃO' : 'TERMO DE RESPONSABILIDADE', { x: margin, y, size: 8, font: fontBold, color: rgb(0.4, 0.4, 0.4) })
  y -= 14

  const MIN_ASSINATURA = 150 // altura mínima livre para o bloco de assinatura

  // Devolução usa uma declaração curta; entrega usa o termo configurável.
  const DEVOLUCAO_PARAGRAFOS = [
    'Declaro, para os devidos fins, que devolvi à empresa {EMPRESA}, CNPJ: {CNPJ}, os Equipamentos de Proteção Individual (EPI) discriminados acima.',
    'Declaro ainda que consinto expressamente com a assinatura eletrônica da presente confirmação de devolução, nos termos da Lei nº 14.063/2020 e conforme a NR-6 item 6.5.1, tendo plena ciência de que esta assinatura possui validade legal equivalente à assinatura manuscrita.',
  ]
  const paragrafos = (ehDev ? DEVOLUCAO_PARAGRAFOS : config.termo_paragrafos)
    .map((p) => aplicarPlaceholders(p, config))

  // O texto pagina quando chega perto do rodapé — nenhuma cláusula é truncada
  for (const paragrafo of paragrafos) {
    const linhas = wrapText(paragrafo, 95)
    for (const linha of linhas) {
      if (y < 90) {
        desenharRodape(page)
        page = doc.addPage([W, H])
        y = desenharCabecalho(page)
        y -= 6
      }
      page.drawText(linha, { x: margin, y, size: 7, font: fontRegular, color: rgb(0.2, 0.2, 0.2) })
      y -= 11
    }
    y -= 4
  }

  y -= 8
  page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 0.5, color: rgb(0.85, 0.85, 0.85) })
  y -= 14

  // Se não couber o bloco de assinatura acima do rodapé, cria nova página
  if (y < MIN_ASSINATURA) {
    desenharRodape(page)
    page = doc.addPage([W, H])
    y = desenharCabecalho(page)
    y -= 6
  }

  // ── Assinatura ─────────────────────────────────────────────
  page.drawText('ASSINATURA ELETRÔNICA DO COLABORADOR', { x: margin, y, size: 8, font: fontBold, color: rgb(0.4, 0.4, 0.4) })
  y -= 13

  page.drawText(
    `Assinado em: ${formatDateTimeBR(ficha.assinado_em ?? new Date().toISOString())}`,
    { x: margin, y, size: 8, font: fontRegular }
  )
  y -= 12

  try {
    const base64Data = assinaturaBase64.replace(/^data:image\/\w+;base64,/, '')
    const imgBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0))
    const img = await doc.embedPng(imgBytes).catch(() => doc.embedJpg(imgBytes))
    const imgDims = img.scale(0.3)
    const imgH = Math.min(imgDims.height, 46)
    const imgW = Math.min(imgDims.width, 160)
    y -= imgH + 6
    page.drawImage(img, { x: margin, y, width: imgW, height: imgH })
  } catch {
    y -= 46
  }

  y -= 6
  page.drawLine({ start: { x: margin, y }, end: { x: margin + 200, y }, thickness: 1, color: rgb(0, 0, 0) })
  page.drawText(colaborador.nome, { x: margin, y: y - 12, size: 8, font: fontRegular })

  desenharRodape(page)
  return doc.save()
}

// ─── Relatório cumulativo por colaborador ─────────────────────────────────────

export async function gerarRelatorioColaboradorPDF(
  colaborador: Profile,
  fichas: FichaEntrega[]
): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const fontBold    = await doc.embedFont(StandardFonts.HelveticaBold)
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica)

  const W = 595, H = 842, margin = 50

  function novaPage() {
    const p = doc.addPage([W, H])
    p.drawRectangle({ x: 0, y: H - 80, width: W, height: 80, color: rgb(0.06, 0.09, 0.16) })
    p.drawText('OKTW', { x: margin, y: H - 46, size: 24, font: fontBold, color: rgb(1, 1, 1) })
    p.drawText('Relatório Histórico de EPIs — NR-6', {
      x: margin, y: H - 64, size: 9, font: fontRegular, color: rgb(0.72, 0.84, 1),
    })
    return p
  }

  function drawFooter(p: ReturnType<typeof doc.addPage>) {
    p.drawLine({ start: { x: margin, y: 55 }, end: { x: W - margin, y: 55 }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) })
    p.drawText('Sistema OKTW EPI Manager — Conforme NR-6 item 6.5.1 / Lei 14.063/2020', {
      x: margin, y: 40, size: 6.5, font: fontRegular, color: rgb(0.6, 0.6, 0.6),
    })
    p.drawText(`Gerado em ${formatDateTimeBR(new Date().toISOString())}`, {
      x: margin, y: 28, size: 6, font: fontRegular, color: rgb(0.6, 0.6, 0.6),
    })
  }

  let page = novaPage()
  let y = H - 110

  // Título
  page.drawText('HISTÓRICO DE FICHAS DE EPI', {
    x: margin, y, size: 11, font: fontBold, color: rgb(0.06, 0.09, 0.16),
  })
  y -= 6
  page.drawLine({ start: { x: margin, y }, end: { x: W - margin, y }, thickness: 1, color: rgb(0.06, 0.09, 0.16) })
  y -= 20

  // Dados do colaborador
  page.drawText('COLABORADOR', { x: margin, y, size: 8, font: fontBold, color: rgb(0.4, 0.4, 0.4) })
  y -= 16

  for (const [label, valor] of [
    ['Nome',  colaborador.nome],
    ['CPF',   colaborador.cpf  ?? '—'],
    ['CTPS',  colaborador.ctps ?? '—'],
    ['Cargo', colaborador.cargo ?? '—'],
    ['Setor', colaborador.setor ?? '—'],
  ] as [string, string][]) {
    page.drawText(`${label}:`, { x: margin, y, size: 8, font: fontBold })
    page.drawText(valor,       { x: margin + 80, y, size: 8, font: fontRegular })
    y -= 13
  }

  y -= 10
  page.drawLine({ start: { x: margin, y }, end: { x: W - margin, y }, thickness: 0.5, color: rgb(0.85, 0.85, 0.85) })
  y -= 16

  // Resumo
  const assinadas = fichas.filter((f) => f.assinado).length
  page.drawText('RESUMO', { x: margin, y, size: 8, font: fontBold, color: rgb(0.4, 0.4, 0.4) })
  y -= 16

  for (const [label, valor] of [
    ['Total de fichas', String(fichas.length)],
    ['Assinadas',       String(assinadas)],
    ['Pendentes',       String(fichas.length - assinadas)],
  ] as [string, string][]) {
    page.drawText(`${label}:`, { x: margin, y, size: 8, font: fontBold })
    page.drawText(valor,       { x: margin + 110, y, size: 8, font: fontRegular })
    y -= 13
  }

  if (fichas.length === 0) {
    y -= 16
    page.drawText('Nenhuma ficha registrada para este colaborador.', {
      x: margin, y, size: 9, font: fontRegular, color: rgb(0.5, 0.5, 0.5),
    })
    drawFooter(page)
    return doc.save()
  }

  y -= 10
  page.drawLine({ start: { x: margin, y }, end: { x: W - margin, y }, thickness: 0.5, color: rgb(0.85, 0.85, 0.85) })
  y -= 16

  page.drawText('FICHAS', { x: margin, y, size: 8, font: fontBold, color: rgb(0.4, 0.4, 0.4) })
  y -= 16

  const cols = { nome: margin + 10, ca: margin + 215, qtd: margin + 310, venc: margin + 368 }

  for (const ficha of fichas) {
    const nItems = ficha.itens?.length ?? 0
    const needed = 20 + (ficha.assinado_em ? 12 : 0) + (ficha.tipo === 'retirada' ? 12 : 0) + 14 + nItems * 14 + 16

    if (y - needed < 70) {
      drawFooter(page)
      page = novaPage()
      y = H - 110
    }

    // Barra de cabeçalho da ficha
    const tipoLabel = ficha.tipo === 'retirada' ? 'DEVOLUÇÃO' : 'ENTREGA'
    page.drawRectangle({
      x: margin - 4, y: y - 4, width: W - margin * 2 + 8, height: 18,
      color: rgb(0.93, 0.95, 0.98),
    })
    page.drawText(`${formatDateBR(ficha.data_entrega)}  ·  ${tipoLabel}`, {
      x: margin, y, size: 8, font: fontBold, color: rgb(0.06, 0.09, 0.16),
    })
    page.drawText(ficha.assinado ? 'ASSINADO' : 'PENDENTE', {
      x: W - margin - 55, y, size: 7, font: fontBold,
      color: ficha.assinado ? rgb(0.1, 0.55, 0.1) : rgb(0.75, 0.4, 0),
    })
    y -= 18

    if (ficha.assinado_em) {
      page.drawText(`Assinado em: ${formatDateTimeBR(ficha.assinado_em)}`, {
        x: margin + 10, y, size: 7, font: fontRegular, color: rgb(0.5, 0.5, 0.5),
      })
      y -= 12
    }

    // Motivo/observação da devolução (movimentação do ciclo de vida)
    if (ficha.tipo === 'retirada' && (ficha.motivo || ficha.observacao)) {
      const partes: string[] = []
      if (ficha.motivo) partes.push(`Motivo: ${MOTIVO_LABEL[ficha.motivo] ?? ficha.motivo}`)
      if (ficha.observacao) partes.push(`Obs.: ${ficha.observacao}`)
      page.drawText(partes.join('   ·   ').substring(0, 115), {
        x: margin + 10, y, size: 7, font: fontRegular, color: rgb(0.45, 0.45, 0.45),
      })
      y -= 12
    }

    // Cabeçalho da tabela de EPIs
    page.drawText('Equipamento', { x: cols.nome, y, size: 7, font: fontBold, color: rgb(0.4, 0.4, 0.4) })
    page.drawText('CA',          { x: cols.ca,   y, size: 7, font: fontBold, color: rgb(0.4, 0.4, 0.4) })
    page.drawText('Qtd',         { x: cols.qtd,  y, size: 7, font: fontBold, color: rgb(0.4, 0.4, 0.4) })
    page.drawText('Vencimento',  { x: cols.venc, y, size: 7, font: fontBold, color: rgb(0.4, 0.4, 0.4) })
    y -= 14

    for (const item of (ficha.itens ?? [])) {
      page.drawText((item.epi?.nome ?? '').substring(0, 38), { x: cols.nome, y, size: 7.5, font: fontRegular })
      page.drawText(formatCA(item.epi?.ca),                  { x: cols.ca,   y, size: 7.5, font: fontRegular })
      page.drawText(String(item.quantidade),                 { x: cols.qtd,  y, size: 7.5, font: fontRegular })
      page.drawText(formatDateBR(item.data_vencimento),      { x: cols.venc, y, size: 7.5, font: fontRegular })
      y -= 14
    }

    y -= 4
    page.drawLine({
      start: { x: margin, y }, end: { x: W - margin, y },
      thickness: 0.3, color: rgb(0.88, 0.88, 0.88),
    })
    y -= 12
  }

  drawFooter(page)

  // Anexa o PDF assinado de cada ficha ao final do relatório
  for (const ficha of fichas) {
    if (!ficha.pdf_url) continue
    try {
      const res = await fetch(ficha.pdf_url)
      if (!res.ok) continue
      const bytes = new Uint8Array(await res.arrayBuffer())
      const anexo = await PDFDocument.load(bytes)
      const paginas = await doc.copyPages(anexo, anexo.getPageIndices())
      paginas.forEach((p) => doc.addPage(p))
    } catch {
      /* ignora anexo com erro de download/leitura */
    }
  }

  return doc.save()
}
