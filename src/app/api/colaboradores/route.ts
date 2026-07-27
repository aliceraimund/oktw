import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  // Verificar que o solicitante é RH
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'rh') {
    return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 })
  }

  const { nome, email, senha, role, setor, cargo, cpf, ctps } = await req.json()

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
    .update({ nome, role, setor: setor || null, cargo: cargo || null, cpf: cpf || null, ctps: ctps || null })
    .eq('id', newUser.user.id)

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, userId: newUser.user.id })
}
