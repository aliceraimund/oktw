import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase-server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('operacoes_epi')
    .select('*, epi:epis(nome, ca)')
    .eq('colaborador_id', id)
    .order('data_operacao', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ operacoes: data })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = createAdminClient()
  const body = await req.json()

  const { tipo, ficha_id, epi_id, data_operacao, observacao } = body

  if (!tipo || !ficha_id || !epi_id || !data_operacao) {
    return NextResponse.json({ error: 'Campos obrigatórios ausentes.' }, { status: 400 })
  }

  const { error } = await supabase.from('operacoes_epi').insert([{
    colaborador_id: id,
    tipo,
    ficha_id,
    epi_id,
    data_operacao,
    observacao: observacao || null,
  }])

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  revalidatePath(`/colaboradores/${id}`)
  return NextResponse.json({ ok: true })
}
