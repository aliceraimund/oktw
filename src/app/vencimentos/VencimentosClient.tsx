'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { EpiStatusBadge } from '@/components/EpiStatusBadge'
import { LembreteVencimentoWhatsApp } from '@/components/LembreteVencimentoWhatsApp'
import { formatDateBR, diasParaVencer, formatCA } from '@/lib/utils'
import type { ItemEntrega } from '@/types/database'

const selectClass =
  'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm'

export function VencimentosClient({ itens }: { itens: ItemEntrega[] }) {
  const [colaborador, setColaborador] = useState('')
  const [setor, setSetor] = useState('')
  const [status, setStatus] = useState('')
  const [de, setDe] = useState('')
  const [ate, setAte] = useState('')

  // Opções de filtro derivadas dos dados
  const colaboradores = useMemo(() => {
    const map = new Map<string, string>()
    itens.forEach((i) => {
      const c = i.ficha?.colaborador
      if (c?.id && c.nome) map.set(c.id, c.nome)
    })
    return Array.from(map, ([id, nome]) => ({ id, nome })).sort((a, b) =>
      a.nome.localeCompare(b.nome, 'pt-BR')
    )
  }, [itens])

  const setores = useMemo(() => {
    const s = new Set<string>()
    itens.forEach((i) => { if (i.ficha?.colaborador?.setor) s.add(i.ficha.colaborador.setor) })
    return Array.from(s).sort((a, b) => a.localeCompare(b, 'pt-BR'))
  }, [itens])

  const filtrados = useMemo(() => {
    return itens.filter((i) => {
      if (colaborador && i.ficha?.colaborador_id !== colaborador) return false
      if (setor && i.ficha?.colaborador?.setor !== setor) return false
      const venc = i.data_vencimento.slice(0, 10)
      if (de && venc < de) return false
      if (ate && venc > ate) return false
      if (status) {
        const d = diasParaVencer(i.data_vencimento)
        if (status === 'vencido' && d >= 0) return false
        if (status === 'atencao' && !(d >= 0 && d <= 30)) return false
        if (status === 'ok' && d <= 30) return false
      }
      return true
    })
  }, [itens, colaborador, setor, status, de, ate])

  const vencidos = filtrados.filter((i) => diasParaVencer(i.data_vencimento) < 0)
  const atencao  = filtrados.filter((i) => { const d = diasParaVencer(i.data_vencimento); return d >= 0 && d <= 30 })
  const ok       = filtrados.filter((i) => diasParaVencer(i.data_vencimento) > 30)
  const ordenados = [...vencidos, ...atencao, ...ok]

  const temFiltro = colaborador || setor || status || de || ate

  function limpar() {
    setColaborador(''); setSetor(''); setStatus(''); setDe(''); setAte('')
  }

  return (
    <div className="space-y-6">
      {/* Resumo (reflete os filtros) */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Vencidos',           count: vencidos.length, color: 'bg-red-50 border-red-200 text-red-700' },
          { label: 'Vencem em ≤30 dias', count: atencao.length,  color: 'bg-orange-50 border-orange-200 text-orange-700' },
          { label: 'Em dia',             count: ok.length,       color: 'bg-green-50 border-green-200 text-green-700' },
        ].map(({ label, count, color }) => (
          <div key={label} className={`border rounded-lg p-4 ${color}`}>
            <p className="text-3xl font-bold">{count}</p>
            <p className="text-sm font-medium">{label}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Colaborador</Label>
              <select className={selectClass} value={colaborador} onChange={(e) => setColaborador(e.target.value)}>
                <option value="">Todos</option>
                {colaboradores.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Setor</Label>
              <select className={selectClass} value={setor} onChange={(e) => setSetor(e.target.value)}>
                <option value="">Todos</option>
                {setores.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Status</Label>
              <select className={selectClass} value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">Todos</option>
                <option value="vencido">Vencidos</option>
                <option value="atencao">Vencem em ≤30 dias</option>
                <option value="ok">Em dia</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Vencimento de</Label>
              <Input type="date" value={de} onChange={(e) => setDe(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Vencimento até</Label>
              <Input type="date" value={ate} onChange={(e) => setAte(e.target.value)} />
            </div>
          </div>
          {temFiltro && (
            <div className="mt-3 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{ordenados.length} resultado(s)</p>
              <button type="button" onClick={limpar} className="text-xs text-slate-600 underline">
                Limpar filtros
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Colaborador</TableHead>
                <TableHead>Setor</TableHead>
                <TableHead>EPI</TableHead>
                <TableHead>CA</TableHead>
                <TableHead>Data da entrega</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ordenados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-8">
                    Nenhum item encontrado com esses filtros.
                  </TableCell>
                </TableRow>
              ) : ordenados.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    <Link href={`/colaboradores/${item.ficha?.colaborador_id}`} className="hover:underline">
                      {item.ficha?.colaborador?.nome}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{item.ficha?.colaborador?.setor ?? '—'}</TableCell>
                  <TableCell>{item.epi?.nome}</TableCell>
                  <TableCell className="font-mono text-sm">{formatCA(item.epi?.ca)}</TableCell>
                  <TableCell>{formatDateBR(item.ficha?.data_entrega ?? '')}</TableCell>
                  <TableCell>{formatDateBR(item.data_vencimento)}</TableCell>
                  <TableCell><EpiStatusBadge dataVencimento={item.data_vencimento} /></TableCell>
                  <TableCell className="text-right">
                    {diasParaVencer(item.data_vencimento) < 0 && (
                      <LembreteVencimentoWhatsApp
                        colaborador={item.ficha?.colaborador}
                        epi={item.epi}
                        dataVencimento={item.data_vencimento}
                      />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
