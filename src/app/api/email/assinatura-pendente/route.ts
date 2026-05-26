import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'
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
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Erro ao enviar e-mail:', err)
    return NextResponse.json({ error: 'Erro ao enviar e-mail.' }, { status: 500 })
  }
}
