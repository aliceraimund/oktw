import { Badge } from '@/components/ui/badge'
import { diasParaVencer, getEpiStatus } from '@/lib/utils'
import type { EpiStatus } from '@/types/database'

interface EpiStatusBadgeProps {
  dataVencimento: string
  showDays?: boolean
}

export function EpiStatusBadge({ dataVencimento, showDays = true }: EpiStatusBadgeProps) {
  const dias = diasParaVencer(dataVencimento)
  const status: EpiStatus = getEpiStatus(dias)

  const config: Record<EpiStatus, { variant: 'success' | 'warning' | 'danger'; label: string }> = {
    ok: { variant: 'success', label: showDays ? `${dias}d restantes` : 'Em dia' },
    atencao: { variant: 'warning', label: showDays ? `${dias}d restantes` : 'Atenção' },
    vencido: { variant: 'danger', label: dias === 0 ? 'Vence hoje' : `Vencido há ${Math.abs(dias)}d` },
  }

  const { variant, label } = config[status]
  return <Badge variant={variant}>{label}</Badge>
}
