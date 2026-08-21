import clsx from 'clsx'

import type { OntMetricCardModel } from '@/features/ont/lib/ont-metric-display'
import type {
  OntInfoCardId,
  OntInfoCardSpan,
  OntInfoOrderItem,
  OntInfoScreenViewMode,
} from '@/features/ont-preferences/types/layout'

// Misma lógica de filas que el editor de preferencias (packing por ancho)
export { buildDesktopVisualRows } from '@/features/ont-preferences/lib/layout-validation'

export function isOntCapaMetricPrefId(id: string): boolean {
  return id.startsWith('capa-')
}

function normalizeMetricPrefKey(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

function opticalMetricMatchesPref(title: string, prefId: string): boolean {
  const titleKey = normalizeMetricPrefKey(title)
  const id = normalizeMetricPrefKey(prefId)
  if (titleKey === id) return true
  if (id === 'ont bip us' && (titleKey === 'bip us' || titleKey.endsWith('bip us'))) return true
  if (id === 'ont bip ds' && (titleKey === 'bip ds' || titleKey.endsWith('bip ds'))) return true
  if (id === 'ont temperature' && (titleKey === 'ont temp laser' || titleKey === 'ont temperature')) {
    return true
  }
  if (id === 'port temperature' && (titleKey === 'port temperatura' || titleKey === 'port temperature')) {
    return true
  }
  return false
}

/** Ordena y oculta tarjetas ópticas según preferencias. Sin prefs, deja el listado igual. */
export function applyOpticalMetricPreferences(
  cards: OntMetricCardModel[],
  preferences: OntInfoOrderItem[] | undefined,
): OntMetricCardModel[] {
  if (!preferences?.length) return cards

  const opticalPrefs = preferences.filter((item) => !isOntCapaMetricPrefId(item.id))
  if (!opticalPrefs.length) return cards

  const used = new Set<number>()
  const ordered: OntMetricCardModel[] = []

  for (const pref of opticalPrefs) {
    if (!pref.visible) continue
    const index = cards.findIndex(
      (card, cardIndex) =>
        !used.has(cardIndex) && opticalMetricMatchesPref(card.title, pref.id),
    )
    if (index >= 0) {
      used.add(index)
      const card = cards[index]
      if (card) ordered.push(card)
    }
  }

  for (let i = 0; i < cards.length; i++) {
    if (used.has(i)) continue
    const card = cards[i]
    if (!card) continue
    const inCatalog = opticalPrefs.some((pref) => opticalMetricMatchesPref(card.title, pref.id))
    if (!inCatalog) ordered.push(card)
  }

  return ordered
}

/**
 * IDs de capa visibles, en orden. `null` = no hay prefs de capa (mostrar todas).
 * Array vacío = ocultar la sección.
 */
export function resolveVisibleCapaMetricPrefIds(
  preferences: OntInfoOrderItem[] | undefined,
): string[] | null {
  if (!preferences?.length) return null
  const capa = preferences.filter((item) => isOntCapaMetricPrefId(item.id))
  if (!capa.length) return null
  return capa.filter((item) => item.visible).map((item) => item.id)
}

export function isOntInfoPartialCardSpan(span?: OntInfoCardSpan | string | null): boolean {
  return span != null && span !== 'full'
}

export function prepareOntInfoRuntimeCards(
  allCards: OntInfoOrderItem[],
  _viewMode: OntInfoScreenViewMode,
  isDesktop: boolean,
): OntInfoOrderItem[] {
  if (!isDesktop) {
    return allCards.filter((card) => card.visible)
  }

  return allCards.filter((card) => {
    if (!card.visible) return false
    if (card.id === 'mapa-vecinos') return false
    return true
  })
}

export function resolveOntInfoResponsiveItemWidthClass(item: Pick<OntInfoOrderItem, 'span'>): string {
  switch (item.span) {
    case 'full':
      return 'w-full min-w-0 shrink-0 grow-0 basis-full'
    case 'third':
      return 'w-full min-w-0 basis-full md:flex-1 md:basis-0'
    case 'two-thirds':
      return 'w-full min-w-0 basis-full md:flex-[2] md:basis-0'
    case 'half':
    default:
      return 'w-full min-w-0 basis-full md:flex-1 md:basis-0'
  }
}

const compactHalfCardIds = new Set<OntInfoCardId>(['alertas', 'interrupciones'])

function isOntInfoCompactHalfCard(cardId: string): boolean {
  return compactHalfCardIds.has(cardId as OntInfoCardId)
}

function rowHasTallHalfCard(cards: OntInfoOrderItem[], rowIndices: number[]): boolean {
  return rowIndices.some((itemIndex) => {
    const rowCard = cards[itemIndex]
    if (!rowCard || !isOntInfoPartialCardSpan(rowCard.span)) return false
    return !isOntInfoCompactHalfCard(rowCard.id)
  })
}

export function resolveOntInfoDesktopSlotWrapperClass(
  item: OntInfoOrderItem,
  cards: OntInfoOrderItem[],
  rowIndices: number[],
): string {
  if (!isOntInfoPartialCardSpan(item.span)) {
    return 'flex min-w-0 flex-col'
  }

  const mixedWithTallHalf = rowHasTallHalfCard(cards, rowIndices)
  const useTallHalfHeight =
    mixedWithTallHalf || !isOntInfoCompactHalfCard(item.id)

  return clsx(
    'flex min-w-0 flex-col self-stretch [&>*]:h-full',
    useTallHalfHeight && 'min-h-[224px]',
  )
}
