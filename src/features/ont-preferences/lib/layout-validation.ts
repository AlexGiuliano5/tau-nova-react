import { isOntInfoPartialCardSpan } from '@/features/ont-preferences/lib/card-order'
import type { OntInfoCardSpan, OntInfoOrderItem } from '@/features/ont-preferences/types/layout'

/** Unidades de fila: 6 = ancho completo (⅓=2, ½=3, ⅔=4, full=6). */
export function ontInfoSpanUnits(span?: OntInfoCardSpan | string | null): number {
  switch (span) {
    case 'full':
      return 6
    case 'third':
      return 2
    case 'two-thirds':
      return 4
    case 'half':
      return 3
    default:
      return isOntInfoPartialCardSpan(span) ? 3 : 6
  }
}

/**
 * Filas desktop válidas: full solo; pares/filas de parciales cuya suma de anchos es 1.
 * Solo se permite suma incompleta si hay una sola card parcial (p. ej. al ocultar la pareja).
 */
export function isValidOntInfoDesktopCardOrder(items: OntInfoOrderItem[]): boolean {
  const rows = buildDesktopVisualRows(items)

  for (const row of rows) {
    if (row.length === 0) continue

    const rowItems = row
      .map((index) => items[index])
      .filter((item): item is OntInfoOrderItem => Boolean(item))

    if (rowItems.length === 0) continue

    const hasFull = rowItems.some((item) => item.span === 'full' || !isOntInfoPartialCardSpan(item.span))
    if (hasFull) {
      if (rowItems.length !== 1 || rowItems[0]?.span !== 'full') {
        return false
      }
      continue
    }

    const units = rowItems.reduce((sum, item) => sum + ontInfoSpanUnits(item.span), 0)
    if (units > 6) return false
    // Varias parciales en la misma fila deben llenar el 100% (⅓+⅔, ½+½, …)
    if (rowItems.length > 1 && units !== 6) return false
  }

  return true
}

function reorderItems(
  items: OntInfoOrderItem[],
  fromIndex: number,
  toIndex: number,
): OntInfoOrderItem[] {
  const next = [...items]
  const [moved] = next.splice(fromIndex, 1)

  if (!moved) {
    return items
  }

  next.splice(toIndex, 0, moved)
  return next
}

/**
 * Filas visuales desktop: empaqueta parciales por capacidad de ancho (6 u); cada full sola.
 */
export function buildDesktopVisualRows(items: OntInfoOrderItem[]): number[][] {
  const rows: number[][] = []
  let pending: number[] = []
  let pendingUnits = 0

  const flushPending = () => {
    if (pending.length === 0) return
    rows.push(pending)
    pending = []
    pendingUnits = 0
  }

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index]

    if (item?.span === 'full' || !isOntInfoPartialCardSpan(item?.span)) {
      flushPending()
      rows.push([index])
      continue
    }

    const units = ontInfoSpanUnits(item.span)
    if (pendingUnits + units > 6) {
      flushPending()
    }

    pending.push(index)
    pendingUnits += units

    if (pendingUnits >= 6) {
      flushPending()
    }
  }

  flushPending()
  return rows
}


function getDesktopVisualRowSpan(
  items: OntInfoOrderItem[],
  itemIndex: number
): { start: number; end: number } {
  const rows = buildDesktopVisualRows(items);

  for (const row of rows) {
    if (row.includes(itemIndex)) {
      return {
        start: row[0] ?? itemIndex,
        end: row[row.length - 1] ?? itemIndex
      };
    }
  }

  return { start: itemIndex, end: itemIndex };
}

export function getDesktopVisualRowForIndex(
  items: OntInfoOrderItem[],
  itemIndex: number
): number[] {
  const rows = buildDesktopVisualRows(items);

  return rows.find(row => row.includes(itemIndex)) ?? [itemIndex];
}

export function resolveDesktopInsertAtIndex(
  items: OntInfoOrderItem[],
  activeId: string,
  overId: string,
  pointer: { x: number; y: number },
  overRect: { top: number; left: number; width: number; height: number }
): number {
  const overIndex = items.findIndex(item => item.id === overId);
  const activeIndex = items.findIndex(item => item.id === activeId);

  if (overIndex < 0 || activeIndex < 0) {
    return overIndex >= 0 ? overIndex : 0;
  }

  const overItem = items[overIndex];
  const activeItem = items[activeIndex];
  const overRow = getDesktopVisualRowForIndex(items, overIndex);
  const activeRow = getDesktopVisualRowForIndex(items, activeIndex);
  const sameVisualRow =
    overRow.length > 0 &&
    activeRow.length > 0 &&
    overRow[0] === activeRow[0] &&
    overRow[overRow.length - 1] === activeRow[activeRow.length - 1];

  if (
    isOntInfoPartialCardSpan(overItem?.span) &&
    isOntInfoPartialCardSpan(activeItem?.span) &&
    overRow.length === 2 &&
    sameVisualRow
  ) {
    const insertAfterInRow = pointer.x > overRect.left + overRect.width / 2;

    return insertAfterInRow ? overIndex + 1 : overIndex;
  }

  const rowStart = overRow[0] ?? overIndex;
  const rowEnd = overRow[overRow.length - 1] ?? overIndex;
  const insertAfterRow = pointer.y > overRect.top + overRect.height / 2;

  return insertAfterRow ? rowEnd + 1 : rowStart;
}

export function moveOntInfoCardToInsertAt(
  items: OntInfoOrderItem[],
  activeId: string,
  insertAt: number,
): OntInfoOrderItem[] {
  const fromIndex = items.findIndex((item) => item.id === activeId)

  if (fromIndex < 0 || insertAt < 0 || insertAt > items.length) {
    return items
  }

  const result = insertItemAtIndex(items, fromIndex, insertAt)

  if (areOntInfoCardOrdersEqual(items, result)) {
    return items
  }

  // No permitir filas inválidas (p. ej. ⅔+⅔ o ⅓+⅓ incompleta)
  if (!isValidOntInfoDesktopCardOrder(result)) {
    return items
  }

  return result
}

function insertItemAtIndex(
  items: OntInfoOrderItem[],
  fromIndex: number,
  insertAt: number,
): OntInfoOrderItem[] {
  const next = [...items]
  const [moved] = next.splice(fromIndex, 1)

  if (!moved) {
    return items
  }

  const adjustedInsert = fromIndex < insertAt ? insertAt - 1 : insertAt
  next.splice(adjustedInsert, 0, moved)
  return next
}

/**
 * Resultado "crudo" de insertar (sin filtrar validez). Para preview de drop.
 */
export function simulateDesktopCardInsert(
  items: OntInfoOrderItem[],
  activeId: string,
  overId: string,
  pointer: { x: number; y: number },
  overRect: { top: number; left: number; width: number; height: number },
): OntInfoOrderItem[] {
  const fromIndex = items.findIndex((item) => item.id === activeId)
  if (fromIndex < 0) return items

  const insertAt = resolveDesktopInsertAtIndex(items, activeId, overId, pointer, overRect)
  if (insertAt < 0 || insertAt > items.length) return items

  return insertItemAtIndex(items, fromIndex, insertAt)
}

function resolveFullCardInsertIndexOnHalfRow(
  items: OntInfoOrderItem[],
  targetIndex: number,
  insertAfterHalfRow?: boolean
): number {
  const { start: pairStart, end: pairEnd } = getDesktopVisualRowSpan(items, targetIndex);

  if (insertAfterHalfRow === true) {
    return pairEnd + 1;
  }

  if (insertAfterHalfRow === false) {
    return pairStart;
  }

  return pairStart;
}

function moveFullCardOntoHalfRow(
  items: OntInfoOrderItem[],
  fromIndex: number,
  targetIndex: number,
  insertAfterHalfRow?: boolean
): OntInfoOrderItem[] | null {
  const moved = items[fromIndex];
  const target = items[targetIndex];

  if (moved?.span !== 'full' || !isOntInfoPartialCardSpan(target?.span)) {
    return null;
  }

  const preferredInsertAt = resolveFullCardInsertIndexOnHalfRow(
    items,
    targetIndex,
    insertAfterHalfRow
  );
  const preferredResult = insertItemAtIndex(items, fromIndex, preferredInsertAt);

  if (isValidOntInfoDesktopCardOrder(preferredResult)) {
    return preferredResult;
  }

  const alternateInsertAt =
    preferredInsertAt === pairEndPlusOne(items, targetIndex)
      ? getDesktopVisualRowSpan(items, targetIndex).start
      : pairEndPlusOne(items, targetIndex);
  const alternateResult = insertItemAtIndex(items, fromIndex, alternateInsertAt);

  return isValidOntInfoDesktopCardOrder(alternateResult) ? alternateResult : null;
}

function pairEndPlusOne(items: OntInfoOrderItem[], targetIndex: number): number {
  return getDesktopVisualRowSpan(items, targetIndex).end + 1;
}

function findHalfFullHalfSandwichIndex(items: OntInfoOrderItem[]): number {
  for (let index = 0; index < items.length - 2; index += 1) {
    if (
      isOntInfoPartialCardSpan(items[index]?.span) &&
      items[index + 1]?.span === 'full' &&
      isOntInfoPartialCardSpan(items[index + 2]?.span)
    ) {
      return index;
    }
  }

  return -1;
}

function repairHalfFullHalfSandwich(
  items: OntInfoOrderItem[],
  sandwichIndex: number,
  preferFullBeforePair: boolean
): OntInfoOrderItem[] {
  const before = items.slice(0, sandwichIndex);
  const halfLeft = items[sandwichIndex];
  const full = items[sandwichIndex + 1];
  const halfRight = items[sandwichIndex + 2];
  const after = items.slice(sandwichIndex + 3);

  if (!halfLeft || !full || !halfRight) {
    return items;
  }

  const fullBeforePair = [...before, full, halfLeft, halfRight, ...after];
  const fullAfterPair = [...before, halfLeft, halfRight, full, ...after];

  if (preferFullBeforePair && isValidOntInfoDesktopCardOrder(fullBeforePair)) {
    return fullBeforePair;
  }

  if (!preferFullBeforePair && isValidOntInfoDesktopCardOrder(fullAfterPair)) {
    return fullAfterPair;
  }

  if (isValidOntInfoDesktopCardOrder(fullBeforePair)) {
    return fullBeforePair;
  }

  if (isValidOntInfoDesktopCardOrder(fullAfterPair)) {
    return fullAfterPair;
  }

  return items;
}

function resolveDesktopCardDropIndex(
  items: OntInfoOrderItem[],
  fromIndex: number,
  targetIndex: number
): number {
  if (
    fromIndex < 0 ||
    targetIndex < 0 ||
    fromIndex >= items.length ||
    targetIndex >= items.length ||
    fromIndex === targetIndex
  ) {
    return fromIndex;
  }

  const directOrder = reorderItems(items, fromIndex, targetIndex);
  if (isValidOntInfoDesktopCardOrder(directOrder)) {
    return targetIndex;
  }

  const step = targetIndex < fromIndex ? -1 : 1;
  let candidateIndex = targetIndex;

  while (candidateIndex >= 0 && candidateIndex < items.length) {
    if (candidateIndex !== fromIndex) {
      const candidateOrder = reorderItems(items, fromIndex, candidateIndex);
      if (isValidOntInfoDesktopCardOrder(candidateOrder)) {
        return candidateIndex;
      }
    }

    if (candidateIndex === 0 || candidateIndex === items.length - 1) {
      break;
    }

    candidateIndex += step;
  }

  for (const edgeIndex of [0, items.length - 1]) {
    if (edgeIndex === fromIndex) {
      continue;
    }

    const edgeOrder = reorderItems(items, fromIndex, edgeIndex);
    if (isValidOntInfoDesktopCardOrder(edgeOrder)) {
      return edgeIndex;
    }
  }

  return fromIndex;
}

/**
 * Mueve una card y, si hace falta, reacomoda las medias vecinas para la grilla desktop.
 */
export interface OntInfoCardMoveOptions {
  insertAfterHalfRow?: boolean;
  insertAtIndex?: number;
}

export function resolveFullCardInsertIndex(
  items: OntInfoOrderItem[],
  targetIndex: number,
  insertAfterVisualRow: boolean
): number {
  const { start, end } = getDesktopVisualRowSpan(items, targetIndex);

  return insertAfterVisualRow ? end + 1 : start;
}

export function accommodateDesktopCardMove(
  items: OntInfoOrderItem[],
  fromIndex: number,
  targetIndex: number,
  options?: OntInfoCardMoveOptions
): OntInfoOrderItem[] {
  if (
    fromIndex < 0 ||
    targetIndex < 0 ||
    fromIndex >= items.length ||
    targetIndex >= items.length
  ) {
    return items;
  }

  if (options?.insertAtIndex !== undefined) {
    const moved = moveOntInfoCardToInsertAt(
      items,
      items[fromIndex]?.id ?? '',
      options.insertAtIndex,
    )
    return isValidOntInfoDesktopCardOrder(moved) ? moved : items
  }

  if (fromIndex === targetIndex) {
    return items
  }

  const pairRowMove = moveFullCardOntoHalfRow(
    items,
    fromIndex,
    targetIndex,
    options?.insertAfterHalfRow,
  )
  if (pairRowMove && isValidOntInfoDesktopCardOrder(pairRowMove)) {
    return pairRowMove
  }

  const draggedUp = fromIndex > targetIndex
  let result = reorderItems(items, fromIndex, targetIndex)

  if (isValidOntInfoDesktopCardOrder(result)) {
    return result
  }

  let guard = 0
  while (!isValidOntInfoDesktopCardOrder(result) && guard < items.length * 4) {
    guard += 1
    const sandwichIndex = findHalfFullHalfSandwichIndex(result)

    if (sandwichIndex < 0) {
      break
    }

    const repaired = repairHalfFullHalfSandwich(result, sandwichIndex, draggedUp)
    if (repaired === result) {
      break
    }

    result = repaired
  }

  if (isValidOntInfoDesktopCardOrder(result)) {
    return result
  }

  const fallbackIndex = resolveDesktopCardDropIndex(items, fromIndex, targetIndex)
  const fallback = reorderItems(items, fromIndex, fallbackIndex)
  return isValidOntInfoDesktopCardOrder(fallback) ? fallback : items
}

export function resolveDesktopDropTargetIndex(
  items: OntInfoOrderItem[],
  overId: string
): number | null {
  const itemIndex = items.findIndex(item => item.id === overId);
  return itemIndex >= 0 ? itemIndex : null;
}

export function areOntInfoCardOrdersEqual(
  left: OntInfoOrderItem[],
  right: OntInfoOrderItem[]
): boolean {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((item, index) => item.id === right[index]?.id);
}

export function applyOntInfoCardMove(
  items: OntInfoOrderItem[],
  fromIndex: number,
  targetIndex: number,
  isDesktop: boolean,
  options?: OntInfoCardMoveOptions
): OntInfoOrderItem[] {
  if (isDesktop) {
    return accommodateDesktopCardMove(items, fromIndex, targetIndex, options);
  }

  return reorderItems(items, fromIndex, targetIndex);
}
