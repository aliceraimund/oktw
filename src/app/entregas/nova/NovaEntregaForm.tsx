'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Send, Plus, Trash2 } from 'lucide-react'
import { addDays, format } from 'date-fns'
import type { Profile, Epi } from '@/types/database'

interface ItemForm {
  epi_id: string
  quantidade: number
  validade_dias: number
  data_vencimento: string
  validade_personalizada: boolean
}

interface Props {
  colaboradores: Profile[]
  epis: Epi[]
}

const itemVazio = (): ItemForm => ({
  epi_id: '',
  quantidade: 1,
  validade_dias: 0,
  data_vencimento: '',
  validade_personalizada: false,
})

export function NovaEntregaForm({ colaboradores, epis }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const today = format(new Date(), 'yyyy-MM-dd')
  const [colaboradorId, setColaboradorId] = useState('')
  const [dataEntrega, setDataEntrega] = useState(today)
  const [tipo, setTipo] = useState<'entrega' | 'retirada'>('entrega')
  const [itens, setItens] = useState<ItemForm[]>([itemVazio()])

  function calcularVencimento(dataEnt: string, validadeDias: number) {
    if (!dataEnt || !validadeDias) return ''
    return format(addDays(new Date(dataEnt), validadeDias), 'yyyy-MM-dd')
  }

  function handleEpiChange(index: number, epiId: string) {
    const epi = epis.find((e) => e.id === epiId)
    setItens((prev) => prev.map((item, i) =>
      i !== index ? item : {
        ...item,
        epi_id: epiId,
        validade_personalizada: false,
        validade_dias: epi?.validade_dias ?? 0,
        data_vencimento: epi ? calcularVencimento(dataEntrega, epi.validade_dias) : '',
      }
    ))
  }

  function handleValidadeChange(index: number, dias: number) {
    setItens((prev) => prev.map((item, i) =>
      i !== index ? item : {
        ...item,
        validade_dias: dias,
        data_vencimento: calcularVencimento(dataEntrega, dias),
      }
    ))
  }

  function togglePersonalizada(index: number, checked: boolean) {
    const epi = epis.find((e) => e.id === itens[index].epi_id)
    setItens((prev) => prev.map((item, i) =>
      i !== index ? item : {
        ...item,
        validade_personalizada: checked,
        // ao desmarcar, volta para a validade padrão do EPI
        validade_dias: checked ? item.validade_dias : (epi?.validade_dias ?? 0),
        data_vencimento: checked
          ? item.data_vencimento
          : (epi ? calcularVencimento(dataEntrega, epi.validade_dias) : ''),
      }
    ))
  }

  function handleDataEntregaChange(data: string) {
    setDataEntrega(data)
    setItens((prev) => prev.map((item) => ({
      ...item,
      data_vencimento: item.validade_dias ? calcularVencimento(data, item.validade_dias) : '',
    })))
  }

  function adicionarItem() {
    setItens((prev) => [...prev, itemVazio()])
  }

  function removerItem(index: number) {
    setItens((prev) => prev.filter((_, i) => i !== index))
  }

  function updateItem(index: number, field: keyof ItemForm, value: string | number) {
    setItens((prev) => prev.map((item, i) => i !== index ? item : { ...item, [field]: value }))
  }

  const podeEnviar = colaboradorId && itens.every((i) => i.epi_id && i.data_vencimento)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data: sessionData } = await supabase.auth.getSession()
    const userId = sessionData.session?.user.id

    // 1. Criar a ficha de entrega
    const { data: ficha, error: fichaError } = await supabase
      .from('fichas_entrega')
      .insert([{ colaborador_id: colaboradorId, data_entrega: dataEntrega, tipo, registrado_por: userId }])
      .select()
      .single()

    if (fichaError || !ficha) {
      setError(fichaError?.message ?? 'Erro ao criar ficha.')
      setLoading(false)
      return
    }

    // 2. Inserir os itens
    const { error: itensError } = await supabase.from('itens_entrega').insert(
      itens.map((item) => ({
        ficha_id: ficha.id,
        epi_id: item.epi_id,
        quantidade: item.quantidade,
        validade_dias: item.validade_dias,
        data_vencimento: item.data_vencimento,
      }))
    )

    if (itensError) {
      setError(itensError.message)
      setLoading(false)
      return
    }

    // 3. Enviar e-mail com link de assinatura
    await fetch('/api/email/assinatura-pendente', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fichaId: ficha.id }),
    })

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <Card>
        <CardContent className="p-8 text-center space-y-4">
          <div className="rounded-full bg-green-100 w-16 h-16 flex items-center justify-center mx-auto">
            <Send className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-lg font-semibold">Ficha registrada!</h2>
          <p className="text-muted-foreground text-sm">
            O colaborador receberá um link para assinar eletronicamente todos os EPIs de uma vez.
          </p>
          <div className="flex gap-3 justify-center pt-2">
            <Button onClick={() => router.push('/entregas')}>Ver entregas</Button>
            <Button variant="outline" onClick={() => {
              setSuccess(false)
              setColaboradorId('')
              setDataEntrega(today)
              setItens([itemVazio()])
            }}>
              Nova entrega
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Cabeçalho da ficha */}
      <Card>
        <CardHeader>
          <CardTitle>Dados da entrega</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Colaborador *</Label>
              <Select value={colaboradorId} onValueChange={setColaboradorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar colaborador..." />
                </SelectTrigger>
                <SelectContent>
                  {colaboradores.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome} {c.setor ? `— ${c.setor}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo de movimentação *</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as 'entrega' | 'retirada')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrega">Entrega de EPI</SelectItem>
                  <SelectItem value="retirada">Retirada de EPI</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Data *</Label>
              <Input
                type="date"
                value={dataEntrega}
                onChange={(e) => handleDataEntregaChange(e.target.value)}
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Itens (EPIs) */}
      <Card>
        <CardHeader>
          <CardTitle>EPIs entregues</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {itens.map((item, index) => {
            const epiSelecionado = epis.find((e) => e.id === item.epi_id)
            const validadePadrao = epiSelecionado?.validade_dias

            return (
              <div key={index} className="border rounded-lg p-4 space-y-3 relative">
                {itens.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removerItem(index)}
                    className="absolute top-3 right-3 text-slate-400 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}

                <p className="text-sm font-semibold text-slate-600">EPI {index + 1}</p>


                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">EPI *</Label>
                    <Select value={item.epi_id} onValueChange={(v) => handleEpiChange(index, v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar EPI..." />
                      </SelectTrigger>
                      <SelectContent>
                        {epis.map((epi) => (
                          <SelectItem key={epi.id} value={epi.id}>
                            {epi.nome} — CA {epi.ca}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Quantidade *</Label>
                    <Input
                      type="number"
                      min={1}
                      value={item.quantidade}
                      onChange={(e) => updateItem(index, 'quantidade', parseInt(e.target.value))}
                      required
                    />
                  </div>
                </div>

                {/* Validade */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`personalizada-${index}`}
                      checked={item.validade_personalizada}
                      onChange={(e) => togglePersonalizada(index, e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 accent-slate-800"
                    />
                    <Label htmlFor={`personalizada-${index}`} className="text-xs cursor-pointer font-medium">
                      Validade personalizada para este colaborador?
                    </Label>
                  </div>

                  {!item.validade_personalizada ? (
                    <div className="rounded-md bg-slate-50 border px-3 py-2 text-sm text-muted-foreground">
                      Validade padrão de fábrica:{' '}
                      <span className="font-semibold text-slate-700">
                        {validadePadrao ? `${validadePadrao} dias` : '—'}
                      </span>
                      {item.data_vencimento && (
                        <span className="ml-2">· vence em <span className="font-semibold text-slate-700">{item.data_vencimento.split('-').reverse().join('/')}</span></span>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs text-amber-700">Validade personalizada (dias)</Label>
                        <Input
                          type="number"
                          min={1}
                          value={item.validade_dias || ''}
                          onChange={(e) => handleValidadeChange(index, parseInt(e.target.value))}
                          placeholder={validadePadrao ? `Padrão: ${validadePadrao}d` : 'Ex: 30'}
                        />
                        {validadePadrao && (
                          <p className="text-xs text-muted-foreground">Padrão de fábrica: {validadePadrao} dias</p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Vencimento</Label>
                        <Input
                          type="date"
                          value={item.data_vencimento}
                          onChange={(e) => updateItem(index, 'data_vencimento', e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          <Button type="button" variant="outline" size="sm" onClick={adicionarItem} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar outro EPI
          </Button>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-destructive bg-red-50 p-3 rounded-md">{error}</p>}

      <div className="flex gap-3">
        <Button type="submit" disabled={loading || !podeEnviar}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
          Registrar e enviar link de assinatura
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
