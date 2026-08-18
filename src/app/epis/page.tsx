import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase-server'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { EpisTableClient } from './EpisTableClient'
import { getPerfilAtual } from '@/lib/auth'
import type { Epi } from '@/types/database'

export const dynamic = 'force-dynamic'

export default async function EpisPage() {
  const supabase = createAdminClient()
  const [{ data: epis }, perfil] = await Promise.all([
    supabase.from('epis').select('*').order('nome'),
    getPerfilAtual(),
  ])
  const podeExcluir = perfil === 'rh'

  return (
    <div>
      <Header
        title="Catálogo de EPIs"
        subtitle={`${epis?.length ?? 0} equipamentos cadastrados`}
        actions={
          <Button asChild size="sm">
            <Link href="/epis/novo">
              <Plus className="h-4 w-4 mr-2" />
              Novo EPI
            </Link>
          </Button>
        }
      />
      <div className="p-6">
        <EpisTableClient epis={(epis as Epi[]) ?? []} podeExcluir={podeExcluir} />
      </div>
    </div>
  )
}
