import { createAdminClient } from '@/lib/supabase-server'
import { Header } from '@/components/layout/Header'
import { NovaEntregaForm } from './NovaEntregaForm'
import type { Profile, Epi } from '@/types/database'

export const dynamic = 'force-dynamic'

export default async function NovaEntregaPage() {
  const supabase = createAdminClient()

  const [{ data: colaboradores }, { data: epis }] = await Promise.all([
    supabase.from('profiles').select('*').eq('ativo', true).order('nome'),
    supabase.from('epis').select('*').eq('ativo', true).order('nome'),
  ])

  return (
    <div>
      <Header title="Nova entrega de EPI" subtitle="Registrar entrega e enviar link de assinatura" />
      <div className="p-6 max-w-2xl">
        <NovaEntregaForm
          colaboradores={(colaboradores as Profile[]) || []}
          epis={(epis as Epi[]) || []}
        />
      </div>
    </div>
  )
}
