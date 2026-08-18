import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatInTimeZone, toZonedTime } from 'date-fns-tz'
import { parseISO } from 'date-fns'
import type { EpiStatus } from '@/types/database'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const TZ = 'America/Sao_Paulo'

export function nowBrasilia(): Date {
  return toZonedTime(new Date(), TZ)
}

export function formatDateBR(dateStr: string): string {
  if (!dateStr) return ''
  // Valor apenas-data (YYYY-MM-DD): formata direto, SEM conversão de fuso.
  // Evita o bug de "voltar um dia" ao converter meia-noite UTC para Brasília.
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [y, m, d] = dateStr.split('-')
    return `${d}/${m}/${y}`
  }
  return formatInTimeZone(parseISO(dateStr), TZ, 'dd/MM/yyyy')
}

export function formatDateTimeBR(dateStr: string): string {
  return formatInTimeZone(parseISO(dateStr), TZ, "dd/MM/yyyy 'às' HH:mm")
}

export function diasParaVencer(dataVencimento: string): number {
  // Comparação puramente por dia de calendário (sem hora/fuso), evitando drift.
  const hojeStr = formatInTimeZone(new Date(), TZ, 'yyyy-MM-dd')
  const [hy, hm, hd] = hojeStr.split('-').map(Number)
  const [vy, vm, vd] = dataVencimento.slice(0, 10).split('-').map(Number)
  const hoje = Date.UTC(hy, hm - 1, hd)
  const venc = Date.UTC(vy, vm - 1, vd)
  return Math.round((venc - hoje) / 86_400_000)
}

/** Padroniza CPF para 000.000.000-00 (se tiver 11 dígitos; senão devolve como está). */
export function formatCPF(v: string | null | undefined): string {
  if (!v) return ''
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length !== 11) return v.trim()
  return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

/** Padroniza telefone BR para (00) 00000-0000 / (00) 0000-0000. Ignora DDI 55. */
export function formatTelefone(v: string | null | undefined): string {
  if (!v) return ''
  let d = v.replace(/\D/g, '')
  if (d.length === 13 && d.startsWith('55')) d = d.slice(2) // remove DDI
  if (d.length === 12 && d.startsWith('55')) d = d.slice(2)
  if (d.length === 11) return d.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  if (d.length === 10) return d.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  return v.trim()
}

/** Padroniza CTPS: maiúsculas e separadores como "-" (o formato de dígitos varia). */
export function formatCTPS(v: string | null | undefined): string {
  if (!v) return ''
  return v.trim().toUpperCase().replace(/[\s/.]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
}

/**
 * Formata o CA de forma canônica "CA-XXXXX", evitando a duplicação "CA CA-123".
 * Aceita valores já com prefixo ("CA-123", "CA 123") ou só o número ("123").
 */
export function formatCA(ca: string | null | undefined): string {
  if (!ca) return '—'
  const num = ca.trim().replace(/^ca[\s-]*/i, '').trim()
  return num ? `CA-${num}` : ca
}

export function getEpiStatus(diasRestantes: number): EpiStatus {
  if (diasRestantes < 0) return 'vencido'
  if (diasRestantes <= 30) return 'atencao'
  return 'ok'
}

export function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
