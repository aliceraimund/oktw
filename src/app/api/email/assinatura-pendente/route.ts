import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createAdminClient, createServerSupabaseClient } from '@/lib/supabase-server'
import { enviarEmailAssinaturaPendente } from '@/lib/email'
import type { FichaEntrega } from '@/types/database'

export async function POST(req: NextRequest) {
  const { fichaId } = await req.json()

  if (!fichaId) {
    return NextResponse.json({ error: 'fichaId obrigatório' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data: ficha, error } = await supabase
    .from('fichas_entrega')
    .select('*, colaborador:profiles!fichas_entrega_colaborador_id_fkey(*), itens:itens_entrega(*, epi:epis(*))')
    .eq('id', fichaId)
    .single()

  if (error || !ficha) {
    return NextResponse.json({ error: 'Ficha não encontrada.' }, { status: 404 })
  }

  try {
    await enviarEmailAssinaturaPendente(ficha as FichaEntrega)

    // Registra o disparo (histórico de cobranças)
    let enviadoPor: string | null = null
    try {
      const supabaseUser = await createServerSupabaseClient()
      const { data: { user } } = await supabaseUser.auth.getUser()
      enviadoPor = user?.id ?? null
    } catch { /* segue sem autor */ }
    await supabase.from('disparos').insert([{
      ficha_id: ficha.id, canal: 'email', tipo: 'assinatura', enviado_por: enviadoPor,
    }])
    revalidatePath('/dashboard')

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Erro ao enviar e-mail:', err)
    return NextResponse.json({ error: 'Erro ao enviar e-mail.' }, { status: 500 })
  }
}
