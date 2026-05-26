import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase-server'

// PATCH — atualiza dados do EPI
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = createAdminClient()
  const body = await req.json()

  const { nome, ca, validade_dias, ativo } = body

  const { error } = await supabase
    .from('epis')
    .update({ nome, ca, validade_dias, ativo })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// DELETE — exclui EPI (apenas se não tiver itens de entrega vinculados)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = createAdminClient()

  // Verificar se há itens de entrega vinculados
  const { count } = await supabase
    .from('itens_entrega')
    .select('id', { count: 'exact', head: true })
    .eq('epi_id', id)

  if ((count ?? 0) > 0) {
    return NextResponse.json(
      { error: 'Este EPI possui entregas registradas e não pode ser excluído. Você pode desativá-lo.' },
      { status: 409 }
    )
  }

  const { error } = await supabase.from('epis').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  revalidatePath('/epis')
  return NextResponse.json({ ok: true })
}
