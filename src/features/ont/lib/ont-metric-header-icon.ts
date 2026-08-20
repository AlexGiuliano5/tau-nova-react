import type { IconType } from 'react-icons'
import { FiActivity } from 'react-icons/fi'
import { LuPlug, LuThermometer } from 'react-icons/lu'

/** Ícono de header según el tipo de métrica (Rx/Tx, voltage, temperatura, BIP). */
export function getOntMetricHeaderIcon(title: string): IconType {
  const normalized = title.trim().toUpperCase()
  if (normalized.includes('VOLTAGE') || normalized.includes('VOLTAJE')) {
    return LuPlug
  }
  if (normalized.includes('TEMP')) {
    return LuThermometer
  }
  if (normalized.includes('RX') || normalized.includes('TX') || normalized.includes('BIP')) {
    return FiActivity
  }
  return FiActivity
}
