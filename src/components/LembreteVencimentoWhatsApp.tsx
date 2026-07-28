'use client'

import { MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { linkVencimentoWhatsApp } from '@/lib/whatsapp'
import type { Profile, Epi } from '@/types/database'

type Props = {
  colaborador: Pick<Profile, 'nome' | 'telefone'> | undefined | null
  epi: Pick<Epi, 'nome' | 'ca'> | undefined | null
  dataVencimento: string
  size?: 'sm' | 'icon'
}

/**
 * Botão que abre o WhatsApp (modelo grátis wa.me) com um lembrete pronto de
 * EPI vencido para troca. Fica desabilitado se o colaborador não tiver telefone.
 */
export function LembreteVencimentoWhatsApp({ colaborador, epi, dataVencimento, size = 'sm' }: Props) {
  const link =
    colaborador && epi
      ? linkVencimentoWhatsApp(colaborador, epi, dataVencimento)
      : null

  function abrir() {
    if (link) window.open(link, '_blank', 'noopener,noreferrer')
  }

  if (size === 'icon') {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={abrir}
        disabled={!link}
        title={link ? 'Lembrar troca por WhatsApp' : 'Colaborador sem telefone cadastrado'}
        className={link ? 'text-green-600 hover:text-green-700 hover:bg-green-50' : ''}
      >
        <MessageCircle className="h-4 w-4" />
      </Button>
    )
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={abrir}
      disabled={!link}
      title={link ? 'Lembrar troca por WhatsApp' : 'Colaborador sem telefone cadastrado'}
      className={link ? 'border-green-300 text-green-700 hover:bg-green-50 hover:text-green-800' : ''}
    >
      <MessageCircle className="h-4 w-4 mr-1.5" />
      Lembrar troca
    </Button>
  )
}
