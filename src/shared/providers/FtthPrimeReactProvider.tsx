import { addLocale, PrimeReactProvider } from 'primereact/api'
import type { ReactNode } from 'react'

/**
 * Cadenas usadas por DataTable (menú embudo, filtros). Prime solo trae `en` por defecto.
 * addLocale hace merge superficial con `en` — no reemplazar `aria` sin el objeto completo.
 */
const ES_LOCALE_OVERRIDES = {
  startsWith: 'Empieza por',
  contains: 'Contiene',
  notContains: 'No contiene',
  endsWith: 'Termina en',
  equals: 'Igual a',
  notEquals: 'Distinto de',
  noFilter: 'Sin filtro',
  apply: 'Aplicar',
  clear: 'Limpiar',
  filter: 'Filtrar',
  matchAll: 'Coincidir todos',
  matchAny: 'Coincidir cualquiera',
  addRule: 'Agregar regla',
  removeRule: 'Quitar regla',
  lt: 'Menor que',
  lte: 'Menor o igual que',
  gt: 'Mayor que',
  gte: 'Mayor o igual que',
  dateIs: 'La fecha es',
  dateIsNot: 'La fecha no es',
  dateBefore: 'Anterior a',
  dateAfter: 'Posterior a',
  emptyFilterMessage: 'Sin resultados',
  emptyMessage: 'Sin opciones',
  emptySearchMessage: 'Sin resultados',
  choose: 'Elegir',
  cancel: 'Cancelar',
  today: 'Hoy',
  now: 'Ahora',
  upload: 'Subir',
  weekHeader: 'Sem',
} as const

let esLocaleRegistered = false

function ensureSpanishLocale() {
  if (esLocaleRegistered) return
  addLocale('es', ES_LOCALE_OVERRIDES)
  esLocaleRegistered = true
}

/** Contexto Prime para FTTH: locale es para textos de filtros y overlays. */
export function FtthPrimeReactProvider({ children }: { children: ReactNode }) {
  ensureSpanishLocale()
  return <PrimeReactProvider value={{ locale: 'es' }}>{children}</PrimeReactProvider>
}
