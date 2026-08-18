import { formatOntStatusLabel } from '@/features/ont/lib/ont-status-labels'

const ONT_RX_THRESHOLDS = { crit: -27, warn: -24.5, poe: -12 }
const OLT_RX_THRESHOLDS = { crit: -30, warn: -27.5, poe: -15 }
/** Olt Tx: valores menores a 4.5 → rojo; el resto verde. */
const OLT_TX_RED_BELOW = 4.5

/** Alias compatible con FtthSinglePointMapCard de tau-nova. */
export function formatStatusLabel(status: string): string {
  return formatOntStatusLabel(status)
}

export function getOntRxColor(rawValue: string): string {
  const value = Number.parseFloat(rawValue.replace(',', '.'))
  if (Number.isNaN(value)) return 'var(--text-secondary)'
  if (value < ONT_RX_THRESHOLDS.crit) return 'var(--state-03)'
  if (value < ONT_RX_THRESHOLDS.warn) return 'var(--card-orange)'
  if (value > ONT_RX_THRESHOLDS.poe) return 'var(--state-02)'
  return 'var(--state-01)'
}

export function getOltRxColor(rawValue: string): string {
  const value = Number.parseFloat(rawValue.replace(',', '.'))
  if (Number.isNaN(value)) return 'var(--text-secondary)'
  if (value < OLT_RX_THRESHOLDS.crit) return 'var(--state-03)'
  if (value < OLT_RX_THRESHOLDS.warn) return 'var(--card-orange)'
  if (value > OLT_RX_THRESHOLDS.poe) return 'var(--state-02)'
  return 'var(--state-01)'
}

export function getOltTxColor(rawValue: string): string {
  const value = Number.parseFloat(rawValue.replace(',', '.'))
  if (Number.isNaN(value)) return 'var(--text-secondary)'
  return value < OLT_TX_RED_BELOW ? 'var(--state-03)' : 'var(--state-01)'
}
