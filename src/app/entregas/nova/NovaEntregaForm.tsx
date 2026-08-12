'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Combobox } from '@/components/ui/combobox'
import { NovoColaboradorDialog } from '@/components/NovoColaboradorDialog'
import { NovoEpiDialog } from '@/components/NovoEpiDialog'
import { EnviarAssinatura } from '@/components/EnviarAssinatura'
import { Loader2, Send, Plus, Trash2, AlertTriangle } from 'lucide-react'
import { addDays, format } from 'date-fns'
import { formatCA, formatDateBR } from '@/lib/utils'
import type { Profile, Epi, FichaEntrega, ItemEntrega } from '@/types/database'

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

export function NovaEntregaForm({ colaboradores: colaboradoresProp, epis: episProp }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [fichaCriada, setFichaCriada] = useState<FichaEntrega | null>(null)

  // Listas locais — permitem adicionar itens criados via pop-up sem recarregar
  const [colaboradores, setColaboradores] = useState<Profile[]>(colaboradoresProp)
  const [epis, setEpis] = useState<Epi[]>(episProp)

  const today = format(new Date(), 'yyyy-MM-dd')
  const [colaboradorId, setColaboradorId] = useState('')
  const [dataEntrega, setDataEntrega] = useState(today)
  const [tipo, setTipo] = useState<'entrega' | 'retirada'>('entrega')
  const [itens, setItens] = useState<ItemForm[]>([itemVazio()])

  // Devolução (tipo=retirada): EPIs que o colaborador tem em uso, para devolver
  const [itensEmUso, setItensEmUso] = useState<ItemEntrega[]>([])
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set())
  const [carregandoEmUso, setCarregandoEmUso] = useState(false)

  useEffect(() => {
    if (tipo !== 'retirada' || !colaboradorId) {
      setItensEmUso([]); setSelecionados(new Set()); return
    }
    let ativo = true
    setCarregandoEmUso(true)
    ;(async () => {
      // EPIs entregues (fichas de entrega assinadas) do colaborador
      const { data: entregues } = await supabase
        .from('itens_entrega')
        .select('*, epi:epis(*), ficha:fichas_entrega!inner(colaborador_id, assinado, tipo, data_entrega)')
        .eq('ficha.colaborador_id', colaboradorId)
        .eq('ficha.assinado', true)
        .eq('ficha.tipo', 'entrega')
      // Itens já devolvidos (origem já referenciada por alguma devolução)
      const { data: devolvidos } = await supabase
        .from('itens_entrega')
        .select('item_origem_id, ficha:fichas_entrega!inner(colaborador_id)')
        .eq('ficha.colaborador_id', colaboradorId)
        .not('item_origem_id', 'is', null)
      const jaDevolvidos = new Set(
        (devolvidos ?? []).map((d: { item_origem_id: string | null }) => d.item_origem_id)
      )
      const emUso = ((entregues as ItemEntrega[]) ?? []).filter((i) => !jaDevolvidos.has(i.id))
      if (ativo) { setItensEmUso(emUso); setSelecionados(new Set()); setCarregandoEmUso(false) }
    })()
    return () => { ativo = false }
  }, [tipo, colaboradorId, supabase])

  function toggleSelecionado(id: string) {
    setSelecionados((prev) => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id); else n.add(id)
      return n
    })
  }

  function handleColaboradorCriado(novo: Profile) {
    setColaboradores((prev) => [novo, ...prev])
    setColaboradorId(novo.id)
  }

  function handleEpiCriado(index: number, novo: Epi) {
    setEpis((prev) => [novo, ...prev])
    handleEpiChange(index, novo.id)
  }

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

  const podeEnviar = tipo === 'retirada'
    ? Boolean(colaboradorId && selecionados.size > 0)
    : Boolean(colaboradorId && itens.every((i) => i.epi_id && i.data_vencimento))

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

    // 2. Inserir os itens — entrega (catálogo) ou devolução (itens em uso selecionados)
    const itensParaInserir = tipo === 'retirada'
      ? itensEmUso
          .filter((i) => selecionados.has(i.id))
          .map((i) => ({
            ficha_id: ficha.id,
            epi_id: i.epi_id,
            quantidade: i.quantidade,
            validade_dias: i.validade_dias,
            data_vencimento: i.data_vencimento,
            item_origem_id: i.id, // vínculo com a entrega original
          }))
      : itens.map((item) => ({
          ficha_id: ficha.id,
          epi_id: item.epi_id,
          quantidade: item.quantidade,
          validade_dias: item.validade_dias,
          data_vencimento: item.data_vencimento,
        }))

    const { error: itensError } = await supabase.from('itens_entrega').insert(itensParaInserir)

    if (itensError) {
      setError(itensError.message)
      setLoading(false)
      return
    }

    // 3. Guardar a ficha criada (com o colaborador) para a escolha de canal de envio
    const colaborador = colaboradores.find((c) => c.id === colaboradorId)
    setFichaCriada({ ...(ficha as FichaEntrega), colaborador })

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    const semContato = fichaCriada && !fichaCriada.colaborador?.email && !fichaCriada.colaborador?.telefone
    return (
      <Card>
        <CardContent className="p-8 text-center space-y-5">
          <div className="rounded-full bg-green-100 w-16 h-16 flex items-center justify-center mx-auto">
            <Send className="h-8 w-8 text-green-600" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">Ficha registrada!</h2>
            <p className="text-muted-foreground text-sm">
              Agora escolha por qual canal enviar o link de assinatura para{' '}
              <strong>{fichaCriada?.colaborador?.nome ?? 'o colaborador'}</strong>.
            </p>
          </div>

          {fichaCriada && (
            <div className="flex flex-col items-center gap-2">
              <EnviarAssinatura ficha={fichaCriada} size="default" />
              {semContato && (
                <p className="text-xs text-amber-600">
                  Este colaborador não tem e-mail nem telefone cadastrado. Adicione um contato no perfil dele para poder enviar.
                </p>
              )}
              <p className="text-xs text-muted-foreground max-w-sm">
                No WhatsApp, o app abre com a mensagem pronta — basta você tocar em enviar. O link também fica disponível na tela de Entregas e no Dashboard.
              </p>
            </div>
          )}

          <div className="flex gap-3 justify-center pt-2 border-t mt-2">
            <Button onClick={() => router.push('/entregas')}>Ver entregas</Button>
            <Button variant="outline" onClick={() => {
              setSuccess(false)
              setFichaCriada(null)
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
              <div className="flex items-center justify-between">
                <Label>Colaborador *</Label>
                <NovoColaboradorDialog onCreated={handleColaboradorCriado} />
              </div>
              <Combobox
                value={colaboradorId}
                onValueChange={setColaboradorId}
                options={colaboradores.map((c) => ({
                  value: c.id,
                  label: c.nome,
                  sublabel: c.cargo ?? undefined,
                }))}
                placeholder="Selecionar colaborador..."
                searchPlaceholder="Buscar por nome ou cargo..."
                emptyText="Nenhum colaborador encontrado."
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo de movimentação *</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as 'entrega' | 'retirada')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrega">Entrega de EPI</SelectItem>
                  <SelectItem value="retirada">Devolução de EPI</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Data da {tipo === 'retirada' ? 'devolução' : 'entrega'} *</Label>
              <Input
                type="date"
                value={dataEntrega}
                onChange={(e) => handleDataEntregaChange(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">Data em que o EPI foi {tipo === 'retirada' ? 'devolvido' : 'entregue'} (não é a data da assinatura).</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Itens (EPIs) */}
      <Card>
        <CardHeader>
          <CardTitle>{tipo === 'retirada' ? 'EPIs a devolver' : 'EPIs entregues'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {tipo === 'entrega' && (<>
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
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">EPI *</Label>
                      <NovoEpiDialog onCreated={(novo) => handleEpiCriado(index, novo)} />
                    </div>
                    <Combobox
                      value={item.epi_id}
                      onValueChange={(v) => handleEpiChange(index, v)}
                      options={epis.map((epi) => ({
                        value: epi.id,
                        label: epi.nome,
                        sublabel: formatCA(epi.ca),
                      }))}
                      placeholder="Selecionar EPI..."
                      searchPlaceholder="Buscar por nome ou CA..."
                      emptyText="Nenhum EPI encontrado."
                    />
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

                {epiSelecionado?.validade_ca && epiSelecionado.validade_ca < today && (
                  <div className="flex items-start gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>
                      Atenção: o CA deste EPI venceu em <strong>{formatDateBR(epiSelecionado.validade_ca)}</strong>.
                      Um EPI com CA vencido não deve ser entregue (requisito fiscalizado pela NR-6).
                    </span>
                  </div>
                )}

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
          </>)}

          {tipo === 'retirada' && (
            !colaboradorId ? (
              <p className="text-sm text-muted-foreground">Selecione um colaborador para ver os EPIs em uso.</p>
            ) : carregandoEmUso ? (
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Carregando EPIs em uso...
              </p>
            ) : itensEmUso.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Este colaborador não tem EPIs em uso para devolver.
              </p>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Marque os EPIs que estão sendo devolvidos (a devolução pode ser parcial):
                </p>
                {itensEmUso.map((i) => (
                  <label
                    key={i.id}
                    className={`flex items-center gap-3 border rounded-lg p-3 cursor-pointer transition-colors ${selecionados.has(i.id) ? 'border-slate-800 bg-slate-50' : 'hover:bg-slate-50'}`}
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-slate-800"
                      checked={selecionados.has(i.id)}
                      onChange={() => toggleSelecionado(i.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{i.epi?.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCA(i.epi?.ca)} · Qtd: {i.quantidade} · entregue em {formatDateBR(i.ficha?.data_entrega ?? '')}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            )
          )}
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
