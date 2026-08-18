'use client'

import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'

export function LogoutButton() {
  const router = useRouter()
  async function sair() {
    await createClient().auth.signOut()
    router.push('/login')
    router.refresh()
  }
  return (
    <Button variant="outline" size="sm" onClick={sair}>
      <LogOut className="h-4 w-4 mr-2" /> Sair
    </Button>
  )
}
