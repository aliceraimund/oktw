'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Loader2, Trash2 } from 'lucide-react'
import type { Epi } from '@/types/database'

export default function EditarEpiPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDelete, setShowDelete] = useState(false)

  const [form, setForm] = useState({
    nome: '',
    ca: '',
    validade_dias: 365,
    ativo: true,
  })

  useEffect(() => {
    supabase.from('epis').select('*').eq('id', id).single().then(({ data }) => {
      if (data) {
        const epi = data as Epi
        setForm({
          nome: epi.nome,
          ca: epi.ca,
          validade_dias: epi.validade_dias,
          ativo: epi.ativo ?? true,
        })
      }
      setLoading(false)
    })
  }, [id])

  function update(field: string, value: string | number | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const res = await fetch(`/api/epis/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const json = await res.json()
    if (!res.ok) { setError(json.error || 'Erro ao salvar.'); setSaving(false); return }
    router.push('/epis')
    router.refresh()
  }

  async function handleDelete() {
    setDeleting(true)
    const res = await fetch(`/api/epis/${id}`, { method: 'DELETE' })
    const json = await res.json()
    if (!res.ok) {
      setError(json.error || 'Erro ao excluir.')
      setDeleting(false)
      setShowDelete(false)
      return
    }
    router.push('/epis')
    router.refresh()
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  )

  return (
    <div>
      <Header
        title="Editar EPI"
        subtitle="Atualizar dados do equipamento"
        actions={
          <Button variant="destructive" size="sm" onClick={() => setShowDelete(true)}>
            <Trash2 className="h-4 w-4 mr-2" />
            Excluir EPI
          </Button>
        }
      />
      <div className="p-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Dados do EPI</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label>Nome do EPI *</Label>
                  <Input value={form.nome} onChange={(e) => update('nome', e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Número CA *</Label>
                  <Input value={form.ca} onChange={(e) => update('ca', e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Validade padrão (dias) *</Label>
                  <Input type="number" min={1} value={form.validade_dias}
                    onChange={(e) => update('validade_dias', parseInt(e.target.value))} required />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                    value={form.ativo ? 'ativo' : 'inativo'}
                    onChange={(e) => update('ativo', e.target.value === 'ativo')}
                  >
                    <option value="ativo">Ativo</option>
                    <option value="inativo">Inativo</option>
                  </select>
                </div>
              </div>

              {error && <p className="text-sm text-destructive bg-red-50 p-3 rounded-md">{error}</p>}

              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Salvar alterações
                </Button>
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Dialog de confirmação de exclusão */}
      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir EPI</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir <strong>{form.nome}</strong>?
              Esta ação não pode ser desfeita. EPIs com entregas registradas não podem ser excluídos
              (apenas desativados).
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDelete(false)} disabled={deleting}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
