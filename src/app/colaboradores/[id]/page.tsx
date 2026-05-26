import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase-server'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { EpiStatusBadge } from '@/components/EpiStatusBadge'
import { ColaboradorActions } from './ColaboradorActions'
import { Plus, FileText } from 'lucide-react'
import { formatDateBR } from '@/lib/utils'
import type { FichaEntrega, ItemEntrega } from '@/types/database'

export const dynamic = 'force-dynamic'

export default async function ColaboradorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()

  const [{ data: colaborador }, { data: fichas }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', id).single(),
    supabase
      .from('fichas_entrega')
      .select('*, itens:itens_entrega(*, epi:epis(*))')
      .eq('colaborador_id', id)
      .order('data_entrega', { ascending: false }),
  ])

  if (!colaborador) notFound()

  const fichasTyped = (fichas as FichaEntrega[]) || []

  // EPIs atualmente ativos (fichas assinadas, itens não vencidos)
  const episAtivos: ItemEntrega[] = fichasTyped
    .filter((f) => f.assinado)
    .flatMap((f) => f.itens ?? [])

  const roleLabel: Record<string, string> = {
    rh: 'RH / Segurança',
    gestor: 'Gestor',
    colaborador: 'Colaborador',
  }

  return (
    <div>
      <Header
        title={colaborador.nome}
        subtitle={`${colaborador.cargo ?? 'Sem cargo'} · ${colaborador.setor ?? 'Sem setor'}`}
        actions={
          <Button asChild size="sm">
            <Link href={`/entregas/nova?colaborador=${id}`}>
              <Plus className="h-4 w-4 mr-2" />
              Nova entrega
            </Link>
          </Button>
        }
      />
      <div className="p-6 space-y-6">

        {/* Dados pessoais — com edição e exclusão inline */}
        <ColaboradorActions colaborador={colaborador} />

        {/* EPIs ativos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">EPIs em uso ({episAtivos.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {episAtivos.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhum EPI ativo no momento
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>EPI</TableHead>
                    <TableHead>CA</TableHead>
                    <TableHead>Qtd</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {episAtivos.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.epi?.nome}</TableCell>
                      <TableCell className="font-mono text-sm">{item.epi?.ca}</TableCell>
                      <TableCell>{item.quantidade}</TableCell>
                      <TableCell>{formatDateBR(item.data_vencimento)}</TableCell>
                      <TableCell>
                        <EpiStatusBadge dataVencimento={item.data_vencimento} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Histórico de fichas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Histórico de fichas assinadas</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {fichasTyped.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhuma ficha registrada
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>EPIs entregues</TableHead>
                    <TableHead>Assinatura</TableHead>
                    <TableHead>PDF</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fichasTyped.map((ficha) => (
                    <TableRow key={ficha.id}>
                      <TableCell>{formatDateBR(ficha.data_entrega)}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {ficha.itens?.map((item) => (
                            <span key={item.id} className="text-xs bg-slate-100 rounded px-1.5 py-0.5">
                              {item.epi?.nome}
                            </span>
                          ))}
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
