'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { formatDateBR } from '@/lib/utils'
import type { FichaEntrega, OperacaoEpi } from '@/types/database'

const TIPO_LABEL: Record<string, string> = {
  devolucao:    'Devolução',
  substituicao: 'Substituição',
  higienizacao: 'Higienização',
}

const TIPO_VARIANT: Record<string, 'default' | 'secondary' | 'outline'> = {
  devolucao:    'default',
  substituicao: 'secondary',
  higienizacao: 'outline',
}

type Props = {
  colaboradorId: string
  fichas: FichaEntrega[]
  operacoes: OperacaoEpi[]
}

export function OperacoesEpiPanel({ colaboradorId, fichas, operacoes }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    tipo: 'devolucao',
    ficha_id: '',
    epi_id: '',
    data_operacao: new Date().toISOString().split('T')[0],
    observacao: '',
  })

  const fichasAssinadas = fichas.filter((f) => f.assinado)
  const fichaSelected = fichasAssinadas.find((f) => f.id === form.ficha_id)
  const itensDisponivel = fichaSelected?.itens ?? []

  function update(field: string, value: string) {
    setForm((prev) => {
      const next = { ...prev, [field]: value }
      if (field === 'ficha_id') next.epi_id = ''
      return next
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const res = await fetch(`/api/colaboradores/${colaboradorId}/operacoes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const json = await res.json()
    if (!res.ok) {
      setError(json.error || 'Erro ao registrar operação.')
      setSaving(false)
      return
    }
    setOpen(false)
    setForm({ tipo: 'devolucao', ficha_id: '', epi_id: '', data_operacao: new Date().toISOString().split('T')[0], observacao: '' })
    router.refresh()
    setSaving(false)
  }

  return (
    <>
      <Card>
        <CardHeader className="flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Ciclo de vida dos EPIs</CardTitle>
          <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Registrar operação
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {operacoes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhuma operação registrada
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>EPI</TableHead>
                  <TableHead>Observação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {operacoes.map((op) => (
                  <TableRow key={op.id}>
                    <TableCell className="text-sm">{formatDateBR(op.data_operacao)}</TableCell>
                    <TableCell>
                      <Badge variant={TIPO_VARIANT[op.tipo] ?? 'default'}>
                        {TIPO_LABEL[op.tipo] ?? op.tipo}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {(op as { epi?: { nome: string; ca: string } }).epi?.nome ?? '—'}
                      {(op as { epi?: { nome: string; ca: string } }).epi?.ca
                        ? <span className="text-muted-foreground ml-1 text-xs">CA {(op as { epi?: { nome: string; ca: string } }).epi!.ca}</span>
                        : null}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{op.observacao ?? '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar operação de EPI</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Tipo de operação *</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                value={form.tipo}
                onChange={(e) => update('tipo', e.target.value)}
                required
              >
                <option value="devolucao">Devolução</option>
                <option value="substituicao">Substituição</option>
                <option value="higienizacao">Higienização</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Ficha de entrega *</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                value={form.ficha_id}
                onChange={(e) => update('ficha_id', e.target.value)}
                required
              >
                <option value="">Selecione uma ficha...</option>
                {fichasAssinadas.map((f) => (
                  <option key={f.id} value={f.id}>
                    {formatDateBR(f.data_entrega)} — {f.itens?.map((i) => i.epi?.nome).join(', ')}
                  </option>
                ))}
              </select>
            </div>

            {form.ficha_id && (
              <div className="space-y-2">
                <Label>EPI *</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  value={form.epi_id}
                  onChange={(e) => update('epi_id', e.target.value)}
                  required
                >
                  <option value="">Selecione o EPI...</option>
                  {itensDisponivel.map((item) => (
                    <option key={item.id} value={item.epi_id}>
                      {item.epi?.nome} (CA {item.epi?.ca})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Data da operação *</Label>
              <Input
                type="date"
                value={form.data_operacao}
                onChange={(e) => update('data_operacao', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Observação</Label>
              <Input
                value={form.observacao}
                onChange={(e) => update('observacao', e.target.value)}
                placeholder="Motivo, número de série, etc."
              />
            </div>

            {error && <p className="text-sm text-destructive bg-red-50 p-3 rounded-md">{error}</p>}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={saving}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving || !form.ficha_id || !form.epi_id}>
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Registrar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
