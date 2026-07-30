// Utilitarios para validacao e formatacao de tempos FOR_TIME

export function formatForTimeInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 4)

  if (digits.length <= 2) return digits

  const minutes = digits.slice(0, 2)
  const seconds = digits.slice(2)
  return `${minutes}:${seconds}`
}

export function normalizeForTime(value: string): string | null {
  const digits = value.replace(/\D/g, '').padStart(4, '0').slice(0, 4)
  if (digits.length !== 4) return null

  const minutes = digits.slice(0, 2)
  const seconds = digits.slice(2)

  if (parseInt(seconds, 10) > 59) return null

  return `${minutes}:${seconds}`
}

export function isValidForTime(value: string): boolean {
  if (!value || value.trim() === '') return false

  const digits = value.replace(/\D/g, '')
  if (digits.length !== 4) return false

  const normalized = normalizeForTime(value)
  if (!normalized) return false

  const [minutes, seconds] = normalized.split(':').map(Number)

  return (
    !isNaN(minutes) &&
    !isNaN(seconds) &&
    seconds >= 0 &&
    seconds <= 59 &&
    minutes >= 0
  )
}
