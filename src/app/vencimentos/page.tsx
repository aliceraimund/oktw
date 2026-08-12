import { createAdminClient } from '@/lib/supabase-server'
import { Header } from '@/components/layout/Header'
import { diasParaVencer } from '@/lib/utils'
import { VencimentosClient } from './VencimentosClient'
import type { ItemEntrega } from '@/types/database'

export const dynamic = 'force-dynamic'

export default async function VencimentosPage() {
  const supabase = createAdminClient()

  const { data } = await supabase
    .from('itens_entrega')
    .select('*, epi:epis(*), ficha:fichas_entrega(*, colaborador:profiles!fichas_entrega_colaborador_id_fkey(*))')
    .order('data_vencimento', { ascending: true })

  // Só itens de fichas assinadas
  const itens = ((data as ItemEntrega[]) || []).filter((i) => i.ficha?.assinado)

  const vencidos = itens.filter((i) => diasParaVencer(i.data_vencimento) < 0).length
  const atencao  = itens.filter((i) => { const d = diasParaVencer(i.data_vencimento); return d >= 0 && d <= 30 }).length
  const ok       = itens.filter((i) => diasParaVencer(i.data_vencimento) > 30).length

  return (
    <div>
      <Header
        title="Controle de vencimentos"
        subtitle={`${vencidos} vencidos · ${atencao} com atenção · ${ok} em dia`}
      />
      <div className="p-6">
        <VencimentosClient itens={itens} />
      </div>
    </div>
  )
}
