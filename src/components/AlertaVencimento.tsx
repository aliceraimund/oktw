import { AlertTriangle, XCircle, Clock } from 'lucide-react'
import { diasParaVencer, formatDateBR, getEpiStatus } from '@/lib/utils'
import type { ItemEntrega } from '@/types/database'
import Link from 'next/link'

interface AlertaVencimentoProps {
  item: ItemEntrega
}

export function AlertaVencimento({ item }: AlertaVencimentoProps) {
  const dias = diasParaVencer(item.data_vencimento)
  const status = getEpiStatus(dias)

  const config = {
    vencido: {
      icon: XCircle,
      bg: 'bg-red-50 border-red-200',
      iconColor: 'text-red-600',
      label: 'VENCIDO',
      subtitle: `Venceu há ${Math.abs(dias)} dia(s)`,
    },
    atencao: {
      icon: AlertTriangle,
      bg: 'bg-orange-50 border-orange-200',
      iconColor: 'text-orange-500',
      label: 'Vencimento próximo',
      subtitle: `Vence em ${dias} dia(s)`,
    },
    ok: {
      icon: Clock,
      bg: 'bg-green-50 border-green-200',
      iconColor: 'text-green-600',
      label: 'Em dia',
      subtitle: `Vence em ${dias} dia(s)`,
    },
  }

  const { icon: Icon, bg, iconColor, label, subtitle } = config[status]

  return (
    <div className={`border rounded-lg p-3 flex items-start gap-3 ${bg}`}>
      <Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${iconColor}`} />
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-sm">{label}</p>
        <p className="text-sm text-muted-foreground">{item.epi?.nome}</p>
        <p className="text-xs text-muted-foreground">
          <Link href={`/colaboradores/${item.ficha?.colaborador_id}`} className="hover:underline">
            {item.ficha?.colaborador?.nome}
          </Link>
          {' '}— {subtitle}
        </p>
        <p className="text-xs text-muted-foreground">
          Vencimento: {formatDateBR(item.data_vencimento)}
        </p>
      </div>
    </div>
  )
}
