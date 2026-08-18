'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SetorInput } from '@/components/SetorInput'
import { AlertTriangle, Loader2, Pencil, Trash2, User, KeyRound, Check } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { formatCPF, formatTelefone, formatCTPS } from '@/lib/utils'
import type { Profile } from '@/types/database'

interface Props {
  colaborador: Profile
  podeExcluir?: boolean
}

const roleLabel: Record<string, string> = {
  rh: 'Admin',
  gestor: 'Gestor',
  colaborador: 'Colaborador',
}

export function ColaboradorActions({ colaborador, podeExcluir = false }: Props) {
  const router = useRouter()
  const [editMode, setEditMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Redefinição de senha
  const [showSenha, setShowSenha] = useState(false)
  const [novaSenha, setNovaSenha] = useState('')
  const [salvandoSenha, setSalvandoSenha] = useState(false)
  const [senhaOk, setSenhaOk] = useState(false)
  const [senhaErro, setSenhaErro] = useState<string | null>(null)

  async function handleRedefinirSenha() {
    setSalvandoSenha(true)
    setSenhaErro(null)
    const res = await fetch(`/api/colaboradores/${colaborador.id}/senha`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senha: novaSenha }),
    })
    const json = await res.json()
    if (!res.ok) { setSenhaErro(json.error || 'Erro ao redefinir senha.'); setSalvandoSenha(false); return }
    setSalvandoSenha(false)
    setSenhaOk(true)
    setTimeout(() => { setShowSenha(false); setSenhaOk(false); setNovaSenha('') }, 1500)
  }

  const [form, setForm] = useState({
    nome: colaborador.nome,
    setor: colaborador.setor ?? '',
    cargo: colaborador.cargo ?? '',
    cpf: colaborador.cpf ?? '',
    ctps: colaborador.ctps ?? '',
    telefone: colaborador.telefone ?? '',
    role: colaborador.role,
    ativo: colaborador.ativo ?? true,
  })

  function update(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    const res = await fetch(`/api/colaboradores/${colaborador.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const json = await res.json()
    if (!res.ok) { setError(json.error || 'Erro ao salvar.'); setSaving(false); return }
    setEditMode(false)
    setSaving(false)
    router.refresh()
  }

  const [temFichas, setTemFichas] = useState(false)
  const [totalFichas, setTotalFichas] = useState(0)

  async function handleDelete() {
    setDeleting(true)
    setError(null)
    const res = await fetch(`/api/colaboradores/${colaborador.id}`, { method: 'DELETE' })
    const json = await res.json()
    if (!res.ok) {
      if (json.error === 'tem_fichas') {
        setTemFichas(true)
        setTotalFichas(json.totalFichas ?? 0)
      } else {
        setError(json.error || 'Erro ao excluir.')
      }
      setDeleting(false)
      return
    }
    router.push('/colaboradores')
    router.refresh()
  }

  async function handleDesativar() {
    setDeleting(true)
    setError(null)
    const res = await fetch(`/api/colaboradores/${colaborador.id}`, { method: 'PUT' })
    const json = await res.json()
    if (!res.ok) {
      setError(json.error || 'Erro ao desativar.')
      setDeleting(false)
      return
    }
    setShowDelete(false)
    setTemFichas(false)
    router.push('/colaboradores')
    router.refresh()
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" /> Dados do colaborador
          </CardTitle>
          <div className="flex gap-2">
            {!editMode && (
              <>
                <Button size="sm" variant="outline" onClick={() => setEditMode(true)}>
                  <Pencil className="h-3.5 w-3.5 mr-1.5" /> Editar
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setSenhaErro(null); setNovaSenha(''); setShowSenha(true) }}>
                  <KeyRound className="h-3.5 w-3.5 mr-1.5" /> Redefinir senha
                </Button>
              </>
            )}
            {podeExcluir && (
              <Button size="sm" variant="destructive" onClick={() => setShowDelete(true)}>
                <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Excluir
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!editMode ? (
            // Modo visualização
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">E-mail</p>
                <p className="font-medium">{colaborador.email}</p>
              </div>
              <div>
                <p className="text-muted-foreground">WhatsApp / Telefone</p>
                <p className="font-medium">{colaborador.telefone ? formatTelefone(colaborador.telefone) : '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Setor</p>
                <p className="font-medium">{colaborador.setor ?? '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Cargo</p>
                <p className="font-medium">{colaborador.cargo ?? '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">CPF</p>
                <p className="font-medium font-mono">{colaborador.cpf ? formatCPF(colaborador.cpf) : '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">CTPS</p>
                <p className="font-medium font-mono">{colaborador.ctps ? formatCTPS(colaborador.ctps) : '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Perfil</p>
                <Badge variant="secondary">{roleLabel[colaborador.role] || colaborador.role}</Badge>
              </div>
              <div>
                <p className="text-muted-foreground">Status</p>
                <Badge variant={colaborador.ativo ? 'success' : 'outline'}>
                  {colaborador.ativo ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
            </div>
          ) : (
            // Modo edição
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label>Nome completo *</Label>
                  <Input value={form.nome} onChange={(e) => update('nome', e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Setor</Label>
                  <SetorInput value={form.setor} onChange={(v) => update('setor', v)} />
                </div>
                <div className="space-y-2">
                  <Label>Cargo</Label>
                  <Input value={form.cargo} onChange={(e) => update('cargo', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>CPF</Label>
                  <Input value={form.cpf} onChange={(e) => update('cpf', e.target.value)}
                    onBlur={() => update('cpf', formatCPF(form.cpf))} placeholder="Ex: 000.000.000-00" />
                </div>
                <div className="space-y-2">
                  <Label>WhatsApp / Telefone</Label>
                  <Input value={form.telefone} onChange={(e) => update('telefone', e.target.value)}
                    onBlur={() => update('telefone', formatTelefone(form.telefone))} placeholder="Ex: (11) 99999-9999" />
                </div>
                <div className="space-y-2">
                  <Label>CTPS (nº série / UF)</Label>
                  <Input value={form.ctps} onChange={(e) => update('ctps', e.target.value)}
                    onBlur={() => update('ctps', formatCTPS(form.ctps))} placeholder="Ex: 043978-00014-CE" />
                </div>
                <div className="space-y-2">
                  <Label>Perfil</Label>
                  <Select value={form.role} onValueChange={(v) => update('role', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="colaborador">Colaborador</SelectItem>
                      <SelectItem value="gestor">Gestor</SelectItem>
                      <SelectItem value="rh">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={form.ativo ? 'ativo' : 'inativo'}
                    onValueChange={(v) => update('ativo', v === 'ativo')}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="inativo">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {error && <p className="text-sm text-destructive bg-red-50 p-3 rounded-md">{error}</p>}

              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Salvar
                </Button>
                <Button variant="outline" onClick={() => { setEditMode(false); setError(null) }}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de exclusão */}
      <Dialog open={showDelete} onOpenChange={(o) => { if (!o) { setShowDelete(false); setTemFichas(false); setError(null) } }}>
        <DialogContent>
          {!temFichas ? (
            <>
              <DialogHeader>
                <DialogTitle>Excluir colaborador</DialogTitle>
                <DialogDescription>
                  Tem certeza que deseja excluir <strong>{colaborador.nome}</strong>?
                  O perfil e o acesso ao sistema serão removidos permanentemente.
                </DialogDescription>
              </DialogHeader>
              {error && <p className="text-sm text-destructive bg-red-50 p-3 rounded-md">{error}</p>}
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDelete(false)} disabled={deleting}>
                  Cancelar
                </Button>
                <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                  {deleting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Excluir colaborador
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Não é possível excluir
                </DialogTitle>
              </DialogHeader>

              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 space-y-1">
                <p className="font-semibold">
                  {colaborador.nome} possui {totalFichas} {totalFichas === 1 ? 'ficha de entrega' : 'fichas de entrega'} vinculada{totalFichas === 1 ? '' : 's'}.
                </p>
                <p className="text-amber-700">
                  Pela <strong>NR-6</strong>, o histórico de EPIs não pode ser apagado — ele é exigido para fins de auditoria e fiscalização.
                </p>
              </div>

              <p className="text-sm text-muted-foreground">
                Como alternativa, você pode <strong>desativar</strong> o colaborador: o acesso ao sistema
                é removido e o perfil fica inativo, mas as fichas são preservadas.
              </p>

              {error && <p className="text-sm text-destructive bg-red-50 p-3 rounded-md">{error}</p>}

              <DialogFooter>
                <Button variant="outline" onClick={() => { setShowDelete(false); setTemFichas(false) }} disabled={deleting}>
                  Cancelar
                </Button>
                <Button variant="destructive" onClick={handleDesativar} disabled={deleting}>
                  {deleting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Desativar colaborador
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de redefinição de senha */}
      <Dialog open={showSenha} onOpenChange={(o) => { if (!o) setShowSenha(false) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redefinir senha de acesso</DialogTitle>
            <DialogDescription>
              Defina uma nova senha para <strong>{colaborador.nome}</strong> acessar o sistema
              (e-mail {colaborador.email}).
            </DialogDescription>
          </DialogHeader>

          {senhaOk ? (
            <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-3 text-sm">
              <Check className="h-4 w-4" /> Senha redefinida com sucesso.
            </div>
          ) : (
            <>
              <div className="space-y-2 pt-1">
                <Label>Nova senha</Label>
                <Input
                  type="text"
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  autoComplete="new-password"
                />
                <p className="text-xs text-muted-foreground">
                  Informe a nova senha ao colaborador. Ele poderá usá-la no próximo login.
                </p>
              </div>
              {senhaErro && <p className="text-sm text-destructive bg-red-50 p-3 rounded-md">{senhaErro}</p>}
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowSenha(false)} disabled={salvandoSenha}>
                  Cancelar
                </Button>
                <Button onClick={handleRedefinirSenha} disabled={salvandoSenha || novaSenha.length < 6}>
                  {salvandoSenha && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Salvar nova senha
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
