import type { FichaEntrega, Profile, Epi } from '@/types/database'
import { formatDateBR, formatCA } from './utils'

// Endereço base do sistema (usado nos links de assinatura enviados por WhatsApp).
// No cliente, NEXT_PUBLIC_APP_URL é embutido no build; cai para o origin atual se faltar.
function appUrl(): string {
  const env = process.env.NEXT_PUBLIC_APP_URL
  if (env) return env.replace(/\/$/, '')
  if (typeof window !== 'undefined') return window.location.origin
  return ''
}

/**
 * Normaliza um telefone brasileiro para o formato do wa.me (só dígitos, com DDI 55).
 * Aceita entradas como "(11) 99999-9999", "11999999999", "+55 11 99999-9999".
 * Retorna null se não houver dígitos suficientes.
 */
export function normalizarTelefone(telefone: string | null | undefined): string | null {
  if (!telefone) return null
  let digitos = telefone.replace(/\D/g, '')
  if (digitos.length < 10) return null
  // Se já vier com DDI 55 (12 ou 13 dígitos), mantém. Senão, adiciona 55.
  if (!(digitos.length >= 12 && digitos.startsWith('55'))) {
    digitos = '55' + digitos
  }
  return digitos
}

/** Monta a URL wa.me com a mensagem já preenchida. Retorna null se telefone inválido. */
export function linkWhatsApp(telefone: string | null | undefined, mensagem: string): string | null {
  const num = normalizarTelefone(telefone)
  if (!num) return null
  return `https://wa.me/${num}?text=${encodeURIComponent(mensagem)}`
}

/** Mensagem + link de assinatura de uma ficha pendente. */
export function mensagemAssinatura(ficha: FichaEntrega): string {
  const nome = ficha.colaborador?.nome ?? 'Colaborador'
  const link = `${appUrl()}/entregas/${ficha.token_assinatura}/assinar`
  const tipo = ficha.tipo === 'retirada' ? 'a devolução' : 'o recebimento'
  return (
    `Olá, ${nome}! ` +
    `Você tem uma ficha de EPI aguardando sua assinatura. ` +
    `Confirme ${tipo} dos equipamentos assinando eletronicamente neste link:\n${link}\n\n` +
    `*Importante:* ao abrir o link, *permita o acesso à sua localização* quando o navegador pedir — isso reforça a validade jurídica da sua assinatura.\n\n` +
    `Este link é pessoal e único. Não compartilhe.`
  )
}

/** Link wa.me pronto para a assinatura de uma ficha (ou null se sem telefone). */
export function linkAssinaturaWhatsApp(ficha: FichaEntrega): string | null {
  return linkWhatsApp(ficha.colaborador?.telefone, mensagemAssinatura(ficha))
}

/** Mensagem de lembrete de EPI vencido para troca. */
export function mensagemVencimento(
  colaborador: Pick<Profile, 'nome'>,
  epi: Pick<Epi, 'nome' | 'ca'>,
  dataVencimento: string
): string {
  return (
    `Olá, ${colaborador.nome}! ` +
    `O seu EPI "${epi.nome}" (${formatCA(epi.ca)}) venceu em ${formatDateBR(dataVencimento)}. ` +
    `Procure o setor responsável para providenciar a troca o quanto antes. ` +
    `O uso de EPI vencido não é permitido pela NR-6.`
  )
}

/** Link wa.me pronto para o lembrete de vencimento (ou null se sem telefone). */
export function linkVencimentoWhatsApp(
  colaborador: Pick<Profile, 'nome' | 'telefone'>,
  epi: Pick<Epi, 'nome' | 'ca'>,
  dataVencimento: string
): string | null {
  return linkWhatsApp(colaborador.telefone, mensagemVencimento(colaborador, epi, dataVencimento))
}
