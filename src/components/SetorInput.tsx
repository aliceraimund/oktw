'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import * as SelectPrimitive from '@radix-ui/react-select'
import { Check, Trash2, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const NOVO = '__novo__'

type Props = {
  value: string
  onChange: (value: string) => void
}

/**
 * Setor no estilo do "Perfil": Select com os setores cadastrados, cada linha
 * com uma lixeira para removê-lo da lista (não afeta colaboradores). A última
 * linha "+ Novo setor" abre um campo para criar e armazenar um novo setor.
 */
export function SetorInput({ value, onChange }: Props) {
  const [setores, setSetores] = useState<string[]>([])
  const [modoNovo, setModoNovo] = useState(false)
  const [novoNome, setNovoNome] = useState('')

  const recarregar = useCallback(async () => {
    const { data } = await createClient().from('setores').select('nome').order('nome')
    setSetores((data ?? []).map((r: { nome: string }) => r.nome))
  }, [])

  useEffect(() => { recarregar() }, [recarregar])

  // Garante que o valor atual apareça na lista (ex.: setor removido, mas ainda no colaborador).
  const opcoes = useMemo(() => {
    const s = new Set(setores)
    if (value) s.add(value)
    return Array.from(s).sort((a, b) => a.localeCompare(b, 'pt-BR'))
  }, [setores, value])

  async function apagar(nome: string) {
    if (!confirm(`Remover o setor "${nome}" da lista de sugestões?\n\nOs colaboradores que já têm esse setor não são afetados.`)) return
    await createClient().from('setores').delete().eq('nome', nome)
    await recarregar()
  }

  async function adicionarNovo() {
    const nome = novoNome.trim()
    if (!nome) return
    await createClient().from('setores').upsert({ nome }, { onConflict: 'nome' })
    await recarregar()
    onChange(nome)
    setModoNovo(false)
    setNovoNome('')
  }

  // Modo "digitar novo setor"
  if (modoNovo) {
    return (
      <div className="space-y-1.5">
        <div className="flex gap-2">
          <Input
            autoFocus
            value={novoNome}
            onChange={(e) => setNovoNome(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); adicionarNovo() } }}
            placeholder="Nome do novo setor"
          />
          <Button type="button" size="sm" onClick={adicionarNovo} disabled={!novoNome.trim()}>
            Adicionar
          </Button>
        </div>
        <button
          type="button"
          onClick={() => { setModoNovo(false); setNovoNome('') }}
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
        if (v === NOVO) { setModoNovo(true) }
        else onChange(v)
      }}
    >
      <SelectTrigger>
        <SelectValue placeholder="Selecione o setor" />
      </SelectTrigger>
      <SelectContent>
        {opcoes.map((s) => (
          <SelectPrimitive.Item
            key={s}
            value={s}
            className="relative flex w-full cursor-default select-none items-center justify-between rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground"
          >
            <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
              <SelectPrimitive.ItemIndicator>
                <Check className="h-4 w-4" />
              </SelectPrimitive.ItemIndicator>
            </span>
            <SelectPrimitive.ItemText>{s}</SelectPrimitive.ItemText>
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onPointerUp={(e) => e.stopPropagation()}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); apagar(s) }}
              aria-label={`Apagar setor ${s}`}
              title="Remover da lista"
              className="ml-2 shrink-0 text-slate-400 hover:text-red-600"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </SelectPrimitive.Item>
        ))}
        <SelectItem value={NOVO} className="mt-1 border-t border-slate-100 font-medium text-blue-600">
          + Novo setor
        </SelectItem>
      </SelectContent>
    </Select>
  )
}
