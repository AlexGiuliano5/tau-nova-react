import { IoGitCompareOutline } from 'react-icons/io5'
import { LuFilter } from 'react-icons/lu'
import { TbListCheck, TbRefresh } from 'react-icons/tb'

const circleBtn =
  'flex h-14 w-14 cursor-pointer items-center justify-center rounded-full border border-(--text-secondary)/20 bg-(--primary-2)/10 text-(--primary-2) transition-opacity disabled:cursor-not-allowed disabled:bg-(--gray-01) disabled:text-(--gray-02) disabled:opacity-45 dark:border-(--secondary-3) dark:bg-(--secondary-3) dark:text-white dark:disabled:bg-(--gray-02) dark:disabled:text-white'

interface Props {
  canRecalculate: boolean
  recalculateLoading?: boolean
  recalculateLabel: string
  onRecalculate?: () => void
  canCompare: boolean
  onCompare?: () => void
  showOnlySelected: boolean
  canToggleSelectionFilter: boolean
  onToggleSelectionFilter: () => void
  canOpenColumnOrder: boolean
  onOpenColumnOrder: () => void
}

/** Barra de acciones mobile (igual que tau-nova OntNeighborsTableFull). */
export function NeighborsMobileToolbar({
  canRecalculate,
  recalculateLoading = false,
  recalculateLabel,
  onRecalculate,
  canCompare,
  onCompare,
  showOnlySelected,
  canToggleSelectionFilter,
  onToggleSelectionFilter,
  canOpenColumnOrder,
  onOpenColumnOrder,
}: Props) {
  return (
    <div className="flex items-start justify-center gap-2 px-3 sm:gap-3 sm:px-6">
      <div className="flex w-20 flex-col items-center gap-1 sm:w-24">
        <button
          type="button"
          disabled={!canRecalculate || recalculateLoading || !onRecalculate}
          onClick={onRecalculate}
          className={circleBtn}
          aria-label="Recalcular métricas en tiempo real"
        >
          <TbRefresh size={32} />
        </button>
        <span className="min-h-10 text-center text-sm leading-4">{recalculateLabel}</span>
      </div>

      <div className="flex w-20 flex-col items-center gap-1 sm:w-24">
        <button
          type="button"
          disabled={!canCompare}
          onClick={canCompare && onCompare ? onCompare : undefined}
          className={circleBtn}
        >
          <IoGitCompareOutline size={32} />
        </button>
        <span className="min-h-10 text-center text-sm leading-4">Comparar</span>
      </div>

      <div className="flex w-20 flex-col items-center gap-1 sm:w-24">
        <button
          type="button"
          onClick={onToggleSelectionFilter}
          disabled={!canToggleSelectionFilter}
          aria-pressed={showOnlySelected}
          aria-label={
            showOnlySelected
              ? 'Mostrar toda la tabla'
              : 'Mostrar solo los registros seleccionados'
          }
          className={`${circleBtn} ${
            showOnlySelected
              ? 'bg-(--primary-2)/25 ring-2 ring-(--primary-2)/50 dark:bg-(--secondary)/40 dark:text-white dark:ring-white/35'
              : ''
          }`}
        >
          <TbListCheck size={32} />
        </button>
        <span className="min-h-10 text-center text-sm leading-4">Seleccionar registros</span>
      </div>

      <div className="flex w-20 flex-col items-center gap-1 sm:w-24">
        <button
          type="button"
          onClick={onOpenColumnOrder}
          disabled={!canOpenColumnOrder}
          className={circleBtn}
          aria-label="Ordenar columnas"
        >
          <LuFilter size={32} />
        </button>
        <span className="min-h-10 text-center text-sm leading-4">Ordenar columnas</span>
      </div>
    </div>
  )
}
