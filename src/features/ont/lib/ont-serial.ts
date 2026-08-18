export const SERIAL_VENDOR_PREFIX_BY_HEX: Record<string, string> = {
  '414C434C': 'ALCL',
  '48575443': 'HWTC',
  '534D4253': 'SMBS',
  '5445414E': 'TEAN',
}

export function formatOntSerial(serial: string): string {
  if (!serial) return '-'
  const upperSerial = serial.toUpperCase()
  for (const hexPrefix of Object.keys(SERIAL_VENDOR_PREFIX_BY_HEX)) {
    if (upperSerial.startsWith(hexPrefix)) {
      const vendorPrefix = SERIAL_VENDOR_PREFIX_BY_HEX[hexPrefix]
      return (vendorPrefix + serial.slice(hexPrefix.length)).toUpperCase()
    }
  }
  return upperSerial
}

export function formatOntSerialToHex(serial: string): string {
  if (!serial) return '-'
  const upperSerial = serial.trim().toUpperCase()
  for (const [hexPrefix, vendorPrefix] of Object.entries(SERIAL_VENDOR_PREFIX_BY_HEX)) {
    if (upperSerial.startsWith(vendorPrefix)) {
      return `${hexPrefix}${upperSerial.slice(vendorPrefix.length)}`.toLowerCase()
    }
  }
  return upperSerial.toLowerCase()
}

/** Identificador ONT tal como lo espera el BFF (hex en minúsculas). */
export function normalizeOntId(ont: string): string {
  const trimmed = ont.trim()
  if (!trimmed) return ''
  return formatOntSerialToHex(trimmed)
}

function looksLikeOntHexSerial(serial: string): boolean {
  const normalized = serial.trim()
  if (!normalized || !/^[0-9a-fA-F]+$/.test(normalized)) return false
  return normalized.length >= 8
}

function hasOntVendorPrefix(serial: string): boolean {
  const upper = serial.toUpperCase()
  return Object.values(SERIAL_VENDOR_PREFIX_BY_HEX).some((prefix) => upper.startsWith(prefix))
}

/** Serial largo (hex) para capacontrol. */
export function resolveCapaControlSerialNumber(serial: string): string | null {
  const trimmed = serial.trim()
  if (!trimmed || trimmed === '-') return null

  if (looksLikeOntHexSerial(trimmed)) return trimmed.toLowerCase()

  if (!hasOntVendorPrefix(trimmed)) {
    const fromOntId = formatOntSerial(trimmed)
    if (looksLikeOntHexSerial(fromOntId)) return fromOntId.toLowerCase()
  }

  const hex = formatOntSerialToHex(trimmed)
  if (!hex || hex === '-') return null
  return hex
}
