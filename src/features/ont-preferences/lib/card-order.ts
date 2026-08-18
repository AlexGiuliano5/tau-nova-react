import type { OntInfoCardSpan, OntInfoOrderItem } from '@/features/ont-preferences/types/layout'

export function isOntInfoPartialCardSpan(span?: OntInfoCardSpan | string | null): boolean {
  return span != null && span !== 'full'
}

export function partitionOntInfoCardItems(items: OntInfoOrderItem[]): {
  hidden: OntInfoOrderItem[]
  visible: OntInfoOrderItem[]
} {
  const hidden: OntInfoOrderItem[] = []
  const visible: OntInfoOrderItem[] = []

  for (const item of items) {
    if (item.visible) {
      visible.push(item)
    } else {
      hidden.push(item)
    }
  }

  return { hidden, visible }
}

export function composeOntInfoCardItems(
  hidden: OntInfoOrderItem[],
  visible: OntInfoOrderItem[],
): OntInfoOrderItem[] {
  return [...hidden, ...visible]
}

export function normalizeOntInfoCardItemsOrder(items: OntInfoOrderItem[]): OntInfoOrderItem[] {
  const { hidden, visible } = partitionOntInfoCardItems(items)
  return composeOntInfoCardItems(hidden, visible)
}

export function toggleOntInfoCardVisibility(
  items: OntInfoOrderItem[],
  itemId: string,
): OntInfoOrderItem[] {
  const targetItem = items.find((item) => item.id === itemId)
  if (!targetItem) return items

  const nextVisible = !targetItem.visible
  const updatedItem = { ...targetItem, visible: nextVisible }
  const otherItems = items.filter((item) => item.id !== itemId)
  const { hidden, visible } = partitionOntInfoCardItems(otherItems)

  if (nextVisible) {
    return composeOntInfoCardItems(hidden, [...visible, updatedItem])
  }

  return composeOntInfoCardItems([updatedItem, ...hidden], visible)
}

/** Ancho desktop en el preview de preferencias (sin breakpoint md). */
export function resolveOntInfoDesktopItemWidthClass(item: Pick<OntInfoOrderItem, 'span'>): string {
  switch (item.span) {
    case 'full':
      return 'w-full shrink-0 grow-0 basis-full'
    case 'third':
      return 'w-[calc(33.333%-0.25rem)] shrink-0 grow-0 basis-[calc(33.333%-0.25rem)]'
    case 'two-thirds':
      return 'w-[calc(66.666%-0.25rem)] shrink-0 grow-0 basis-[calc(66.666%-0.25rem)]'
    case 'half':
    default:
      return 'w-[calc(50%-0.25rem)] shrink-0 grow-0 basis-[calc(50%-0.25rem)]'
  }
}

export function formatOntInfoCardSpanLabel(span: OntInfoCardSpan | string): string {
  switch (span) {
    case 'full':
      return 'Ancho completo'
    case 'third':
      return 'Un tercio'
    case 'two-thirds':
      return 'Dos tercios'
    case 'half':
    default:
      return 'Media columna'
  }
}
