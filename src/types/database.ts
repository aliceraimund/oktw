export type Role = 'rh' | 'gestor' | 'colaborador'
export type AlertaTipo = '30d' | '15d' | '7d' | 'vencido'
export type EpiStatus = 'ok' | 'atencao' | 'vencido'

export interface Profile {
  id: string
  nome: string
  email: string
  role: Role
  setor: string | null
  cargo: string | null
  ctps: string | null
  ativo: boolean
  created_at: string
}

export interface Epi {
  id: string
  nome: string
  ca: string
  validade_dias: number

  ativo: boolean
  created_at: string
}

// ─── Modelo v2 ────────────────────────────────────────────────

export interface FichaEntrega {
  id: string
  colaborador_id: string
  data_entrega: string
  tipo: 'entrega' | 'retirada'
  registrado_por: string | null
  token_assinatura: string
  assinado: boolean
  assinado_em: string | null
  pdf_url: string | null
  created_at: string
  // joins
  colaborador?: Profile
  itens?: ItemEntrega[]
}

export interface ItemEntrega {
  id: string
  ficha_id: string
  epi_id: string
  quantidade: number
  validade_dias: number
  data_vencimento: string
  created_at: string
  // joins
  epi?: Epi
  ficha?: FichaEntrega
}

export interface Assinatura {
  id: string
  ficha_id: string
  assinatura_base64: string
  ip_address: string | null
  user_agent: string | null
  signed_at: string
}

export interface Alerta {
  id: string
  item_id: string | null
  tipo: AlertaTipo
  enviado_em: string
}

export interface Configuracoes {
  id: number
  empresa_nome: string
  empresa_cnpj: string
  updated_at: string
}

