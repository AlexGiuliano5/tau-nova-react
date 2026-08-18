import { useCallback, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import clsx from 'clsx'

import { CardSpinner } from '@/features/ftth/components/CardSpinner'
import { FtthCardIssueState } from '@/features/ftth/components/FtthCardIssueState'
import type { OltMetricsGridPageModel } from '@/features/olt/types/metrics-grid'
import { OltOntMetricsGridPreview } from '@/features/olt/ui/OltOntMetricsGridPreview'
import { NeighborsTable } from '@/features/ont/components/NeighborsTable'
import { useOntNeighborsQuery } from '@/features/ont/hooks/use-ont-neighbors-query'
import { useNeighborsMapSelectionStore } from '@/features/ont/stores/neighbors-map-selection-store'
import type { OntNeighborsGridModel } from '@/features/ont/types/ont'
import { NeighborsMapCard } from '@/features/ont/ui/NeighborsMapCard'
import { NeighborsResizableSplit } from '@/features/ont/ui/NeighborsResizableSplit'
import { OntHistoricalComparisonPanel } from '@/features/ont/ui/OntHistoricalComparisonPanel'
import {
  buildPortEntityId,
  buildPortTablaHref,
} from '@/features/port/lib/olt-placa-puerto-route'
import { useMdUp } from '@/shared/hooks/use-md-up'

interface Props {
  olt: string
  placa: number
  puerto: number
  /** Forzar tabla full (ruta /tabla). */
  forceFullTable?: boolean
}

const cardClassName =
  'm-4 rounded-xl border border-[#d9e0e8] bg-(--card) p-3.5 shadow-[0_1px_6px_rgb(15_23_42/0.05)] xl:m-0 dark:border-white/10 dark:shadow-[0_8px_18px_rgb(0_0_0/0.3)] flex flex-col gap-3'

/**
 * Información de las ONT del puerto.
 * Mobile (detalle): preview 5 filas + link a /tabla.
 * Desktop: tabla full + mapa + comparar split.
 */
export function PortMetricsGridSectionClient({
  olt,
  placa,
  puerto,
  forceFullTable = false,
}: Props) {
  const navigate = useNavigate()
  const isDesktop = useMdUp()
  const entityId = buildPortEntityId(olt, placa, puerto)
  const fullTableHref = buildPortTablaHref(olt, placa, puerto)
  const useFull = forceFullTable || isDesktop

  const query = useOntNeighborsQuery(entityId)
  const [showMap, setShowMap] = useState(false)
  const [comparisonSerials, setComparisonSerials] = useState<string[]>([])
  const setSelectedSerials = useNeighborsMapSelectionStore((state) => state.setSelectedSerials)
  const selectedSerials = useNeighborsMapSelectionStore((state) => state.selectedSerials)

  const realtimeTarget = {
    olt: olt.trim(),
    slot: String(placa),
    port: String(puerto),
  }

  const handleCompare = useCallback(
    (serials: string[]) => {
      if (serials.length < 2) return
      if (!isDesktop) {
        const params = new URLSearchParams({ onts: serials.join(','), olt })
        navigate(`/ftth/ont/comparar-historicos?${params.toString()}`)
        return
      }
      setComparisonSerials(serials)
    },
    [isDesktop, navigate, olt],
  )

  const handleCloseCompare = useCallback(() => setComparisonSerials([]), [])

  const onSelectedSerialsChange = useCallback(
    (serials: string[]) => {
      setSelectedSerials(serials)
      if (!isDesktop) return
      setComparisonSerials((prev) => (prev.length === 0 ? prev : serials))
    },
    [isDesktop, setSelectedSerials],
  )

  if (query.isLoading) {
    return (
      <div className={cardClassName} aria-busy="true" aria-live="polite">
        <header>
          <h2 className="text-lg font-semibold leading-tight tracking-tight md:text-[1.05rem]">
            Información de las ONT
          </h2>
        </header>
        <div className="flex min-h-[200px] items-center justify-center">
          <CardSpinner label="Cargando información de las ONT" />
        </div>
      </div>
    )
  }

  if (query.isError || !query.data) {
    const code = query.error instanceof Error ? query.error.message : 'unknown'
    const issue =
      code === 'no-data' ? 'no-data' : code === 'auth' ? 'error' : 'unexpected'
    return (
      <FtthCardIssueState
        title="Información de las ONT"
        issue={issue}
        context="la información de ONT de este puerto"
        cardClassName={cardClassName}
        bodyClassName="min-h-[160px]"
      />
    )
  }

  if (!useFull) {
    return <PortMetricsGridMobilePreview model={query.data} fullTableHref={fullTableHref} />
  }

  const model = query.data
  const showCompare = comparisonSerials.length > 0

  const table = (
    <NeighborsTable
      model={model}
      showMap={showMap}
      embedded
      toolbarTitle={null}
      tablePreferenceId="puerto"
      emptyTitle="Información de las ONT"
      emptyContext="la información de ONT de este puerto"
      realtimeTarget={realtimeTarget}
      showCompare={showCompare}
      onCompare={handleCompare}
      onCloseCompare={handleCloseCompare}
      onSelectedSerialsChange={onSelectedSerialsChange}
      onToggleMap={() => setShowMap((prev) => !prev)}
    />
  )

  return (
    <section className={cardClassName}>
      <header>
        <h2 className="text-lg font-semibold leading-tight tracking-tight md:text-[1.05rem]">
          Información de las ONT
        </h2>
      </header>
      <NeighborsResizableSplit
        className={clsx('min-w-0', !showMap && !showCompare && 'border-0 shadow-none')}
        showRightSlot={showMap}
        rightSlotContent={
          showMap ? (
            <div className="h-full min-h-0 p-3">
              <NeighborsMapCard
                compact
                mapPoints={model.mapPoints}
                mapStats={model.mapStats}
                selectedSerials={selectedSerials}
                onClose={() => setShowMap(false)}
              />
            </div>
          ) : undefined
        }
        showComparison={showCompare}
        comparisonContent={
          showCompare ? (
            <OntHistoricalComparisonPanel
              ontSerials={comparisonSerials}
              oltId={olt}
              onClose={handleCloseCompare}
              onRemoveOnt={(serial) =>
                setComparisonSerials((prev) => {
                  const next = prev.filter((item) => item !== serial)
                  return next.length >= 2 ? next : []
                })
              }
            />
          ) : undefined
        }
      >
        <div className="ftth-grid-table-host min-w-0">{table}</div>
      </NeighborsResizableSplit>
    </section>
  )
}

function PortMetricsGridMobilePreview({
  model,
  fullTableHref,
}: {
  model: OntNeighborsGridModel
  fullTableHref: string
}) {
  const previewModel: OltMetricsGridPageModel = {
    columnNames: model.columnNames,
    rows: model.rows.slice(0, 5),
    pageNumber: 1,
    pageSize: 5,
    totalPages: model.rows.length > 0 ? 1 : 0,
    totalRecords: model.rows.length,
  }

  if (model.columnNames.length === 0 || model.rows.length === 0) {
    return (
      <FtthCardIssueState
        title="Información de las ONT"
        issue="no-data"
        context="la información de ONT de este puerto"
        cardClassName={cardClassName}
        bodyClassName="min-h-[160px]"
      />
    )
  }

  return (
    <section className={cardClassName}>
      <header>
        <h2 className="text-lg font-semibold leading-tight tracking-tight md:text-[1.05rem]">
          Información de las ONT
        </h2>
      </header>
      <OltOntMetricsGridPreview model={previewModel} />
      <Link
        to={fullTableHref}
        className="mt-1 flex w-full justify-center font-semibold text-(--primary) dark:text-(--secondary)"
      >
        Ver tabla completa
      </Link>
    </section>
  )
}
