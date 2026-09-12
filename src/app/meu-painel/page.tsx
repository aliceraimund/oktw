import { redirect } from 'next/navigation'
import { createAdminClient, createServerSupabaseClient } from '@/lib/supabase-server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EpiStatusBadge } from '@/components/EpiStatusBadge'
import { Logo } from '@/components/layout/Logo'
import { LogoutButton } from '@/components/LogoutButton'
import { FileText, PenLine } from 'lucide-react'
import { formatDateBR, formatCA } from '@/lib/utils'
import type { FichaEntrega, ItemEntrega } from '@/types/database'

export const dynamic = 'force-dynamic'

export default async function MeuPainelPage() {
  const supabaseUser = await createServerSupabaseClient()
  const { data: { user } } = await supabaseUser.auth.getUser()
  if (!user) redirect('/login')

  const supabase = createAdminClient()
  const [{ data: perfil }, { data: fichas }] = await Promise.all([
    supabase.from('profiles').select('nome').eq('id', user.id).single(),
    supabase
      .from('fichas_entrega')
      .select('*, itens:itens_entrega(*, epi:epis(*))')
      .eq('colaborador_id', user.id)
      .order('data_entrega', { ascending: false }),
  ])

  const fichasTyped = (fichas as FichaEntrega[]) || []
  const pendentes = fichasTyped.filter((f) => !f.assinado)

  const devolvidos = new Set(
    fichasTyped.filter((f) => f.tipo === 'retirada').flatMap((f) => f.itens ?? []).map((i) => i.item_origem_id).filter(Boolean)
  )
  const episAtivos: ItemEntrega[] = fichasTyped
    .filter((f) => f.assinado && f.tipo === 'entrega')
    .flatMap((f) => f.itens ?? [])
    .filter((i) => !devolvidos.has(i.id))

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="bg-white rounded-md px-2 py-1"><Logo className="h-7 w-auto" /></div>
          <LogoutButton />
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Olá, {perfil?.nome ?? 'Colaborador'}!</h1>
          <p className="text-sm text-slate-500">Seus EPIs e fichas de assinatura.</p>
        </div>

        {/* Pendências de assinatura */}
        {pendentes.length > 0 && (
          <Card className="border-amber-300">
            <CardHeader>
              <CardTitle className="text-base text-amber-700">Aguardando sua assinatura ({pendentes.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {pendentes.map((f) => (
                <div key={f.id} className="flex items-center justify-between gap-3 py-2 border-b last:border-0">
                  <div className="text-sm">
                    <p className="font-medium">{f.tipo === 'retirada' ? 'Devolução' : 'Entrega'} de {formatDateBR(f.data_entrega)}</p>
                    <p className="text-xs text-muted-foreground">{f.itens?.map((i) => i.epi?.nome).filter(Boolean).join(', ')}</p>
                  </div>
                  <Button asChild size="sm">
                    <a href={`/entregas/${f.token_assinatura}/assinar`}>
                      <PenLine className="h-4 w-4 mr-2" /> Assinar
                    </a>
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* EPIs em uso */}
        <Card>
          <CardHeader><CardTitle className="text-base">Meus EPIs em uso ({episAtivos.length})</CardTitle></CardHeader>
          <CardContent className="p-0">
            {episAtivos.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhum EPI ativo no momento</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>EPI</TableHead><TableHead>CA</TableHead>
                    <TableHead>Vencimento</TableHead><TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {episAtivos.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.epi?.nome}</TableCell>
                      <TableCell className="font-mono text-sm">{formatCA(item.epi?.ca)}</TableCell>
                      <TableCell>{formatDateBR(item.data_vencimento)}</TableCell>
                      <TableCell><EpiStatusBadge dataVencimento={item.data_vencimento} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Histórico de fichas */}
        <Card>
          <CardHeader><CardTitle className="text-base">Minhas fichas</CardTitle></CardHeader>
          <CardContent className="p-0">
            {fichasTyped.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhuma ficha registrada</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead><TableHead>Tipo</TableHead>
                    <TableHead>EPIs</TableHead><TableHead>Assinatura</TableHead><TableHead>PDF</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fichasTyped.map((f) => (
                    <TableRow key={f.id}>
                      <TableCell>{formatDateBR(f.data_entrega)}</TableCell>
                      <TableCell>
                        <Badge variant={f.tipo === 'retirada' ? 'outline' : 'secondary'}>
                          {f.tipo === 'retirada' ? 'Devolução' : 'Entrega'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {f.itens?.map((i) => (
                            <span key={i.id} className="text-xs bg-slate-100 rounded px-1.5 py-0.5">{i.epi?.nome}</span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={f.assinado ? 'success' : 'warning'}>{f.assinado ? 'Assinado' : 'Pendente'}</Badge>
                      </TableCell>
                      <TableCell>
                        {f.pdf_url ? (
                          <a href={f.pdf_url} target="_blank" rel="noopener noreferrer">
                            <FileText className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                          </a>
                        ) : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
