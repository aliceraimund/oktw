import { Resend } from 'resend'
import type { FichaEntrega, ItemEntrega, AlertaTipo } from '@/types/database'
import { formatDateBR, formatCA } from './utils'

const resend = new Resend(process.env.RESEND_API_KEY)
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
// Domínio oktwgroup.com verificado no Resend (região sa-east-1)
const FROM = 'OKTW EPI Manager <epi@oktwgroup.com>'

export async function enviarEmailAssinaturaPendente(ficha: FichaEntrega) {
  const link = `${APP_URL}/entregas/${ficha.token_assinatura}/assinar`
  const colaborador = ficha.colaborador!
  const itens = ficha.itens ?? []
  const ehDev = ficha.tipo === 'retirada'

  const itensHtml = itens.map((item, i) => `
    <tr style="background:${i % 2 === 0 ? '#f1f5f9' : '#fff'}">
      <td style="padding:8px 12px">${item.epi?.nome ?? '—'}</td>
      <td style="padding:8px 12px">${formatCA(item.epi?.ca)}</td>
      <td style="padding:8px 12px;text-align:center">${item.quantidade}</td>
      <td style="padding:8px 12px">${formatDateBR(item.data_vencimento)}</td>
    </tr>
  `).join('')

  await resend.emails.send({
    from: FROM,
    to: colaborador.email,
    subject: ehDev ? 'Confirme a devolução dos seus EPIs' : 'Confirme o recebimento dos seus EPIs',
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#1e293b">Olá, ${colaborador.nome}!</h2>
        <p>${ehDev
          ? `Registramos a devolução dos EPIs abaixo em <strong>${formatDateBR(ficha.data_entrega)}</strong>. Confirme assinando eletronicamente:`
          : `Você recebeu EPIs em <strong>${formatDateBR(ficha.data_entrega)}</strong> que precisam de confirmação de recebimento:`}</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <thead>
            <tr style="background:#0f172a;color:#fff">
              <th style="padding:8px 12px;text-align:left">EPI</th>
              <th style="padding:8px 12px;text-align:left">CA</th>
              <th style="padding:8px 12px;text-align:center">Qtd</th>
              <th style="padding:8px 12px;text-align:left">Vencimento</th>
            </tr>
          </thead>
          <tbody>${itensHtml}</tbody>
        </table>
        <a href="${link}" style="display:inline-block;background:#0f172a;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;margin-top:8px">
          ${ehDev ? 'Assinar devolução' : 'Assinar recebimento'}
        </a>
        <p style="color:#64748b;font-size:12px;margin-top:24px">
          ${ehDev
            ? 'Ao assinar, você confirma a devolução dos equipamentos à empresa (NR-6).'
            : 'Ao assinar, você confirma o recebimento dos equipamentos e declara ter lido o Termo de Responsabilidade (NR-6).'}<br/>
          Este link é único e pessoal. Não compartilhe com outras pessoas.
        </p>
      </div>
    `,
  })
}

export async function enviarAlertaVencimento(
  item: ItemEntrega,
  tipo: AlertaTipo
) {
  const colaborador = item.ficha?.colaborador
  const epi = item.epi

  if (!colaborador?.email || !epi) return

  const mensagens = {
    '30d':    { emoji: '🟡', texto: 'vence em 30 dias' },
    '15d':    { emoji: '🟠', texto: 'vence em 15 dias' },
    '7d':     { emoji: '🔴', texto: 'vence em 7 dias' },
    vencido:  { emoji: '⛔', texto: 'está VENCIDO' },
  }
  const { emoji, texto } = mensagens[tipo]

  await resend.emails.send({
    from: FROM,
    to: colaborador.email,
    subject: `${emoji} EPI ${epi.nome} ${texto}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#1e293b">${emoji} Atenção ao vencimento do EPI</h2>
        <p>Olá, <strong>${colaborador.nome}</strong>!</p>
        <p>O EPI abaixo <strong>${texto}</strong>. Providencie a substituição com seu gestor.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr style="background:#f1f5f9">
            <td style="padding:8px 12px;font-weight:600">EPI</td>
            <td style="padding:8px 12px">${epi.nome}</td>
          </tr>
          <tr>
            <td style="padding:8px 12px;font-weight:600">CA</td>
            <td style="padding:8px 12px">${formatCA(epi.ca)}</td>
          </tr>
          <tr style="background:#f1f5f9">
            <td style="padding:8px 12px;font-weight:600">Vencimento</td>
            <td style="padding:8px 12px">${formatDateBR(item.data_vencimento)}</td>
          </tr>
        </table>
        <p style="color:#64748b;font-size:12px">
          OKTW — Sistema de Gestão de EPIs (NR-6)
        </p>
      </div>
    `,
  })
}
