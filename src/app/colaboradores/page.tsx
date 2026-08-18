import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase-server'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { ColaboradoresTableClient } from './ColaboradoresTableClient'
import type { Profile } from '@/types/database'

export const dynamic = 'force-dynamic'

export default async function ColaboradoresPage() {
  const supabase = createAdminClient()
  const { data: colaboradores } = await supabase
    .from('profiles')
    .select('*')
    .order('nome')

  return (
    <div>
      <Header
        title="Colaboradores"
        subtitle={`${colaboradores?.length ?? 0} cadastrados`}
        actions={
          <Button asChild size="sm">
            <Link href="/colaboradores/novo">
              <Plus className="h-4 w-4 mr-2" />
              Novo colaborador
            </Link>
          </Button>
        }
      />
      <div className="p-6">
        <ColaboradoresTableClient colaboradores={(colaboradores as Profile[]) ?? []} />
      </div>
    </div>
  )
}
