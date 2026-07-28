'use client'

import { useState } from 'react'
import { Mail, MessageCircle, Loader2, Check, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { linkAssinaturaWhatsApp } from '@/lib/whatsapp'
import type { FichaEntrega } from '@/types/database'

type Props = {
  ficha: FichaEntrega
  size?: 'sm' | 'default'
  /** compacto = só ícones (para tabelas) */
  compact?: boolean
}

/**
 * Botões de escolha de canal para enviar o link de assinatura de uma ficha pendente.
 * - E-mail: dispara o envio automático via Resend (rota /api/email/assinatura-pendente).
 * - WhatsApp: abre o WhatsApp (modelo grátis wa.me) com a mensagem e o link prontos.
 */
export function EnviarAssinatura({ ficha, size = 'sm', compact = false }: Props) {
  const [enviando, setEnviando] = useState(false)
  const [status, setStatus] = useState<'idle' | 'ok' | 'erro'>('idle')

  const temEmail = !!ficha.colaborador?.email
  const linkWhats = linkAssinaturaWhatsApp(ficha)

  async function enviarEmail() {
    setEnviando(true)
    setStatus('idle')
    try {
      const res = await fetch('/api/email/assinatura-pendente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fichaId: ficha.id }),
      })
      setStatus(res.ok ? 'ok' : 'erro')
    } catch {
      setStatus('erro')
    } finally {
      setEnviando(false)
      setTimeout(() => setStatus('idle'), 4000)
    }
  }

  function enviarWhatsApp() {
    if (linkWhats) window.open(linkWhats, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size={size}
        onClick={enviarEmail}
        disabled={enviando || !temEmail}
        title={temEmail ? 'Enviar link por e-mail' : 'Colaborador sem e-mail cadastrado'}
      >
        {enviando ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : status === 'ok' ? (
          <Check className="h-4 w-4 text-green-600" />
        ) : status === 'erro' ? (
          <AlertCircle className="h-4 w-4 text-destructive" />
        ) : (
          <Mail className="h-4 w-4" />
        )}
        {!compact && <span className="ml-1.5">{status === 'ok' ? 'Enviado' : 'E-mail'}</span>}
      </Button>

      <Button
        type="button"
        variant="outline"
        size={size}
        onClick={enviarWhatsApp}
        disabled={!linkWhats}
        title={linkWhats ? 'Abrir WhatsApp com o link' : 'Colaborador sem telefone cadastrado'}
        className={linkWhats ? 'border-green-300 text-green-700 hover:bg-green-50 hover:text-green-800' : ''}
      >
        <MessageCircle className="h-4 w-4" />
        {!compact && <span className="ml-1.5">WhatsApp</span>}
      </Button>
    </div>
  )
}
