'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Trash2, Loader2, FileText, ChevronRight } from 'lucide-react'
import { formatDateBR } from '@/lib/utils'
import type { FichaEntrega } from '@/types/database'

const PALAVRA_CONFIRMACAO = 'EXCLUIR'

export function EntregasTableClient({ fichas }: { fichas: FichaEntrega[] }) {
  const router = useRouter()
  const [target, setTarget] = useState<FichaEntrega | null>(null)
  const [palavra, setPalavra] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function openDelete(ficha: FichaEntrega) {
    setTarget(ficha)
    setPalavra('')
    setError(null)
  }

  function closeDelete() {
    setTarget(null)
    setPalavra('')
    setError(null)
  }

  async function handleDelete() {
    if (!target || palavra !== PALAVRA_CONFIRMACAO) return
    setDeleting(true)
    setError(null)
    const res = await fetch(`/api/fichas/${target.id}`, { method: 'DELETE' })
    const json = await res.json()
    if (!res.ok) {
      setError(json.error || 'Erro ao excluir.')
      setDeleting(false)
      return
    }
    closeDelete()
    router.refresh()
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Colaborador</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>EPIs</TableHead>
            <TableHead>Assinatura</TableHead>
            <TableHead>PDF</TableHead>
            <TableHead className="w-24 text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {fichas.map((ficha) => (
            <TableRow key={ficha.id}>
              <TableCell className="font-medium">{ficha.colaborador?.nome}</TableCell>
              <TableCell>
                <Badge variant={ficha.tipo === 'retirada' ? 'outline' : 'secondary'}>
                  {ficha.tipo === 'retirada' ? 'Retirada' : 'Entrega'}
                </Badge>
              </TableCell>
              <TableCell>{formatDateBR(ficha.data_entrega)}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {ficha.itens?.slice(0, 3).map((item) => (
                    <span key={item.id} className="text-xs bg-slate-100 rounded px-1.5 py-0.5">
                      {item.epi?.nome}
                    </span>
                  ))}
                  {(ficha.itens?.length ?? 0) > 3 && (
                    <span className="text-xs text-muted-foreground">
                      +{(ficha.itens?.length ?? 0) - 3}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={ficha.assinado ? 'success' : 'warning'}>
                  {ficha.assinado ? 'Assinado' : 'Pendente'}
                </Badge>
              </TableCell>
              <TableCell>
                {ficha.pdf_url ? (
                  <a href={ficha.pdf_url} target="_blank" rel="noopener noreferrer">
                    <FileText className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                  </a>
                ) : '—'}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/colaboradores/${ficha.colaborador_id}`}>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openDelete(ficha)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Dialog com confirmação por palavra */}
      <Dialog open={!!target} onOpenChange={(o) => { if (!o) closeDelete() }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir ficha de entrega</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-2">
                <p>
                  Você está prestes a excluir a ficha de <strong>{target?.colaborador?.nome}</strong>
                  {target?.data_entrega ? <>{' '}de <strong>{formatDateBR(target.data_entrega)}</strong></> : ''}.
                </p>
                <p className="text-destructive font-medium">
                  Isso removerá permanentemente a ficha, os itens, a assinatura e o PDF associados.
                  Esta ação não pode ser desfeita.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 pt-2">
            <Label className="text-sm">
              Digite <span className="font-mono font-bold text-destructive">{PALAVRA_CONFIRMACAO}</span> para confirmar:
            </Label>
            <Input
              value={palavra}
              onChange={(e) => setPalavra(e.target.value.toUpperCase())}
              placeholder={PALAVRA_CONFIRMACAO}
              className="font-mono"
              autoComplete="off"
            />
          </div>

          {error && <p className="text-sm text-destructive bg-red-50 p-3 rounded-md">{error}</p>}

          <DialogFooter>
            <Button variant="outline" onClick={closeDelete} disabled={deleting}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting || palavra !== PALAVRA_CONFIRMACAO}
            >
              {deleting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Excluir ficha
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
