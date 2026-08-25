import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase-server'
import { exigirPerfil, getPerfilAtual } from '@/lib/auth'

// PATCH — atualiza dados do colaborador
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Somente Admin ou Gestor podem editar dados de colaboradores
  const perfil = await getPerfilAtual()
  if (perfil !== 'rh' && perfil !== 'gestor') {
    return NextResponse.json({ error: 'Sem permissão para editar.' }, { status: 403 })
  }

  const { id } = await params
  const supabase = createAdminClient()
  const body = await req.json()

  const { nome, setor, cargo, cpf, ctps, telefone, role, ativo } = body

  const dados: Record<string, unknown> = {
    nome,
    setor: setor || null,
    cargo: cargo || null,
    cpf: cpf || null,
    ctps: ctps || null,
    telefone: telefone || null,
    ativo,
  }

  // Apenas Admin pode alterar o Perfil (role). Isso impede que um Gestor
  // se promova a Admin e assuma permissões que não deveria ter.
  if (perfil === 'rh' && role) {
    dados.role = role
  }

  const { error } = await supabase.from('profiles').update(dados).eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  revalidatePath('/colaboradores')
  revalidatePath(`/colaboradores/${id}`)
  return NextResponse.json({ ok: true })
}

// DELETE — exclui colaborador, ou desativa se tiver fichas vinculadas (somente Admin)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await exigirPerfil(['rh'])
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { id } = await params
  const supabase = createAdminClient()

  // Verificar se existem fichas vinculadas (NR-6: histórico não pode ser apagado)
  const { count: fichasCount } = await supabase
    .from('fichas_entrega')
    .select('id', { count: 'exact', head: true })
    .eq('colaborador_id', id)

  if ((fichasCount ?? 0) > 0) {
    // Tem histórico — não pode excluir, apenas desativar
    return NextResponse.json(
      { error: 'tem_fichas', totalFichas: fichasCount },
      { status: 409 }
    )
  }

  // Sem fichas — exclusão completa.
  // Remove o usuário de autenticação, se existir. Perfis de teste antigos
  // foram criados direto na tabela profiles, sem usuário no Auth — nesse caso
  // deleteUser retorna "User not found", que ignoramos para poder limpar o perfil.
  const { error: authError } = await supabase.auth.admin.deleteUser(id)
  if (authError && !/not found|não encontrad/i.test(authError.message)) {
    return NextResponse.json({ error: authError.message }, { status: 500 })
  }

  // Garante a remoção do perfil (caso não haja usuário no Auth ou cascade).
  const { error: profileError } = await supabase.from('profiles').delete().eq('id', id)
  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 })

  revalidatePath('/colaboradores')
  return NextResponse.json({ ok: true })
}

// PATCH especial: desativar colaborador (remove acesso, mantém histórico)
export async function PUT(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = createAdminClient()

  // 1. Desativa o perfil
  await supabase.from('profiles').update({ ativo: false }).eq('id', id)

  // 2. Remove acesso ao sistema (desabilita login no Supabase Auth)
  await supabase.auth.admin.updateUserById(id, { ban_duration: '876600h' }) // ~100 anos

  revalidatePath('/colaboradores')
  revalidatePath(`/colaboradores/${id}`)
  return NextResponse.json({ ok: true, desativado: true })
}
