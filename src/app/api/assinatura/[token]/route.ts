import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'
import type { FichaEntrega } from '@/types/database'

// GET: Retorna dados da ficha pelo token (sem auth)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const supabase = createAdminClient()

  const { data: ficha, error } = await supabase
    .from('fichas_entrega')
    .select('*, colaborador:profiles!fichas_entrega_colaborador_id_fkey(*), itens:itens_entrega(*, epi:epis(*))')
    .eq('token_assinatura', token)
    .single()

  if (error || !ficha) {
    return NextResponse.json({ error: 'Ficha não encontrada.' }, { status: 404 })
  }

  if (ficha.assinado) {
    return NextResponse.json({ error: 'Esta ficha já foi assinada.' }, { status: 409 })
  }

  const { token_assinatura: _, ...fichaSafe } = ficha
  return NextResponse.json({ ficha: fichaSafe })
}

// POST: Salva assinatura e atualiza ficha
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const supabase = createAdminClient()

  const { data: ficha, error: findError } = await supabase
    .from('fichas_entrega')
    .select('*, colaborador:profiles!fichas_entrega_colaborador_id_fkey(*), itens:itens_entrega(*, epi:epis(*))')
    .eq('token_assinatura', token)
    .single()

  if (findError || !ficha) {
    return NextResponse.json({ error: 'Ficha não encontrada.' }, { status: 404 })
  }

  if (ficha.assinado) {
    return NextResponse.json({ error: 'Esta ficha já foi assinada.' }, { status: 409 })
  }

  const body = await req.json()
  const { assinaturaBase64 } = body

  if (!assinaturaBase64 || typeof assinaturaBase64 !== 'string') {
    return NextResponse.json({ error: 'Assinatura inválida.' }, { status: 400 })
  }

  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
  const userAgent = req.headers.get('user-agent') || 'unknown'

  // 1. Salvar assinatura na tabela de auditoria
  const { error: sigError } = await supabase.from('assinaturas').insert([{
    ficha_id: ficha.id,
    assinatura_base64: assinaturaBase64,
    ip_address: ip,
    user_agent: userAgent,
  }])

  if (sigError) {
    return NextResponse.json({ error: 'Erro ao salvar assinatura.' }, { status: 500 })
  }

  // 2. Gerar PDF (stub — implementar com pdf-lib quando Resend estiver configurado)
  let pdfUrl: string | null = null

  try {
    const { gerarFichaEntregaPDFv2 } = await import('@/lib/pdf')
    const fichaCompleta = ficha as FichaEntrega
    const pdfBytes = await gerarFichaEntregaPDFv2(fichaCompleta, assinaturaBase64)

    const fileName = `${ficha.id}.pdf`
    const { error: uploadError } = await supabase.storage
      .from('fichas-assinadas')
      .upload(fileName, pdfBytes, { contentType: 'application/pdf', upsert: true })

    if (!uploadError) {
      const { data: urlData } = supabase.storage.from('fichas-assinadas').getPublicUrl(fileName)
      pdfUrl = urlData.publicUrl
    }
  } catch (pdfError) {
    console.error('Erro ao gerar PDF:', pdfError)
    // Continua sem PDF — assinatura salva independentemente
  }

  // 3. Marcar ficha como assinada
  const { error: updateError } = await supabase
    .from('fichas_entrega')
    .update({ assinado: true, assinado_em: new Date().toISOString(), pdf_url: pdfUrl })
    .eq('id', ficha.id)

  if (updateError) {
    return NextResponse.json({ error: 'Erro ao atualizar ficha.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, pdfUrl })
}
