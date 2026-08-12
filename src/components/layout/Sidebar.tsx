'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  HardHat,
  Package,
  Clock,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const navItems = [
  { href: '/dashboard',      label: 'Dashboard',       icon: LayoutDashboard },
  { href: '/colaboradores',  label: 'Colaboradores',   icon: Users },
  { href: '/epis',           label: 'Catálogo de EPIs', icon: HardHat },
  { href: '/entregas',       label: 'Fichas de EPI',    icon: Package },
  { href: '/vencimentos',    label: 'Vencimentos',      icon: Clock },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const navigation = (
    <>
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-slate-700 px-5 md:h-auto md:p-6">
        <div className="flex items-center gap-2">
          <HardHat className="h-7 w-7 text-amber-400" />
          <div>
            <p className="font-bold text-lg leading-none">OKTW</p>
            <p className="text-slate-400 text-xs">Gestão de EPIs</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white md:hidden"
          aria-label="Fechar menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Nav principal */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              pathname.startsWith(href)
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>

      {/* Footer — Configurações + Sair */}
      <div className="p-4 border-t border-slate-700 space-y-1">
        <Link
          href="/configuracoes"
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
            pathname.startsWith('/configuracoes')
              ? 'bg-slate-700 text-white'
              : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          )}
        >
          <Settings className="h-4 w-4" />
          Configurações
        </Link>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors w-full"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </div>
    </>
  )

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-30 flex h-16 items-center justify-between border-b bg-slate-900 px-4 text-white md:hidden">
        <div className="flex items-center gap-2">
          <HardHat className="h-6 w-6 text-amber-400" />
          <div>
            <p className="font-bold leading-none">OKTW</p>
            <p className="mt-1 text-[11px] text-slate-400">Gestão de EPIs</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-lg border border-slate-700 p-2 text-slate-200 hover:bg-slate-800"
          aria-label="Abrir menu"
          aria-expanded={open}
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {open && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm md:hidden"
          onClick={() => setOpen(false)}
          aria-label="Fechar menu"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[min(20rem,86vw)] flex-col bg-slate-900 text-white shadow-2xl transition-transform duration-200 md:sticky md:top-0 md:z-auto md:h-screen md:w-64 md:shrink-0 md:translate-x-0 md:shadow-none',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {navigation}
      </aside>
    </>
  )
}
