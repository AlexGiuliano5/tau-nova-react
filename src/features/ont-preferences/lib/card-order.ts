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
      return 'w-full min-w-0 shrink-0 grow-0 basis-full'
    case 'third':
      return 'min-w-0 flex-1 basis-0'
    case 'two-thirds':
      return 'min-w-0 flex-[2] basis-0'
    case 'half':
    default:
      return 'min-w-0 flex-1 basis-0'
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
