import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import {
  loadFtthTableColumnPreferences,
  saveFtthTableColumnPreferences,
} from '@/features/ont/api/table-column-preferences'
import {
  buildColumnOrderItems,
  buildDefaultColumnOrderItems,
  createDefaultViewportColumnLayout,
  layoutFromColumnOrderItems,
  resolveVisibleColumnKeys,
  type ColumnOrderItem,
  type FtthTableColumnPreferences,
  type FtthTableViewportColumnLayout,
} from '@/features/ont/lib/table-column-preferences'

interface Input {
  tableId: string
  columnKeys: string[]
  isDesktop: boolean
  labelByKey: Map<string, string>
}

export function useOntTableColumnPreferences({
  tableId,
  columnKeys,
  isDesktop,
  labelByKey,
}: Input) {
  const columnKeysKey = columnKeys.join('\u0001')
  const defaults = useMemo(() => {
    const layout = createDefaultViewportColumnLayout(columnKeys)
    return { desktop: layout, mobile: { ...layout, columnOrder: [...layout.columnOrder] } }
  }, [columnKeysKey])

  const [desktopLayout, setDesktopLayout] = useState<FtthTableViewportColumnLayout>(
    defaults.desktop,
  )
  const [mobileLayout, setMobileLayout] = useState<FtthTableViewportColumnLayout>(
    defaults.mobile,
  )
  const saveTimerRef = useRef<number | null>(null)

  useEffect(() => {
    setDesktopLayout(defaults.desktop)
    setMobileLayout(defaults.mobile)

    const controller = new AbortController()
    void (async () => {
      const remote = await loadFtthTableColumnPreferences(
        tableId,
        columnKeys,
        controller.signal,
      )
      if (controller.signal.aborted || !remote) return
      setDesktopLayout(remote.desktop)
      setMobileLayout(remote.mobile)
    })()

    return () => controller.abort()
  }, [tableId, columnKeysKey, defaults, columnKeys])

  const layout = isDesktop ? desktopLayout : mobileLayout

  const columnOrderItems = useMemo(
    () => buildColumnOrderItems(layout, columnKeys, labelByKey),
    [layout, columnKeys, labelByKey],
  )

  const defaultColumnOrderItems = useMemo(
    () => buildDefaultColumnOrderItems(columnKeys, labelByKey),
    [columnKeys, labelByKey],
  )

  const visibleColumnKeys = useMemo(
    () => resolveVisibleColumnKeys(columnKeys, layout),
    [columnKeys, layout],
  )

  const persistPreferences = useCallback(
    (next: FtthTableColumnPreferences) => {
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current)
      }
      saveTimerRef.current = window.setTimeout(() => {
        void saveFtthTableColumnPreferences(tableId, next)
      }, 350)
    },
    [tableId],
  )

  useEffect(() => {
    return () => {
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current)
      }
    }
  }, [])

  const applyFromColumnOrderItems = useCallback(
    (items: ColumnOrderItem[]) => {
      const nextLayout = layoutFromColumnOrderItems(items)
      const next: FtthTableColumnPreferences = {
        version: 1,
        desktop: isDesktop ? nextLayout : desktopLayout,
        mobile: isDesktop ? mobileLayout : nextLayout,
      }
      if (isDesktop) setDesktopLayout(nextLayout)
      else setMobileLayout(nextLayout)
      persistPreferences(next)
    },
    [desktopLayout, mobileLayout, isDesktop, persistPreferences],
  )

  return {
    layout,
    columnOrderItems,
    defaultColumnOrderItems,
    visibleColumnKeys,
    applyFromColumnOrderItems,
  }
}
