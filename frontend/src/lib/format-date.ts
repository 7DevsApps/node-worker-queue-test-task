import { format, formatDistanceToNow, isValid, parseISO } from 'date-fns'

export function formatJobDate(iso: string): string {
  const d = parseISO(iso)
  if (!isValid(d)) return iso
  return format(d, 'PPpp')
}

export function formatRelative(iso: string): string {
  const d = parseISO(iso)
  if (!isValid(d)) return iso
  return formatDistanceToNow(d, { addSuffix: true })
}
