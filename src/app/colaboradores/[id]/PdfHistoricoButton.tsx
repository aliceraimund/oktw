'use client'

import { useState } from 'react'
import { FileDown, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function PdfHistoricoButton({ colaboradorId, nome }: { colaboradorId: string; nome: string }) {
  const [loading, setLoading] = useState(false)

  async function baixar() {
    setLoading(true)
    try {
      const res = await fetch(`/api/colaboradores/${colaboradorId}/pdf-cumulativo`)
      if (!res.ok) throw new Error('erro')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `historico-${nome.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '-')}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch {
      alert('Não foi possível gerar o PDF agora. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button size="sm" variant="outline" onClick={baixar} disabled={loading}>
      {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileDown className="h-4 w-4 mr-2" />}
      {loading ? 'Gerando PDF...' : 'PDF Histórico'}
    </Button>
  )
}
