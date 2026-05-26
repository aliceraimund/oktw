import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatInTimeZone, toZonedTime } from 'date-fns-tz'
import { differenceInDays, parseISO } from 'date-fns'
import type { EpiStatus } from '@/types/database'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const TZ = 'America/Sao_Paulo'

export function nowBrasilia(): Date {
  return toZonedTime(new Date(), TZ)
}

export function formatDateBR(dateStr: string): string {
  return formatInTimeZone(parseISO(dateStr), TZ, 'dd/MM/yyyy')
}

export function formatDateTimeBR(dateStr: string): string {
  return formatInTimeZone(parseISO(dateStr), TZ, "dd/MM/yyyy 'às' HH:mm")
}

export function diasParaVencer(dataVencimento: string): number {
  const hoje = nowBrasilia()
  hoje.setHours(0, 0, 0, 0)
  const venc = toZonedTime(parseISO(dataVencimento), TZ)
  venc.setHours(0, 0, 0, 0)
  return differenceInDays(venc, hoje)
}

export function getEpiStatus(diasRestantes: number): EpiStatus {
  if (diasRestantes < 0) return 'vencido'
  if (diasRestantes <= 30) return 'atencao'
  return 'ok'
}

export function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
