import { createAdminClient } from '@/lib/supabase-server'
import { Header } from '@/components/layout/Header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EpiStatusBadge } from '@/components/EpiStatusBadge'
import { EnviarAssinatura } from '@/components/EnviarAssinatura'
import { LembreteVencimentoWhatsApp } from '@/components/LembreteVencimentoWhatsApp'
import { diasParaVencer, formatDateBR } from '@/lib/utils'
import { Users, HardHat, AlertTriangle, Clock, FileSignature } from 'lucide-react'
import Link from 'next/link'
import type { ItemEntrega, FichaEntrega } from '@/types/database'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = createAdminClient()

  const [
    { count: totalColaboradores },
    { count: totalEpis },
    { data: itens },
    { data: pendentes },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('ativo', true),
    supabase.from('epis').select('*', { count: 'exact', head: true }).eq('ativo', true),
    supabase
      .from('itens_entrega')
      .select('*, epi:epis(*), ficha:fichas_entrega(*, colaborador:profiles!fichas_entrega_colaborador_id_fkey(*))')
      .order('data_vencimento', { ascending: true }),
    supabase
      .from('fichas_entrega')
      .select('*, colaborador:profiles!fichas_entrega_colaborador_id_fkey(*), itens:itens_entrega(*, epi:epis(*))')
      .eq('assinado', false)
      .order('created_at', { ascending: false }),
  ])

  const fichasPendentes = (pendentes as FichaEntrega[]) ?? []

  const itensAssinados = ((itens as ItemEntrega[]) || []).filter((i) => i.ficha?.assinado)

  const vencidos = itensAssinados.filter((i) => diasParaVencer(i.data_vencimento) < 0)
  const atencao  = itensAssinados.filter((i) => {
    const d = diasParaVencer(i.data_vencimento)
    return d >= 0 && d <= 30
  })
  const alertasUrgentes = [...vencidos, ...atencao].slice(0, 5)

  const stats = [
    { label: 'Colaboradores ativos', value: totalColaboradores ?? 0, icon: Users,          color: 'text-blue-600 bg-blue-50' },
    { label: 'Assinaturas pendentes', value: fichasPendentes.length,  icon: FileSignature,  color: 'text-violet-600 bg-violet-50' },
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

        {/* Assinaturas pendentes — lembrete + atalhos de reenvio */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileSignature className="h-4 w-4 text-violet-600" />
              Assinaturas pendentes
              {fichasPendentes.length > 0 && (
                <span className="text-xs font-normal bg-violet-100 text-violet-700 rounded-full px-2 py-0.5">
                  {fichasPendentes.length}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {fichasPendentes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma assinatura pendente ✓
              </p>
            ) : (
              <div className="space-y-3">
                {fichasPendentes.map((ficha) => (
                  <div
                    key={ficha.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-2 border-b last:border-0"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-sm">
                        <Link href={`/colaboradores/${ficha.colaborador_id}`} className="hover:underline">
                          {ficha.colaborador?.nome}
                        </Link>
                        <span className="text-xs text-muted-foreground font-normal ml-2">
                          {formatDateBR(ficha.data_entrega)}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {ficha.itens?.map((i) => i.epi?.nome).filter(Boolean).join(', ') || 'Sem itens'}
                      </p>
                    </div>
                    <div className="shrink-0">
                      <EnviarAssinatura ficha={ficha} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

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
                      {diasParaVencer(item.data_vencimento) < 0 && (
                        <LembreteVencimentoWhatsApp
                          colaborador={item.ficha?.colaborador}
                          epi={item.epi}
                          dataVencimento={item.data_vencimento}
                          size="icon"
                        />
                      )}
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
