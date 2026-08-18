import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase-server'
import { exigirPerfil } from '@/lib/auth'

// DELETE — exclui ficha e todos os dados relacionados (somente Admin)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await exigirPerfil(['rh'])
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { id } = await params
  const supabase = createAdminClient()

  // 1. Buscar itens para apagar alertas em cascata
  const { data: itens } = await supabase
    .from('itens_entrega')
    .select('id')
    .eq('ficha_id', id)

  const itemIds = (itens ?? []).map((i) => i.id)

  // 2. Apagar alertas vinculados aos itens
  if (itemIds.length > 0) {
    await supabase.from('alertas').delete().in('item_id', itemIds)
  }

  // 3. Apagar assinaturas vinculadas à ficha
  await supabase.from('assinaturas').delete().eq('ficha_id', id)

  // 4. Buscar pdf_url para remover do Storage
  const { data: ficha } = await supabase
    .from('fichas_entrega')
    .select('pdf_url')
    .eq('id', id)
    .single()

  if (ficha?.pdf_url) {
    // Extrair nome do arquivo da URL
    const fileName = ficha.pdf_url.split('/fichas-assinadas/').at(-1)
    if (fileName) {
      await supabase.storage.from('fichas-assinadas').remove([fileName])
    }
  }

  // 5. Apagar itens de entrega
  await supabase.from('itens_entrega').delete().eq('ficha_id', id)

  // 6. Apagar a ficha
  const { error } = await supabase.from('fichas_entrega').delete().eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  revalidatePath('/entregas')
  return NextResponse.json({ ok: true })
}
