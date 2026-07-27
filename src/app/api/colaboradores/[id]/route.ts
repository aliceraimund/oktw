import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase-server'

// PATCH — atualiza dados do colaborador
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = createAdminClient()
  const body = await req.json()

  const { nome, setor, cargo, cpf, ctps, role, ativo } = body

  const { error } = await supabase
    .from('profiles')
    .update({ nome, setor: setor || null, cargo: cargo || null, cpf: cpf || null, ctps: ctps || null, role, ativo })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  revalidatePath('/colaboradores')
  revalidatePath(`/colaboradores/${id}`)
  return NextResponse.json({ ok: true })
}

// DELETE — exclui colaborador, ou desativa se tiver fichas vinculadas
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

  // Sem fichas — exclusão completa
  const { error } = await supabase.auth.admin.deleteUser(id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

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
