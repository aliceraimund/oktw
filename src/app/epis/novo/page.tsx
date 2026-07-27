'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

export default function NovoEpiPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    nome: '',
    ca: '',
    validade_dias: 365,
    validade_ca: '',
  })

  function update(field: string, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.from('epis').insert([{
      ...form,
      validade_ca: form.validade_ca || null,
    }])

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/epis')
    router.refresh()
  }

  return (
    <div>
      <Header title="Novo EPI" subtitle="Cadastrar equipamento no catálogo" />
      <div className="p-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Dados do EPI</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label>Nome do EPI *</Label>
                  <Input value={form.nome} onChange={(e) => update('nome', e.target.value)} required placeholder="Ex: Capacete de segurança" />
                </div>
                <div className="space-y-2">
                  <Label>Número CA (Certificado de Aprovação) *</Label>
                  <Input value={form.ca} onChange={(e) => update('ca', e.target.value)} required placeholder="Ex: 12345" />
                </div>
                <div className="space-y-2">
                  <Label>Validade do CA (data)</Label>
                  <Input type="date" value={form.validade_ca}
                    onChange={(e) => update('validade_ca', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Validade padrão (dias) *</Label>
                  <Input
                    type="number"
                    min={1}
                    value={form.validade_dias}
                    onChange={(e) => update('validade_dias', parseInt(e.target.value))}
                    required
                  />
                </div>
              </div>

              {error && <p className="text-sm text-destructive bg-red-50 p-3 rounded-md">{error}</p>}

              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Salvar EPI
                </Button>
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
