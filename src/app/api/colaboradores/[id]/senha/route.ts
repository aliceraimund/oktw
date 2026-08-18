import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createServerSupabaseClient } from '@/lib/supabase-server'

// POST — redefine a senha de acesso de um colaborador (somente RH)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // Autorização: apenas RH pode redefinir senhas
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const { data: perfil } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (perfil?.role !== 'rh') {
    return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 })
  }

  const { senha } = await req.json()
  if (!senha || typeof senha !== 'string' || senha.length < 6) {
    return NextResponse.json({ error: 'A senha deve ter ao menos 6 caracteres.' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { error } = await admin.auth.admin.updateUserById(id, { password: senha })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
