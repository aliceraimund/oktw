'use client'

import { usePathname } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'

export default function EntregasLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  // A tela pública de assinatura é mobile-first e NÃO usa a casca administrativa.
  if (/^\/entregas\/[^/]+\/assinar/.test(pathname)) return <>{children}</>
  return <AppShell>{children}</AppShell>
}
