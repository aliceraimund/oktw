import { cn } from '@/lib/utils'

/**
 * Logo da OKTW. Em fundos claros use direto; em fundos escuros use `onDark`
 * (coloca a logo dentro de um cartão branco, já que o "oktw" é escuro).
 */
export function Logo({ className, onDark = false }: { className?: string; onDark?: boolean }) {
  const img = (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/logo-oktw.png" alt="OKTW — Por um mundo melhor" className={cn('object-contain', className)} />
  )
  if (!onDark) return img
  return (
    <span className="inline-flex items-center justify-center rounded-lg bg-white p-2">
      {img}
    </span>
  )
}
