import clsx from 'clsx'

import type {
  OntInfoCardId,
  OntInfoCardSpan,
  OntInfoOrderItem,
  OntInfoScreenViewMode,
} from '@/features/ont-preferences/types/layout'

// Misma lógica de filas que el editor de preferencias (packing por ancho)
export { buildDesktopVisualRows } from '@/features/ont-preferences/lib/layout-validation'

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
