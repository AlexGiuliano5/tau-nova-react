const ontSerialRegex = /^([a-zA-Z0-9]{12}|[a-zA-Z0-9]{16})$/

export function isFullOntSerial(value: string): boolean {
  return ontSerialRegex.test(value.trim())
}

function normalizeLookupValue(value: string): string {
  return value.trim().toUpperCase()
}

function looksLikeOltCode(value: string): boolean {
  const trimmed = value.trim()
  return /^[A-Za-z0-9_-]{4,}$/.test(trimmed) && /[A-Za-z]/.test(trimmed)
}

export function resolveNetworkElementSearchHref(
  value: string,
  oltNames: string[],
): string | undefined {
  const trimmedValue = value.trim()
  if (!trimmedValue) return undefined

  if (isFullOntSerial(trimmedValue)) {
    return `/ftth/ont/${encodeURIComponent(trimmedValue)}/info`
  }

  const normalizedInput = normalizeLookupValue(trimmedValue)
  const match = oltNames.find((name) => normalizeLookupValue(name) === normalizedInput)
  if (match) {
    return `/ftth/olt/${encodeURIComponent(match)}`
  }

  if (looksLikeOltCode(trimmedValue)) {
    return `/ftth/olt/${encodeURIComponent(normalizedInput)}`
  }

  return undefined
}

export const networkElementInvalidSearchMessage =
  'El valor ingresado no es una OLT ni una ONT válida.'
