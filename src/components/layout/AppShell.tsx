'use client'

import { useState } from 'react'
import { Menu, PanelLeftOpen } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { Logo } from './Logo'

/**
 * Casca responsiva da área administrativa.
 * - Desktop (md+): barra lateral fixa, com botão "Recolher" para esconder e
 *   uma barra fina com "Menu" para trazer de volta.
 * - Mobile: barra escondida; topo com hambúrguer que abre uma gaveta.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)          // gaveta mobile
  const [collapsed, setCollapsed] = useState(false) // recolhida no desktop

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Barra lateral — desktop */}
      {!collapsed && (
        <div className="hidden md:block shrink-0">
          <Sidebar onCollapse={() => setCollapsed(true)} />
        </div>
      )}

      {/* Gaveta — mobile */}
      {open && (
        <div className="md:hidden">
          <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setOpen(false)} aria-hidden />
          <div className="fixed inset-y-0 left-0 z-50 w-64 max-w-[80%] shadow-xl">
            <Sidebar onNavigate={() => setOpen(false)} onClose={() => setOpen(false)} />
          </div>
        </div>
      )}

      {/* Conteúdo */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topo mobile com hambúrguer */}
        <header className="md:hidden sticky top-0 z-30 flex items-center gap-3 bg-slate-900 text-white px-4 h-14">
          <button onClick={() => setOpen(true)} aria-label="Abrir menu" className="p-1 -ml-1">
            <Menu className="h-6 w-6" />
          </button>
          <div className="bg-white rounded-md px-2 py-1 flex items-center">
            <Logo className="h-6 w-auto" />
          </div>
        </header>

        {/* Barra fina no desktop quando o menu está recolhido */}
        {collapsed && (
          <header className="hidden md:flex sticky top-0 z-30 items-center gap-3 bg-slate-900 text-white px-3 h-12">
            <button
              onClick={() => setCollapsed(false)}
              aria-label="Expandir menu"
              title="Expandir menu"
              className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-slate-800 transition-colors"
            >
              <PanelLeftOpen className="h-5 w-5" />
              <span className="text-sm font-medium">Menu</span>
            </button>
            <div className="bg-white rounded-md px-2 py-1 flex items-center">
              <Logo className="h-5 w-auto" />
            </div>
          </header>
        )}

        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
