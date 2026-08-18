'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Pencil, Trash2, Loader2 } from 'lucide-react'
import { formatCA, formatDateBR } from '@/lib/utils'
import type { Epi } from '@/types/database'

export function EpisTableClient({ epis }: { epis: Epi[] }) {
  const router = useRouter()
  const hoje = new Date().toISOString().slice(0, 10)
  const [target, setTarget] = useState<Epi | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete() {
    if (!target) return
    setDeleting(true)
    setError(null)
    const res = await fetch(`/api/epis/${target.id}`, { method: 'DELETE' })
    const json = await res.json()
    if (!res.ok) {
      setError(json.error || 'Erro ao excluir.')
      setDeleting(false)
      return
    }
    setTarget(null)
    router.refresh()
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>CA</TableHead>
            <TableHead>Validade do CA</TableHead>
            <TableHead>Vida útil por uso (dias)</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-20 text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {epis.map((epi) => (
            <TableRow key={epi.id}>
              <TableCell className="font-medium">{epi.nome}</TableCell>
              <TableCell className="font-mono text-sm">{formatCA(epi.ca)}</TableCell>
              <TableCell className="text-muted-foreground">
                {epi.validade_ca ? (
                  <span className="inline-flex items-center gap-2">
                    {formatDateBR(epi.validade_ca)}
                    {epi.validade_ca < hoje && (
                      <Badge variant="destructive" className="text-[10px]">CA vencido</Badge>
                    )}
                  </span>
                ) : '—'}
              </TableCell>
              <TableCell className="text-muted-foreground">{epi.validade_dias} dias</TableCell>
              <TableCell>
                <Badge variant={epi.ativo ? 'success' : 'outline'}>
                  {epi.ativo ? 'Ativo' : 'Inativo'}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/epis/${epi.id}`}>
                      <Pencil className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => { setError(null); setTarget(epi) }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={!!target} onOpenChange={(o) => { if (!o) setTarget(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir EPI</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir <strong>{target?.nome}</strong>?
              EPIs com entregas registradas não podem ser excluídos — apenas desativados.
            </DialogDescription>
          </DialogHeader>
          {error && <p className="text-sm text-destructive bg-red-50 p-3 rounded-md">{error}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setTarget(null)} disabled={deleting}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
