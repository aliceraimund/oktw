import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase-server'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Plus } from 'lucide-react'
import { EntregasTableClient } from './EntregasTableClient'
import type { FichaEntrega } from '@/types/database'

export const dynamic = 'force-dynamic'

export default async function EntregasPage() {
  const supabase = createAdminClient()

  const { data: fichas } = await supabase
    .from('fichas_entrega')
    .select('*, colaborador:profiles!fichas_entrega_colaborador_id_fkey(*), itens:itens_entrega(*, epi:epis(*))')
    .order('created_at', { ascending: false })

  return (
    <div>
      <Header
        title="Fichas de EPI"
        subtitle={`${fichas?.length ?? 0} fichas registradas`}
        actions={
          <Button asChild size="sm">
            <Link href="/entregas/nova">
              <Plus className="h-4 w-4 mr-2" />
              Nova ficha
            </Link>
          </Button>
        }
      />
      <div className="p-6">
        <Card>
          <CardContent className="p-0">
            <EntregasTableClient fichas={(fichas as FichaEntrega[]) ?? []} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
