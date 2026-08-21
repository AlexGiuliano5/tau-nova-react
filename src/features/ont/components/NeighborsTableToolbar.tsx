import clsx from 'clsx'
import { useEffect, useRef, useState } from 'react'
import { IoEllipsisVertical } from 'react-icons/io5'

const toolbarBtnBase =
  'inline-flex min-h-9 cursor-pointer items-center justify-center rounded-md border px-3 py-1.5 text-sm font-medium transition-[background-color,border-color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--primary-2)/35 focus-visible:ring-offset-2 focus-visible:ring-offset-(--background) disabled:cursor-not-allowed md:text-[12px] dark:focus-visible:ring-(--secondary)/40 dark:focus-visible:ring-offset-(--card)'

interface Props {
  title?: string | null
  showMap?: boolean
  onToggleMap?: () => void
  canToggleMap?: boolean
  /** Oculta el boton de mapa (p. ej. grilla OLT sin coords de puerto). */
  showMapButton?: boolean
  onCompare?: () => void
  canCompare?: boolean
  showCompare?: boolean
  showCompareButton?: boolean
  onRecalculate?: () => void
  recalculateLoading?: boolean
  recalculateLabel?: string
  canRecalculate?: boolean
  showRecalculateButton?: boolean
  recalculateTooltip?: string
  showFilters?: boolean
  onToggleFilters?: () => void
  selectedCount?: number
  showOnlySelected?: boolean
  onToggleSelectionFilter?: () => void
  onOpenColumnOrder?: () => void
  issueCounts?: { interrupted: number; degraded: number }
  activeIssueFilter?: 'interrupted' | 'degraded' | null
  onIssueFilter?: (kind: 'interrupted' | 'degraded') => void
}

export function NeighborsTableToolbar({
  title = 'Información de las ONT vecinas',
  showMap = false,
  onToggleMap,
  canToggleMap = false,
  showMapButton = true,
  onCompare,
  canCompare = false,
  showCompare = false,
  showCompareButton = true,
  onRecalculate,
  recalculateLoading = false,
  recalculateLabel = 'Recalcular ONTs',
  canRecalculate = true,
  showRecalculateButton = true,
  recalculateTooltip,
  showFilters = true,
  onToggleFilters,
  selectedCount = 0,
  showOnlySelected = false,
  onToggleSelectionFilter,
  onOpenColumnOrder,
  issueCounts,
  activeIssueFilter = null,
  onIssueFilter,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const onDoc = (event: MouseEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setMenuOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  const canToggleSelection = showOnlySelected || selectedCount > 0
  const canRunCompare = canCompare || showCompare
  const canRunRecalculate = Boolean(onRecalculate) && canRecalculate && !recalculateLoading
  const resolvedTitle = title === null ? null : title

  return (
    <div className="flex flex-col gap-3 border-b border-black/10 px-3 pb-3 dark:border-white/10 md:px-4">
      {resolvedTitle ? (
        <h2 className="m-0 text-lg font-semibold leading-tight tracking-tight text-(--primary-2) md:text-[1.05rem] dark:text-(--secondary)">
          {resolvedTitle}
        </h2>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {showMapButton ? (
            <button
              type="button"
              disabled={!canToggleMap || !onToggleMap}
              onClick={onToggleMap}
              className={clsx(
                toolbarBtnBase,
                canToggleMap && onToggleMap
                  ? clsx(
                      'border-(--table-stroke) bg-(--card) text-(--text-primary) hover:bg-(--table-header) dark:hover:bg-white/5',
                      showMap &&
                        'border-(--primary-2)/35 bg-(--primary-2)/10 text-(--primary-2) dark:border-(--secondary)/40 dark:bg-(--secondary)/15 dark:text-(--secondary)',
                    )
                  : 'cursor-not-allowed border-(--table-stroke) bg-(--card) text-(--text-secondary) opacity-55',
              )}
            >
              {showMap ? 'Ocultar mapa' : 'Ver mapa'}
            </button>
          ) : null}
          {showCompareButton ? (
            <span title={!canRunCompare ? 'Debe seleccionar 2 o + Onts para realizar la comparacion' : undefined}>
              <button
                type="button"
                disabled={!canRunCompare}
                onClick={onCompare}
                className={clsx(
                  toolbarBtnBase,
                  canRunCompare
                    ? clsx(
                        'border-(--table-stroke) bg-(--card) text-(--text-primary) hover:bg-(--table-header) dark:hover:bg-white/5',
                        showCompare &&
                          'border-(--primary-2)/35 bg-(--primary-2)/10 text-(--primary-2) dark:border-(--secondary)/40 dark:bg-(--secondary)/15 dark:text-(--secondary)',
                      )
                    : 'cursor-not-allowed border-(--table-stroke) bg-(--card) text-(--text-secondary) opacity-55',
                )}
              >
                {showCompare ? 'Ocultar comparativa' : 'Comparar'}
              </button>
            </span>
          ) : null}
          {showRecalculateButton ? (
            <button
              type="button"
              title={recalculateTooltip}
              disabled={!canRunRecalculate}
              onClick={onRecalculate}
              className={clsx(
                toolbarBtnBase,
                canRunRecalculate
                  ? 'border-(--table-stroke) bg-(--card) text-(--text-primary) hover:bg-(--table-header) dark:hover:bg-white/5'
                  : 'cursor-not-allowed border-(--table-stroke) bg-(--card) text-(--text-secondary) opacity-55',
              )}
            >
              {recalculateLabel}
            </button>
          ) : null}
        </div>

        <div className="flex min-w-0 items-center gap-3">
          <IssueSummary
            counts={issueCounts}
            activeKind={activeIssueFilter}
            onSelect={onIssueFilter}
          />
          <div ref={wrapRef} className="relative">
            <button
              type="button"
              className={clsx(
                toolbarBtnBase,
                'border-(--table-stroke) bg-(--card) text-(--text-primary) hover:bg-(--table-header) dark:hover:bg-white/5',
              )}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              Acciones
              <IoEllipsisVertical className="ml-1.5" size={14} aria-hidden />
            </button>
            {menuOpen ? (
              <div
                role="menu"
                className="absolute right-0 top-[calc(100%+0.35rem)] z-30 min-w-[220px] rounded-xl border border-black/10 bg-(--card) p-1.5 shadow-[0_14px_28px_rgba(15,23,42,0.14)] dark:border-white/10"
              >
                <MenuItem
                  disabled={!onToggleSelectionFilter || !canToggleSelection}
                  onClick={() => {
                    onToggleSelectionFilter?.()
                    setMenuOpen(false)
                  }}
                >
                  {showOnlySelected ? 'Mostrar todos' : 'Seleccionar registros'}
                </MenuItem>
                <MenuItem
                  disabled={!onToggleFilters}
                  onClick={() => {
                    onToggleFilters?.()
                    setMenuOpen(false)
                  }}
                >
                  {showFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
                </MenuItem>
                <MenuItem
                  disabled={!onOpenColumnOrder}
                  onClick={() => {
                    onOpenColumnOrder?.()
                    setMenuOpen(false)
                  }}
                >
                  Configurar columnas
                </MenuItem>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

const issueChipBase =
  'inline-flex max-w-full items-center rounded-full px-2 py-0.5 text-[11px] font-semibold leading-tight'

function IssueSummary({
  counts,
  activeKind,
  onSelect,
}: {
  counts?: { interrupted: number; degraded: number }
  activeKind?: 'interrupted' | 'degraded' | null
  onSelect?: (kind: 'interrupted' | 'degraded') => void
}) {
  if (!counts) return null
  if (counts.interrupted <= 0 && counts.degraded <= 0) return null

  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      {counts.degraded > 0 ? (
        <IssueChip
          kind="degraded"
          pressed={activeKind === 'degraded'}
          onSelect={onSelect}
          className="bg-(--tag-state-02) text-[#9a7400] dark:bg-(--state-02)/25 dark:text-[#f0c56a]"
        >
          {counts.degraded} PO {counts.degraded === 1 ? 'advertencia' : 'advertencias'}
        </IssueChip>
      ) : null}
      {counts.degraded > 0 && counts.interrupted > 0 ? (
        <span className="text-[11px] font-semibold text-(--text-secondary)" aria-hidden>
          |
        </span>
      ) : null}
      {counts.interrupted > 0 ? (
        <IssueChip
          kind="interrupted"
          pressed={activeKind === 'interrupted'}
          onSelect={onSelect}
          className="bg-(--tag-state-03) text-(--state-03) dark:bg-(--state-03)/20 dark:text-[#ff9aa0]"
        >
          {counts.interrupted} PO {counts.interrupted === 1 ? 'crítica' : 'críticas'}
        </IssueChip>
      ) : null}
    </div>
  )
}

function IssueChip({
  kind,
  pressed,
  onSelect,
  className,
  children,
}: {
  kind: 'interrupted' | 'degraded'
  pressed: boolean
  onSelect?: (kind: 'interrupted' | 'degraded') => void
  className: string
  children: string
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      title={pressed ? 'Mostrar todos' : 'Mostrar solo estas filas'}
      onClick={() => onSelect?.(kind)}
      className={clsx(
        issueChipBase,
        'cursor-pointer transition-[box-shadow,filter] hover:brightness-[0.97] dark:hover:brightness-110',
        pressed && 'ring-2 ring-current/35',
        className,
      )}
    >
      {children}
    </button>
  )
}

function MenuItem({
  children,
  onClick,
  disabled,
}: {
  children: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={onClick}
      className="block w-full rounded-md px-3 py-2 text-left text-[12px] font-medium text-(--text-secondary) transition-colors hover:bg-black/5 hover:text-(--text-primary) disabled:cursor-not-allowed disabled:opacity-45 dark:hover:bg-white/8"
    >
      {children}
    </button>
  )
}
