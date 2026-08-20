const MISSING = new Set(['', 'Sin Datos', '-', '—'])

export function isOntMissingValue(value: string | null | undefined): boolean {
  const trimmed = value?.trim() ?? ''
  return MISSING.has(trimmed)
}

export function hasAnyOntValue(values: Array<string | null | undefined>): boolean {
  return values.some((value) => !isOntMissingValue(value))
}
