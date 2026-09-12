import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'
import { exigirPerfil } from '@/lib/auth'

// POST — redefine a senha de acesso de um colaborador (Admin ou Gestor)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const auth = await exigirPerfil(['rh', 'gestor'])
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { senha } = await req.json()
  if (!senha || typeof senha !== 'string' || senha.length < 6) {
    return NextResponse.json({ error: 'A senha deve ter ao menos 6 caracteres.' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { error } = await admin.auth.admin.updateUserById(id, { password: senha })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
