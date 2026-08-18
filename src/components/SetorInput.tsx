'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { ArrowLeft } from 'lucide-react'

const NOVO = '__novo__'

type Props = {
  value: string
  onChange: (value: string) => void
}

/**
 * Campo de Setor no mesmo estilo do "Perfil": um Select com os setores já
 * cadastrados e, na última linha, "+ Novo setor" — que abre um campo para
 * digitar um novo setor (armazenado junto ao colaborador ao salvar).
 */
export function SetorInput({ value, onChange }: Props) {
  const [setores, setSetores] = useState<string[]>([])
  const [modoNovo, setModoNovo] = useState(false)

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

  // Garante que o valor atual apareça na lista (ex.: setor personalizado ao editar).
  const opcoes = useMemo(() => {
    const s = new Set(setores)
    if (value) s.add(value)
    return Array.from(s).sort((a, b) => a.localeCompare(b, 'pt-BR'))
  }, [setores, value])

  // Modo "digitar novo setor"
  if (modoNovo) {
    return (
      <div className="space-y-1.5">
        <Input
          autoFocus
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Digite o nome do novo setor"
        />
        <button
          type="button"
          onClick={() => { setModoNovo(false); onChange('') }}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-3 w-3" /> Escolher da lista
        </button>
      </div>
    )
  }

  return (
    <Select
      value={value || undefined}
      onValueChange={(v) => {
        if (v === NOVO) { setModoNovo(true); onChange('') }
        else onChange(v)
      }}
    >
      <SelectTrigger>
        <SelectValue placeholder="Selecione o setor" />
      </SelectTrigger>
      <SelectContent>
        {opcoes.map((s) => (
          <SelectItem key={s} value={s}>{s}</SelectItem>
        ))}
        <SelectItem value={NOVO} className="mt-1 border-t border-slate-100 font-medium text-blue-600">
          + Novo setor
        </SelectItem>
      </SelectContent>
    </Select>
  )
}
