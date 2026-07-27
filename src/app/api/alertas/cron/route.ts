import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'
import { enviarAlertaVencimento } from '@/lib/email'
import { diasParaVencer } from '@/lib/utils'
import type { ItemEntrega, AlertaTipo } from '@/types/database'

// Chamado diariamente. O Vercel Cron dispara via GET e injeta o header
// Authorization: Bearer <CRON_SECRET> automaticamente. POST mantido para
// chamadas manuais / compatibilidade.
export async function GET(req: NextRequest) {
  return processarAlertas(req)
}

export async function POST(req: NextRequest) {
  return processarAlertas(req)
}

async function processarAlertas(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  // Buscar todos os itens de fichas assinadas
  const { data, error } = await supabase
    .from('itens_entrega')
    .select('*, epi:epis(*), ficha:fichas_entrega(*, colaborador:profiles!fichas_entrega_colaborador_id_fkey(*))')
    .eq('fichas_entrega.assinado', true)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const itens = ((data as ItemEntrega[]) || []).filter((i) => i.ficha?.assinado)

  // Alertas já enviados (por item + tipo)
  const { data: alertasExistentes } = await supabase
    .from('alertas')
    .select('item_id, tipo')

  const alertasSet = new Set(
    (alertasExistentes || [])
      .filter((a) => a.item_id)
      .map((a) => `${a.item_id}:${a.tipo}`)
  )

  const resultados: { itemId: string; tipo: AlertaTipo; ok: boolean }[] = []

  for (const item of itens) {
    const dias = diasParaVencer(item.data_vencimento)

    const tiposParaEnviar: AlertaTipo[] = []
    if (dias < 0)       tiposParaEnviar.push('vencido')
    else if (dias <= 7)  tiposParaEnviar.push('7d')
    else if (dias <= 15) tiposParaEnviar.push('15d')
    else if (dias <= 30) tiposParaEnviar.push('30d')

    for (const tipo of tiposParaEnviar) {
      const chave = `${item.id}:${tipo}`
      if (alertasSet.has(chave)) continue

      try {
        await enviarAlertaVencimento(item, tipo)
        await supabase.from('alertas').insert([{ item_id: item.id, tipo }])
        alertasSet.add(chave)
        resultados.push({ itemId: item.id, tipo, ok: true })
      } catch (err) {
        console.error(`Erro alerta ${tipo} item ${item.id}:`, err)
        resultados.push({ itemId: item.id, tipo, ok: false })
      }
    }
  }

  return NextResponse.json({ processados: resultados.length, resultados })
}
