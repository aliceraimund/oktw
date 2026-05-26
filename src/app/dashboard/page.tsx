import { createAdminClient } from '@/lib/supabase-server'
import { Header } from '@/components/layout/Header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EpiStatusBadge } from '@/components/EpiStatusBadge'
import { diasParaVencer, formatDateBR } from '@/lib/utils'
import { Users, HardHat, AlertTriangle, Clock } from 'lucide-react'
import Link from 'next/link'
import type { ItemEntrega } from '@/types/database'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = createAdminClient()

  const [
    { count: totalColaboradores },
    { count: totalEpis },
    { data: itens },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('ativo', true),
    supabase.from('epis').select('*', { count: 'exact', head: true }).eq('ativo', true),
    supabase
      .from('itens_entrega')
      .select('*, epi:epis(*), ficha:fichas_entrega(*, colaborador:profiles!fichas_entrega_colaborador_id_fkey(*))')
      .order('data_vencimento', { ascending: true }),
  ])

  const itensAssinados = ((itens as ItemEntrega[]) || []).filter((i) => i.ficha?.assinado)

  const vencidos = itensAssinados.filter((i) => diasParaVencer(i.data_vencimento) < 0)
  const atencao  = itensAssinados.filter((i) => {
    const d = diasParaVencer(i.data_vencimento)
    return d >= 0 && d <= 30
  })
  const alertasUrgentes = [...vencidos, ...atencao].slice(0, 5)

  const stats = [
    { label: 'Colaboradores ativos', value: totalColaboradores ?? 0, icon: Users,          color: 'text-blue-600 bg-blue-50' },
    { label: 'Tipos de EPI',         value: totalEpis ?? 0,          icon: HardHat,        color: 'text-amber-600 bg-amber-50' },
    { label: 'EPIs vencidos',        value: vencidos.length,          icon: AlertTriangle,  color: 'text-red-600 bg-red-50' },
    { label: 'Vencem em 30 dias',    value: atencao.length,           icon: Clock,          color: 'text-orange-600 bg-orange-50' },
  ]

  return (
    <div>
      <Header title="Dashboard" subtitle="Visão geral do sistema de EPIs" />
      <div className="p-6 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map(({ label, value, icon: Icon, color }) => (
            <Card key={label}>
              <CardContent className="p-6 flex items-center gap-4">
                <div className={`rounded-lg p-3 ${color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{value}</p>
                  <p className="text-sm text-muted-foreground">{label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Alertas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">EPIs que precisam de atenção</CardTitle>
          </CardHeader>
          <CardContent>
            {alertasUrgentes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum alerta no momento ✓
              </p>
            ) : (
              <div className="space-y-3">
                {alertasUrgentes.map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium text-sm">
                        <Link href={`/colaboradores/${item.ficha?.colaborador_id}`} className="hover:underline">
                          {item.ficha?.colaborador?.nome}
                        </Link>
                      </p>
                      <p className="text-xs text-muted-foreground">{item.epi?.nome} · CA {item.epi?.ca}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">{formatDateBR(item.data_vencimento)}</span>
                      <EpiStatusBadge dataVencimento={item.data_vencimento} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
