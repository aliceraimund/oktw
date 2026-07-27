'use client'

import { useState } from 'react'
import { PackagePlus, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import type { Epi } from '@/types/database'

type Props = {
  onCreated: (epi: Epi) => void
}

const formVazio = {
  nome: '',
  ca: '',
  validade_dias: 365,
  validade_ca: '',
}

export function NovoEpiDialog({ onCreated }: Props) {
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState(formVazio)

  function update(field: string, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const { data, error: insertError } = await supabase
      .from('epis')
      .insert([{ ...form, validade_ca: form.validade_ca || null }])
      .select()
      .single()

    if (insertError || !data) {
      setError(insertError?.message || 'Erro ao criar EPI.')
      setSaving(false)
      return
    }

    onCreated(data as Epi)
    setForm(formVazio)
    setOpen(false)
    setSaving(false)
  }

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        <PackagePlus className="h-4 w-4 mr-1.5" />
        Novo
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo EPI no catálogo</DialogTitle>
            <DialogDescription>
              Cadastre um equipamento sem sair da tela de entrega.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label>Nome do EPI *</Label>
                <Input value={form.nome} onChange={(e) => update('nome', e.target.value)} required placeholder="Ex: Capacete de segurança" />
              </div>
              <div className="space-y-1.5">
                <Label>Número CA *</Label>
                <Input value={form.ca} onChange={(e) => update('ca', e.target.value)} required placeholder="Ex: 12345" />
              </div>
              <div className="space-y-1.5">
                <Label>Validade do CA (data)</Label>
                <Input type="date" value={form.validade_ca} onChange={(e) => update('validade_ca', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Validade padrão (dias) *</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.validade_dias}
                  onChange={(e) => update('validade_dias', parseInt(e.target.value))}
                  required
                />
              </div>
            </div>

            {error && <p className="text-sm text-destructive bg-red-50 p-3 rounded-md">{error}</p>}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={saving}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Criar e selecionar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
