'use client'

import { useState } from 'react'
import { Menu, X, HardHat } from 'lucide-react'
import { Sidebar } from './Sidebar'

/**
 * Casca responsiva da área administrativa.
 * - Desktop (md+): barra lateral fixa visível.
 * - Mobile: barra escondida; topo com botão hambúrguer que abre uma gaveta.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Barra lateral — desktop */}
      <div className="hidden md:block shrink-0">
        <Sidebar />
      </div>

      {/* Gaveta — mobile */}
      {open && (
        <div className="md:hidden">
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="fixed inset-y-0 left-0 z-50 w-64 max-w-[80%] shadow-xl">
            <button
              onClick={() => setOpen(false)}
              aria-label="Fechar menu"
              className="absolute top-4 right-3 z-10 text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
            <Sidebar onNavigate={() => setOpen(false)} />
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
          <div className="flex items-center gap-2">
            <HardHat className="h-5 w-5 text-amber-400" />
            <span className="font-bold">OKTW</span>
          </div>
        </header>

        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
