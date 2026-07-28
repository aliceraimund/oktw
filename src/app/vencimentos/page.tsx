import { createAdminClient } from '@/lib/supabase-server'
import { Header } from '@/components/layout/Header'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { EpiStatusBadge } from '@/components/EpiStatusBadge'
import { LembreteVencimentoWhatsApp } from '@/components/LembreteVencimentoWhatsApp'
import { formatDateBR, diasParaVencer } from '@/lib/utils'
import type { ItemEntrega } from '@/types/database'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function VencimentosPage() {
  const supabase = createAdminClient()

  const { data } = await supabase
    .from('itens_entrega')
    .select('*, epi:epis(*), ficha:fichas_entrega(*, colaborador:profiles!fichas_entrega_colaborador_id_fkey(*))')
    .order('data_vencimento', { ascending: true })

  // Só itens de fichas assinadas
  const itens = ((data as ItemEntrega[]) || []).filter((i) => i.ficha?.assinado)

  const vencidos = itens.filter((i) => diasParaVencer(i.data_vencimento) < 0)
  const atencao  = itens.filter((i) => { const d = diasParaVencer(i.data_vencimento); return d >= 0 && d <= 30 })
  const ok       = itens.filter((i) => diasParaVencer(i.data_vencimento) > 30)

  return (
    <div>
      <Header
        title="Controle de vencimentos"
        subtitle={`${vencidos.length} vencidos · ${atencao.length} com atenção · ${ok.length} em dia`}
      />
      <div className="p-6 space-y-6">
        {/* Resumo */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Vencidos',          count: vencidos.length, color: 'bg-red-50 border-red-200 text-red-700' },
            { label: 'Vencem em ≤30 dias', count: atencao.length,  color: 'bg-orange-50 border-orange-200 text-orange-700' },
            { label: 'Em dia',             count: ok.length,       color: 'bg-green-50 border-green-200 text-green-700' },
          ].map(({ label, count, color }) => (
            <div key={label} className={`border rounded-lg p-4 ${color}`}>
              <p className="text-3xl font-bold">{count}</p>
              <p className="text-sm font-medium">{label}</p>
            </div>
          ))}
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Colaborador</TableHead>
                  <TableHead>Setor</TableHead>
                  <TableHead>EPI</TableHead>
                  <TableHead>CA</TableHead>
                  <TableHead>Data entrega</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...vencidos, ...atencao, ...ok].map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      <Link href={`/colaboradores/${item.ficha?.colaborador_id}`} className="hover:underline">
                        {item.ficha?.colaborador?.nome}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.ficha?.colaborador?.setor ?? '—'}
                    </TableCell>
                    <TableCell>{item.epi?.nome}</TableCell>
                    <TableCell className="font-mono text-sm">{item.epi?.ca}</TableCell>
                    <TableCell>{formatDateBR(item.ficha?.data_entrega ?? '')}</TableCell>
                    <TableCell>{formatDateBR(item.data_vencimento)}</TableCell>
                    <TableCell>
                      <EpiStatusBadge dataVencimento={item.data_vencimento} />
                    </TableCell>
                    <TableCell className="text-right">
                      {diasParaVencer(item.data_vencimento) < 0 && (
                        <LembreteVencimentoWhatsApp
                          colaborador={item.ficha?.colaborador}
                          epi={item.epi}
                          dataVencimento={item.data_vencimento}
                        />
                      )}
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
