import { createAdminClient } from '@/lib/supabase-server'
import { carregarConfigPdf } from '@/lib/pdf-config-server'
import { Header } from '@/components/layout/Header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Users, ShieldCheck } from 'lucide-react'
import { ConfigPdfEditor } from '@/components/ConfigPdfEditor'
import type { Profile } from '@/types/database'

const PERFIS = [
  {
    nome: 'Admin',
    cor: 'bg-blue-50 border-blue-200',
    desc: 'Acesso completo. Cadastra e edita colaboradores, cria e redefine senhas de acesso, gerencia o catálogo de EPIs, registra fichas (entrega e devolução), controla vencimentos e edita as Configurações e o modelo do documento (PDF).',
  },
  {
    nome: 'Gestor',
    cor: 'bg-violet-50 border-violet-200',
    desc: 'Acesso operacional. Acompanha e registra entregas e devoluções, gerencia EPIs e colaboradores, acompanha vencimentos e envia cobranças por e-mail/WhatsApp. Não cria acessos nem redefine senhas — essas ações são exclusivas do Admin.',
  },
  {
    nome: 'Colaborador',
    cor: 'bg-slate-50 border-slate-200',
    desc: 'Não acessa o painel administrativo. Recebe o link por e-mail ou WhatsApp e apenas assina as suas fichas de EPI (entrega e devolução) pelo celular.',
  },
]

export const dynamic = 'force-dynamic'

const roleLabel: Record<string, string> = {
  rh: 'Admin',
  gestor: 'Gestor',
  colaborador: 'Colaborador',
}

export default async function ConfiguracoesPage() {
  const supabase = createAdminClient()

  const [{ data: usuarios }, configPdf] = await Promise.all([
    supabase.from('profiles').select('*').order('nome'),
    carregarConfigPdf(),
  ])

  const usuariosTyped = (usuarios as Profile[]) || []
  const sistemicos = usuariosTyped.filter((u) => u.role !== 'colaborador')

  return (
    <div>
      <Header title="Configurações" subtitle="Modelo do documento e acessos ao sistema" />
      <div className="p-6 space-y-6">

        {/* Editor do modelo de PDF */}
        <ConfigPdfEditor inicial={configPdf} />

        {/* Níveis de acesso por perfil */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" /> Níveis de acesso por perfil
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PERFIS.map((p) => (
              <div key={p.nome} className={`rounded-lg border p-4 ${p.cor}`}>
                <p className="font-semibold text-sm mb-1">{p.nome}</p>
                <p className="text-xs text-slate-600 leading-relaxed">{p.desc}</p>
              </div>
            ))}
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
