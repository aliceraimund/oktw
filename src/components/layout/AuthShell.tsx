'use client'

import { usePathname } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'

export function AuthShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isPublicSignaturePage = /^\/entregas\/[^/]+\/assinar\/?$/.test(pathname)

  if (isPublicSignaturePage) return children

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="min-w-0 flex-1 overflow-x-hidden pt-16 md:pt-0">{children}</main>
    </div>
  )
}
