'use client'

import { useState } from 'react'
import { UserPlus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SetorInput } from '@/components/SetorInput'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import type { Profile } from '@/types/database'

type Props = {
  onCreated: (colaborador: Profile) => void
}

const formVazio = {
  nome: '',
  email: '',
  senha: '',
  role: 'colaborador',
  setor: '',
  cargo: '',
  cpf: '',
  ctps: '',
  telefone: '',
}

export function NovoColaboradorDialog({ onCreated }: Props) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState(formVazio)

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const res = await fetch('/api/colaboradores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const json = await res.json()
    if (!res.ok) {
      setError(json.error || 'Erro ao criar colaborador.')
      setSaving(false)
      return
    }

    const novo: Profile = {
      id: json.userId,
      nome: form.nome,
      email: form.email,
      role: form.role as Profile['role'],
      setor: form.setor || null,
      cargo: form.cargo || null,
      cpf: form.cpf || null,
      ctps: form.ctps || null,
      telefone: form.telefone || null,
      ativo: true,
      created_at: new Date().toISOString(),
    }

    onCreated(novo)
    setForm(formVazio)
    setOpen(false)
    setSaving(false)
  }

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        <UserPlus className="h-4 w-4 mr-1.5" />
        Novo
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo colaborador</DialogTitle>
            <DialogDescription>
              Cadastre um colaborador sem sair da tela de entrega.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label>Nome completo *</Label>
                <Input value={form.nome} onChange={(e) => update('nome', e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>E-mail *</Label>
                <Input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>Senha inicial *</Label>
                <Input type="password" value={form.senha} onChange={(e) => update('senha', e.target.value)} required minLength={6} />
              </div>
              <div className="space-y-1.5">
                <Label>Perfil *</Label>
                <Select value={form.role} onValueChange={(v) => update('role', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="colaborador">Colaborador</SelectItem>
                    <SelectItem value="gestor">Gestor</SelectItem>
                    <SelectItem value="rh">RH / Segurança</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Cargo</Label>
                <Input value={form.cargo} onChange={(e) => update('cargo', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Setor</Label>
                <SetorInput value={form.setor} onChange={(v) => update('setor', v)} />
              </div>
              <div className="space-y-1.5">
                <Label>CPF</Label>
                <Input value={form.cpf} onChange={(e) => update('cpf', e.target.value)} placeholder="Ex: 000.000.000-00" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>WhatsApp / Telefone</Label>
                <Input value={form.telefone} onChange={(e) => update('telefone', e.target.value)} placeholder="Ex: (11) 99999-9999" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>CTPS (nº série / UF)</Label>
                <Input value={form.ctps} onChange={(e) => update('ctps', e.target.value)} placeholder="Ex: 043978-00014-CE" />
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
