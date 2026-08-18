export interface FtthTableViewportColumnLayout {
  columnOrder: string[]
  hiddenColumns: string[]
  lockedColumns: string[]
}

export interface FtthTableColumnPreferences {
  version: 1
  desktop: FtthTableViewportColumnLayout
  mobile: FtthTableViewportColumnLayout
}

export interface ColumnOrderItem {
  id: string
  label: string
  visible: boolean
  locked?: boolean
}

const MAX_LOCKED = 2

export function createDefaultViewportColumnLayout(
  columnKeys: string[],
): FtthTableViewportColumnLayout {
  return {
    columnOrder: [...columnKeys],
    hiddenColumns: [],
    lockedColumns: [],
  }
}

export function resolveViewportColumnLayout(
  saved: FtthTableViewportColumnLayout | undefined,
  columnKeys: string[],
): FtthTableViewportColumnLayout {
  if (columnKeys.length === 0) return createDefaultViewportColumnLayout([])

  const knownKeys = new Set(columnKeys)
  const order = (saved?.columnOrder ?? []).filter((key) => knownKeys.has(key))
  const missingKeys = columnKeys.filter((key) => !order.includes(key))
  const columnOrder = [...order, ...missingKeys]
  const hiddenColumns = (saved?.hiddenColumns ?? []).filter(
    (key) => knownKeys.has(key) && columnOrder.includes(key),
  )
  const hiddenKeySet = new Set(hiddenColumns)
  const lockedColumns = (saved?.lockedColumns ?? [])
    .filter((key) => knownKeys.has(key) && !hiddenKeySet.has(key))
    .slice(0, MAX_LOCKED)

  return { columnOrder, hiddenColumns, lockedColumns }
}

export function layoutFromColumnOrderItems(
  items: ColumnOrderItem[],
): FtthTableViewportColumnLayout {
  const columnOrder: string[] = []
  const hiddenColumns: string[] = []
  const lockedColumns: string[] = []

  for (const item of items) {
    columnOrder.push(item.id)
    if (!item.visible) hiddenColumns.push(item.id)
    if (item.locked && lockedColumns.length < MAX_LOCKED) lockedColumns.push(item.id)
  }

  return resolveViewportColumnLayout(
    { columnOrder, hiddenColumns, lockedColumns },
    columnOrder,
  )
}

export function buildColumnOrderItems(
  layout: FtthTableViewportColumnLayout,
  columnKeys: string[],
  labelByKey: Map<string, string>,
): ColumnOrderItem[] {
  const resolved = resolveViewportColumnLayout(layout, columnKeys)
  const hidden = new Set(resolved.hiddenColumns)
  const locked = new Set(resolved.lockedColumns)
  return resolved.columnOrder.map((key) => ({
    id: key,
    label: labelByKey.get(key) ?? key,
    visible: !hidden.has(key),
    locked: locked.has(key),
  }))
}

export function buildDefaultColumnOrderItems(
  columnKeys: string[],
  labelByKey: Map<string, string>,
): ColumnOrderItem[] {
  return columnKeys.map((key) => ({
    id: key,
    label: labelByKey.get(key) ?? key,
    visible: true,
    locked: false,
  }))
}

export function resolveVisibleColumnKeys(
  preferenceColumnKeys: string[],
  layout: Pick<FtthTableViewportColumnLayout, 'columnOrder' | 'hiddenColumns'>,
): string[] {
  const known = new Set(preferenceColumnKeys)
  const ordered = layout.columnOrder.filter((key) => known.has(key))
  const missing = preferenceColumnKeys.filter((key) => !ordered.includes(key))
  const hidden = new Set(layout.hiddenColumns)
  return [...ordered, ...missing].filter((key) => !hidden.has(key))
}
