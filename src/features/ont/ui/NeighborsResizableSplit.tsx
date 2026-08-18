import clsx from 'clsx'
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  rightSlotContent?: ReactNode
  showRightSlot?: boolean
  comparisonContent?: ReactNode
  showComparison?: boolean
  className?: string
  maxHeight?: string
  splitMinHeightClassName?: string
}

const TABLE_MIN_PERCENT = 30
const TABLE_MAX_PERCENT_SINGLE = 74
const TABLE_DEFAULT_PERCENT = 62
const COMPARISON_MIN_PERCENT = 18
const COMPARISON_MAX_PERCENT = 50
const COMPARISON_DEFAULT_PERCENT = 28
const MIDDLE_MIN_PERCENT = 15
const DEFAULT_MAX_HEIGHT = 'calc(100dvh - 150px)'

type ResizingDivider = null | 'table' | 'middle'

function DividerButton({
  isActive,
  onMouseDown,
  ariaLabel,
  hidden = false,
}: {
  isActive: boolean
  onMouseDown: () => void
  ariaLabel: string
  hidden?: boolean
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-hidden={hidden}
      tabIndex={hidden ? -1 : undefined}
      onMouseDown={hidden ? undefined : onMouseDown}
      className={clsx(
        'group relative w-3 shrink-0 cursor-col-resize transition-colors',
        hidden && 'hidden',
        isActive ? 'bg-(--primary-2)/8 dark:bg-(--secondary)/10' : 'bg-transparent',
      )}
    >
      <span
        className={clsx(
          'absolute inset-y-1.5 left-1/2 z-0 w-[2px] -translate-x-1/2 rounded-full transition-colors',
          isActive
            ? 'bg-(--primary-2) dark:bg-(--secondary)'
            : 'bg-(--primary-2)/75 group-hover:bg-(--primary-2) dark:bg-(--secondary)/75 dark:group-hover:bg-(--secondary)',
        )}
      />
      <span
        className={clsx(
          'absolute left-1/2 top-1/2 z-20 h-10 w-[10px] -translate-x-1/2 -translate-y-1/2 rounded-full border shadow-sm transition-colors',
          isActive
            ? 'border-(--primary-2) bg-[color-mix(in_srgb,var(--card)_80%,var(--primary-2)_20%)] dark:border-(--secondary) dark:bg-[color-mix(in_srgb,var(--card)_78%,var(--secondary)_22%)]'
            : 'border-(--primary-2)/80 bg-[color-mix(in_srgb,var(--card)_88%,var(--primary-2)_12%)] group-hover:border-(--primary-2) group-hover:bg-[color-mix(in_srgb,var(--card)_82%,var(--primary-2)_18%)] dark:border-(--secondary)/80 dark:bg-[color-mix(in_srgb,var(--card)_86%,var(--secondary)_14%)] dark:group-hover:border-(--secondary) dark:group-hover:bg-[color-mix(in_srgb,var(--card)_80%,var(--secondary)_20%)]',
        )}
      />
    </button>
  )
}

/** Split redimensionable: tabla | mapa | comparación (2 o 3 paneles). */
export function NeighborsResizableSplit({
  children,
  rightSlotContent,
  showRightSlot = false,
  comparisonContent,
  showComparison = false,
  className,
  maxHeight = DEFAULT_MAX_HEIGHT,
  splitMinHeightClassName = 'min-h-[560px]',
}: Props) {
  const [tableWidthPercent, setTableWidthPercent] = useState(TABLE_DEFAULT_PERCENT)
  const [comparisonWidthPercent, setComparisonWidthPercent] = useState(
    COMPARISON_DEFAULT_PERCENT,
  )
  const [resizing, setResizing] = useState<ResizingDivider>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const tableWidthRef = useRef(tableWidthPercent)
  const comparisonWidthRef = useRef(comparisonWidthPercent)

  useEffect(() => {
    tableWidthRef.current = tableWidthPercent
  }, [tableWidthPercent])

  useEffect(() => {
    comparisonWidthRef.current = comparisonWidthPercent
  }, [comparisonWidthPercent])

  const showMapPanel = Boolean(rightSlotContent) && showRightSlot
  const showComparisonPanel = Boolean(comparisonContent) && showComparison
  const showBothSides = showComparisonPanel && showMapPanel
  const showSplit = showComparisonPanel || showMapPanel

  useEffect(() => {
    if (!resizing) return

    const handlePointerMove = (event: MouseEvent) => {
      const container = containerRef.current
      if (!container) return
      const rect = container.getBoundingClientRect()
      if (rect.width <= 0) return
      const pctFromLeft = ((event.clientX - rect.left) / rect.width) * 100

      if (resizing === 'table') {
        const maxTable = showBothSides
          ? 100 - comparisonWidthRef.current - MIDDLE_MIN_PERCENT
          : TABLE_MAX_PERCENT_SINGLE
        setTableWidthPercent(Math.min(maxTable, Math.max(TABLE_MIN_PERCENT, pctFromLeft)))
        return
      }

      if (resizing === 'middle') {
        const comparisonPct = 100 - pctFromLeft
        const maxComparison = Math.min(
          COMPARISON_MAX_PERCENT,
          100 - tableWidthRef.current - MIDDLE_MIN_PERCENT,
        )
        setComparisonWidthPercent(
          Math.min(maxComparison, Math.max(COMPARISON_MIN_PERCENT, comparisonPct)),
        )
      }
    }

    const handlePointerUp = () => setResizing(null)
    window.addEventListener('mousemove', handlePointerMove)
    window.addEventListener('mouseup', handlePointerUp)
    return () => {
      window.removeEventListener('mousemove', handlePointerMove)
      window.removeEventListener('mouseup', handlePointerUp)
    }
  }, [resizing, showBothSides])

  const middlePercent = showBothSides
    ? Math.max(MIDDLE_MIN_PERCENT, 100 - tableWidthPercent - comparisonWidthPercent)
    : 0

  return (
    <div
      ref={containerRef}
      className={clsx(
        'ftth-grid-split flex flex-row items-stretch overflow-hidden rounded-xl border border-[#d9e0e8] bg-(--card) shadow-[0_1px_6px_rgb(15_23_42/0.05)] dark:border-white/10 dark:shadow-[0_8px_18px_rgb(0_0_0/0.3)]',
        showSplit
          ? [
              'ftth-grid-split-side-open min-h-0 h-full max-h-[var(--ftth-grid-split-max-height)] flex-1',
              'md:h-[var(--ftth-grid-split-max-height)] md:max-h-[var(--ftth-grid-split-max-height)] md:flex-1 md:min-h-0',
              splitMinHeightClassName,
            ]
          : 'h-auto max-h-none md:h-auto md:max-h-none md:flex-none',
        resizing !== null && 'select-none',
        className,
      )}
      style={
        (showSplit
          ? {
              maxHeight,
              '--ftth-grid-split-max-height': maxHeight,
            }
          : undefined) as CSSProperties | undefined
      }
    >
      <div
        className={clsx(
          'ftth-grid-split-table-panel flex min-h-0 min-w-0 flex-col',
          showSplit ? 'h-full' : 'h-auto',
        )}
        style={{ width: showSplit ? `${tableWidthPercent}%` : '100%' }}
      >
        {children}
      </div>

      <DividerButton
        ariaLabel="Redimensionar tabla"
        isActive={resizing === 'table'}
        onMouseDown={() => setResizing('table')}
        hidden={!showSplit}
      />

      <div
        className={clsx(
          'flex min-h-0 min-w-0 flex-col overflow-hidden border-l border-black/8 dark:border-white/10',
          !showMapPanel && 'hidden',
          showMapPanel && !showBothSides && 'min-w-0 flex-1',
          showMapPanel && 'h-full',
        )}
        style={showMapPanel && showBothSides ? { width: `${middlePercent}%` } : undefined}
      >
        {rightSlotContent}
      </div>

      <DividerButton
        ariaLabel="Redimensionar comparativa"
        isActive={resizing === 'middle'}
        onMouseDown={() => setResizing('middle')}
        hidden={!showBothSides}
      />

      <div
        className={clsx(
          'flex min-h-0 min-w-0 flex-col overflow-hidden border-l border-black/8 dark:border-white/10',
          !showComparisonPanel && 'hidden',
          showComparisonPanel && !showBothSides && 'min-w-0 flex-1',
          showComparisonPanel && 'h-full',
        )}
        style={
          showComparisonPanel && showBothSides
            ? { width: `${comparisonWidthPercent}%` }
            : undefined
        }
      >
        {comparisonContent}
      </div>
    </div>
  )
}
