'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Input } from '@/components/ui/input'

type Props = {
  value: string
  onChange: (value: string) => void
  id?: string
}

/**
 * Campo de Setor com sugestões dos setores já cadastrados (datalist) e a
 * possibilidade de digitar um novo. Busca a lista de setores sozinho.
 */
export function SetorInput({ value, onChange, id = 'setores-datalist' }: Props) {
  const [setores, setSetores] = useState<string[]>([])

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('profiles')
      .select('setor')
      .not('setor', 'is', null)
      .then(({ data }) => {
        const unicos = Array.from(
          new Set((data ?? []).map((r: { setor: string | null }) => r.setor).filter(Boolean))
        ) as string[]
        setSetores(unicos.sort((a, b) => a.localeCompare(b, 'pt-BR')))
      })
  }, [])

  return (
    <>
      <Input
        list={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Selecione ou digite um novo setor"
      />
      <datalist id={id}>
        {setores.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
    </>
  )
}
