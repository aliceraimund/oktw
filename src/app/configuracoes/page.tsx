import { createAdminClient } from '@/lib/supabase-server'
import { Header } from '@/components/layout/Header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Building2, Users } from 'lucide-react'
import type { Profile } from '@/types/database'

export const dynamic = 'force-dynamic'

const roleLabel: Record<string, string> = {
  rh: 'RH / Segurança',
  gestor: 'Gestor',
  colaborador: 'Colaborador',
}

export default async function ConfiguracoesPage() {
  const supabase = createAdminClient()

  const [{ data: config }, { data: usuarios }] = await Promise.all([
    supabase.from('configuracoes').select('*').eq('id', 1).single(),
    supabase.from('profiles').select('*').order('nome'),
  ])

  const usuariosTyped = (usuarios as Profile[]) || []
  const sistemicos = usuariosTyped.filter((u) => u.role !== 'colaborador')

  return (
    <div>
      <Header title="Configurações" subtitle="Dados da empresa e acessos ao sistema" />
      <div className="p-6 space-y-6">

        {/* Dados da empresa */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4" /> Dados da empresa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6 text-sm">
              <div>
                <p className="text-muted-foreground mb-1">Razão social</p>
                <p className="font-medium text-base">{config?.empresa_nome}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">CNPJ</p>
                <p className="font-medium text-base">{config?.empresa_cnpj}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Esses dados aparecem no Termo de Responsabilidade de todas as fichas assinadas.
            </p>
          </CardContent>
        </Card>

        {/* Usuários com acesso ao sistema */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" /> Usuários com acesso ao sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Perfil</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sistemicos.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.nome}</TableCell>
                    <TableCell className="text-muted-foreground">{u.email}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{roleLabel[u.role] ?? u.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.ativo ? 'success' : 'outline'}>
                        {u.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
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
