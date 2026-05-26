'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2 } from 'lucide-react'

export default function NovoColaboradorPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    nome: '',
    email: '',
    senha: '',
    role: 'colaborador',
    setor: '',
    cargo: '',
    ctps: '',
  })

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Criar usuário via Supabase Auth Admin (usa API route para ter service_role)
    const res = await fetch('/api/colaboradores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    const json = await res.json()
    if (!res.ok) {
      setError(json.error || 'Erro ao criar colaborador.')
      setLoading(false)
      return
    }

    router.push('/colaboradores')
    router.refresh()
  }

  return (
    <div>
      <Header title="Novo colaborador" subtitle="Cadastrar novo usuário no sistema" />
      <div className="p-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Dados do colaborador</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome completo *</Label>
                  <Input value={form.nome} onChange={(e) => update('nome', e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>E-mail *</Label>
                  <Input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Senha inicial *</Label>
                  <Input type="password" value={form.senha} onChange={(e) => update('senha', e.target.value)} required minLength={6} />
                </div>
                <div className="space-y-2">
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
                <div className="space-y-2">
                  <Label>Setor</Label>
                  <Input value={form.setor} onChange={(e) => update('setor', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Cargo</Label>
                  <Input value={form.cargo} onChange={(e) => update('cargo', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>CTPS (nº série / UF)</Label>
                  <Input value={form.ctps} onChange={(e) => update('ctps', e.target.value)} placeholder="Ex: 043978-00014-CE" />
                </div>
              </div>

              {error && <p className="text-sm text-destructive bg-red-50 p-3 rounded-md">{error}</p>}

              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Criar colaborador
                </Button>
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
