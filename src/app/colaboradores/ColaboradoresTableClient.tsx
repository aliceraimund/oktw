'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ChevronRight, Search } from 'lucide-react'
import type { Profile } from '@/types/database'

const roleLabel: Record<string, string> = {
  rh: 'Admin',
  gestor: 'Gestor',
  colaborador: 'Colaborador',
}

export function ColaboradoresTableClient({ colaboradores }: { colaboradores: Profile[] }) {
  const router = useRouter()
  const [busca, setBusca] = useState('')

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase()
    if (!q) return colaboradores
    return colaboradores.filter((c) =>
      [c.nome, c.email, c.setor, c.cargo, c.cpf]
        .filter(Boolean)
        .some((v) => (v as string).toLowerCase().includes(q))
    )
  }, [colaboradores, busca])

  return (
    <div className="space-y-3">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome, e-mail, setor, cargo ou CPF..."
          className="pl-9"
        />
      </div>

      <Card>
        <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Setor</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>Perfil</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-8" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtrados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">
                  Nenhum colaborador encontrado.
                </TableCell>
              </TableRow>
            ) : filtrados.map((c) => (
              <TableRow
                key={c.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => router.push(`/colaboradores/${c.id}`)}
              >
                <TableCell className="font-medium">{c.nome}</TableCell>
                <TableCell className="text-muted-foreground">{c.email}</TableCell>
                <TableCell>{c.setor || '—'}</TableCell>
                <TableCell>{c.cargo || '—'}</TableCell>
                <TableCell><Badge variant="secondary">{roleLabel[c.role] || c.role}</Badge></TableCell>
                <TableCell>
                  <Badge variant={c.ativo ? 'success' : 'outline'}>{c.ativo ? 'Ativo' : 'Inativo'}</Badge>
                </TableCell>
                <TableCell>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </CardContent>
      </Card>
    </div>
  )
}
