import { createAdminClient } from './supabase-server'
import { DEFAULT_CONFIG_PDF, type ConfigPdf } from './pdf-config'

/** Carrega a config do PDF do banco (linha id=1), com fallback para os padrões. */
export async function carregarConfigPdf(): Promise<ConfigPdf> {
  try {
    const { data } = await createAdminClient().from('config_pdf').select('*').eq('id', 1).single()
    if (!data) return DEFAULT_CONFIG_PDF
    return {
      empresa_nome: data.empresa_nome || DEFAULT_CONFIG_PDF.empresa_nome,
      empresa_cnpj: data.empresa_cnpj || DEFAULT_CONFIG_PDF.empresa_cnpj,
      campos: { ...DEFAULT_CONFIG_PDF.campos, ...(data.campos || {}) },
      termo_paragrafos:
        Array.isArray(data.termo_paragrafos) && data.termo_paragrafos.length > 0
          ? data.termo_paragrafos
          : DEFAULT_CONFIG_PDF.termo_paragrafos,
    }
  } catch {
    return DEFAULT_CONFIG_PDF
  }
}
