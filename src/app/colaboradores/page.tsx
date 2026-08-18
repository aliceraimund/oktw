import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase-server'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, ChevronRight } from 'lucide-react'
import type { Profile } from '@/types/database'

export const dynamic = 'force-dynamic'

const roleLabel: Record<string, string> = {
  rh: 'Admin',
  gestor: 'Gestor',
  colaborador: 'Colaborador',
}

export default async function ColaboradoresPage() {
  const supabase = createAdminClient()
  const { data: colaboradores } = await supabase
    .from('profiles')
    .select('*')
    .order('nome')

  return (
    <div>
      <Header
        title="Colaboradores"
        subtitle={`${colaboradores?.length ?? 0} cadastrados`}
        actions={
          <Button asChild size="sm">
            <Link href="/colaboradores/novo">
              <Plus className="h-4 w-4 mr-2" />
              Novo colaborador
            </Link>
          </Button>
        }
      />
      <div className="p-6">
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
                {(colaboradores as Profile[])?.map((c) => (
                  <TableRow key={c.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-medium">
                      <Link href={`/colaboradores/${c.id}`} className="block w-full">
                        {c.nome}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{c.email}</TableCell>
                    <TableCell>{c.setor || '—'}</TableCell>
                    <TableCell>{c.cargo || '—'}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{roleLabel[c.role] || c.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={c.ativo ? 'success' : 'outline'}>
                        {c.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Link href={`/colaboradores/${c.id}`}>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
