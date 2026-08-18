'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  HardHat,
  Package,
  Clock,
  Settings,
  LogOut,
  PanelLeftClose,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Logo } from './Logo'

const navItems = [
  { href: '/dashboard',      label: 'Dashboard',       icon: LayoutDashboard },
  { href: '/colaboradores',  label: 'Colaboradores',   icon: Users },
  { href: '/epis',           label: 'Catálogo de EPIs', icon: HardHat },
  { href: '/entregas',       label: 'Fichas de EPI',    icon: Package },
  { href: '/vencimentos',    label: 'Vencimentos',      icon: Clock },
]

export function Sidebar({
  onNavigate,
  onCollapse,
  onClose,
}: {
  onNavigate?: () => void
  onCollapse?: () => void
  onClose?: () => void
}) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    onNavigate?.()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-64 min-h-screen bg-slate-900 text-white flex flex-col">
      {/* Cabeçalho: controle (recolher/fechar) + logo */}
      <div className="p-4 border-b border-slate-700 space-y-2">
        {(onCollapse || onClose) && (
          <div className="flex justify-end">
            <button
              onClick={onCollapse ?? onClose}
              aria-label={onCollapse ? 'Recolher menu' : 'Fechar menu'}
              title={onCollapse ? 'Recolher menu' : 'Fechar menu'}
              className="flex items-center gap-1.5 text-slate-300 hover:text-white text-xs font-medium rounded-md px-2 py-1 hover:bg-slate-800 transition-colors"
            >
              {onCollapse ? <PanelLeftClose className="h-4 w-4" /> : <X className="h-4 w-4" />}
              <span>{onCollapse ? 'Recolher' : 'Fechar'}</span>
            </button>
          </div>
        )}
        <div className="bg-white rounded-lg p-3 flex items-center justify-center">
          <Logo className="h-14 w-auto" />
        </div>
        <p className="text-slate-400 text-xs text-center">Gestão de EPIs</p>
      </div>

      {/* Nav principal */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
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
          onClick={onNavigate}
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
    </aside>
  )
}
