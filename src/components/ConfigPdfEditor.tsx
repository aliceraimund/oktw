'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FileText, Plus, Trash2, Loader2, Check, RotateCcw, AlertTriangle, ChevronDown } from 'lucide-react'
import { DEFAULT_CONFIG_PDF, type ConfigPdf, type CamposPdf } from '@/lib/pdf-config'

const CAMPOS: [keyof CamposPdf, string][] = [
  ['cpf', 'CPF'],
  ['ctps', 'CTPS'],
  ['cargo', 'Cargo'],
  ['setor', 'Setor'],
  ['data', 'Data'],
]

export function ConfigPdfEditor({ inicial }: { inicial: ConfigPdf }) {
  const router = useRouter()
  const [empresaNome, setEmpresaNome] = useState(inicial.empresa_nome)
  const [empresaCnpj, setEmpresaCnpj] = useState(inicial.empresa_cnpj)
  const [campos, setCampos] = useState<CamposPdf>(inicial.campos)
  const [paragrafos, setParagrafos] = useState<string[]>(inicial.termo_paragrafos)
  const [salvando, setSalvando] = useState(false)
  const [ok, setOk] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [aberto, setAberto] = useState(false)

  function restaurarPadrao() {
    if (!confirm('Restaurar o texto e os campos para o padrão original? As alterações não salvas serão perdidas.')) return
    setEmpresaNome(DEFAULT_CONFIG_PDF.empresa_nome)
    setEmpresaCnpj(DEFAULT_CONFIG_PDF.empresa_cnpj)
    setCampos(DEFAULT_CONFIG_PDF.campos)
    setParagrafos(DEFAULT_CONFIG_PDF.termo_paragrafos)
  }

  async function salvar() {
    setSalvando(true)
    setErro(null)
    setOk(false)
    const { error } = await createClient().from('config_pdf').upsert({
      id: 1,
      empresa_nome: empresaNome.trim(),
      empresa_cnpj: empresaCnpj.trim(),
      campos,
      termo_paragrafos: paragrafos.map((p) => p.trim()).filter(Boolean),
      updated_at: new Date().toISOString(),
    })
    setSalvando(false)
    if (error) { setErro(error.message); return }
    setOk(true)
    setTimeout(() => setOk(false), 3000)
    router.refresh()
  }

  return (
    <Card>
      <button
        type="button"
        onClick={() => setAberto((a) => !a)}
        className="w-full flex items-center justify-between p-6 text-left"
      >
        <span className="text-base font-semibold flex items-center gap-2">
          <FileText className="h-4 w-4" /> Modelo do documento (PDF)
        </span>
        <span className="flex items-center gap-2 text-sm text-muted-foreground">
          {aberto ? 'Recolher' : 'Editar modelo'}
          <ChevronDown className={`h-4 w-4 transition-transform ${aberto ? 'rotate-180' : ''}`} />
        </span>
      </button>
      {aberto && (
      <CardContent className="space-y-6 pt-0">
        {/* Aviso jurídico */}
        <div className="flex items-start gap-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <p>
            As alterações no texto do Termo têm <strong>valor jurídico</strong> e são de responsabilidade
            de quem edita. Recomendamos que qualquer mudança seja revisada por um advogado. O provedor do
            sistema não se responsabiliza por edições feitas aqui.
          </p>
        </div>

        {/* Empresa */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Razão social da empresa</Label>
            <Input value={empresaNome} onChange={(e) => setEmpresaNome(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>CNPJ</Label>
            <Input value={empresaCnpj} onChange={(e) => setEmpresaCnpj(e.target.value)} />
          </div>
        </div>

        {/* Campos do topo */}
        <div className="space-y-2">
          <Label>Campos exibidos no topo do documento</Label>
          <div className="flex flex-wrap gap-4">
            {CAMPOS.map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-slate-800"
                  checked={campos[key]}
                  onChange={(e) => setCampos((c) => ({ ...c, [key]: e.target.checked }))}
                />
                {label}
              </label>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Nome do colaborador e assinatura aparecem sempre.</p>
        </div>

        {/* Cláusulas do termo */}
        <div className="space-y-2">
          <Label>Cláusulas do Termo de Responsabilidade (entrega)</Label>
          <p className="text-xs text-muted-foreground">
            Use <code className="bg-slate-100 px-1 rounded">{'{EMPRESA}'}</code> e{' '}
            <code className="bg-slate-100 px-1 rounded">{'{CNPJ}'}</code> onde quiser inserir o nome e o CNPJ da empresa.
          </p>
          <div className="space-y-2">
            {paragrafos.map((p, i) => (
              <div key={i} className="flex gap-2">
                <textarea
                  value={p}
                  onChange={(e) => setParagrafos((arr) => arr.map((x, j) => (j === i ? e.target.value : x)))}
                  rows={2}
                  className="flex-1 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <button
                  type="button"
                  onClick={() => setParagrafos((arr) => arr.filter((_, j) => j !== i))}
                  className="text-slate-400 hover:text-red-600 shrink-0 self-start mt-2"
                  aria-label="Remover cláusula"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => setParagrafos((arr) => [...arr, ''])}>
            <Plus className="h-4 w-4 mr-1.5" /> Adicionar cláusula
          </Button>
        </div>

        {erro && <p className="text-sm text-destructive bg-red-50 p-3 rounded-md">{erro}</p>}

        {/* Ações */}
        <div className="flex flex-wrap items-center gap-3 border-t pt-4">
          <Button onClick={salvar} disabled={salvando}>
            {salvando ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : ok ? <Check className="h-4 w-4 mr-2" /> : null}
            {ok ? 'Salvo!' : 'Salvar modelo'}
          </Button>
          <Button type="button" variant="outline" onClick={restaurarPadrao}>
            <RotateCcw className="h-4 w-4 mr-2" /> Restaurar padrão
          </Button>
        </div>
      </CardContent>
      )}
    </Card>
  )
}
