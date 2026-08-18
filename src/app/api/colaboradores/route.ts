import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'
import { exigirPerfil } from '@/lib/auth'

export async function POST(req: NextRequest) {
  // Admin e Gestor podem criar colaboradores/acessos
  const auth = await exigirPerfil(['rh', 'gestor'])
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { nome, email, senha, role, setor, cargo, cpf, ctps, telefone } = await req.json()

  const admin = createAdminClient()

  // Criar usuário no Supabase Auth
  const { data: newUser, error: authError } = await admin.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
    user_metadata: { nome, role },
  })

  if (authError || !newUser.user) {
    return NextResponse.json({ error: authError?.message || 'Erro ao criar usuário.' }, { status: 400 })
  }

  // Atualizar perfil com dados adicionais
  const { error: profileError } = await admin
    .from('profiles')
    .update({ nome, role, setor: setor || null, cargo: cargo || null, cpf: cpf || null, ctps: ctps || null, telefone: telefone || null })
    .eq('id', newUser.user.id)

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, userId: newUser.user.id })
}
