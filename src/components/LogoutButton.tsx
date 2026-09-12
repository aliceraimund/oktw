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
    <Button
      size="sm"
      onClick={sair}
      className="bg-white/10 text-white border border-white/30 hover:bg-white/20 hover:text-white"
    >
      <LogOut className="h-4 w-4 mr-2" /> Sair
    </Button>
  )
}
