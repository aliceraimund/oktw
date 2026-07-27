import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'
import type { FichaEntrega, Profile } from '@/types/database'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = createAdminClient()

  const [{ data: colaborador }, { data: fichas }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', id).single(),
    supabase
      .from('fichas_entrega')
      .select('*, itens:itens_entrega(*, epi:epis(*))')
      .eq('colaborador_id', id)
      .order('data_entrega', { ascending: false }),
  ])

  if (!colaborador) {
    return NextResponse.json({ error: 'Colaborador não encontrado.' }, { status: 404 })
  }

  const { gerarRelatorioColaboradorPDF } = await import('@/lib/pdf')
  const pdfBytes = await gerarRelatorioColaboradorPDF(
    colaborador as Profile,
    (fichas as FichaEntrega[]) ?? []
  )

  const nomeArquivo = colaborador.nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '-')

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="historico-${nomeArquivo}.pdf"`,
    },
  })
}
