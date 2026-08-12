import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createAdminClient, createServerSupabaseClient } from '@/lib/supabase-server'

// POST — registra um disparo (envio de cobrança) de assinatura/vencimento.
export async function POST(req: NextRequest) {
  const { fichaId, itemId, canal, tipo } = await req.json()

  if (!canal || !['email', 'whatsapp'].includes(canal)) {
    return NextResponse.json({ error: 'Canal inválido.' }, { status: 400 })
  }
  if (!fichaId && !itemId) {
    return NextResponse.json({ error: 'Informe fichaId ou itemId.' }, { status: 400 })
  }

  // Quem disparou (opcional — não bloqueia o registro)
  let enviadoPor: string | null = null
  try {
    const supabaseUser = await createServerSupabaseClient()
    const { data: { user } } = await supabaseUser.auth.getUser()
    enviadoPor = user?.id ?? null
  } catch { /* segue sem autor */ }

  const admin = createAdminClient()
  const { error } = await admin.from('disparos').insert([{
    ficha_id: fichaId ?? null,
    item_id: itemId ?? null,
    canal,
    tipo: tipo === 'vencimento' ? 'vencimento' : 'assinatura',
    enviado_por: enviadoPor,
  }])

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  revalidatePath('/dashboard')
  return NextResponse.json({ ok: true })
}
