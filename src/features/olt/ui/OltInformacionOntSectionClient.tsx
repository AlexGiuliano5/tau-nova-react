import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { fetchOltMetricsGridPreview } from '@/features/olt/api/metrics-grid'
import type { OltMetricsGridPreviewActionResult } from '@/features/olt/types/metrics-grid'
import { OltInformacionOntCard } from '@/features/olt/ui/OltInformacionOntCard'
import { OltInformacionOntCardLoading } from '@/features/olt/ui/OltInformacionOntCardLoading'
import {
  OltOntMetricsGridFull,
  type OltOntMetricsGridPageLoadState,
} from '@/features/olt/ui/OltOntMetricsGridFull'
import { NeighborsResizableSplit } from '@/features/ont/ui/NeighborsResizableSplit'
import { OntHistoricalComparisonPanel } from '@/features/ont/ui/OntHistoricalComparisonPanel'
import { useMdUp } from '@/shared/hooks/use-md-up'

interface Props {
  oltRouteParam: string
  /** Si true, siempre muestra tabla full (p. ej. /informacion-ont). */
  forceFullTable?: boolean
}

const emptyPreview: OltMetricsGridPreviewActionResult = {
  model: {
    columnNames: [],
    rows: [],
    pageNumber: 1,
    pageSize: 5,
    totalPages: 0,
    totalRecords: 0,
  },
  issue: 'none',
}

const errorPreview: OltMetricsGridPreviewActionResult = {
  ...emptyPreview,
  issue: 'unexpected',
}

/**
 * Mobile: preview 5 filas + link a tabla completa.
 * Desktop: grilla paginada + comparativa al costado (split, como vecinos ONT).
 */
export function OltInformacionOntSectionClient({
  oltRouteParam,
  forceFullTable = false,
}: Props) {
  const navigate = useNavigate()
  const isDesktop = useMdUp()
  const [viewportReady, setViewportReady] = useState(false)
  const [loadingPreview, setLoadingPreview] = useState(true)
  const [previewResult, setPreviewResult] = useState(emptyPreview)
  const [comparisonSerials, setComparisonSerials] = useState<string[]>([])
  const [, setGridPageLoadState] = useState<OltOntMetricsGridPageLoadState>({
    loading: true,
    blockingIssue: null,
  })

  useEffect(() => {
    setViewportReady(true)
  }, [])

  // Al cambiar de OLT, cerrar comparativa.
  useEffect(() => {
    setComparisonSerials([])
  }, [oltRouteParam])

  const useFullTable = forceFullTable || isDesktop

  useEffect(() => {
    if (!viewportReady || useFullTable) return

    let active = true
    const controller = new AbortController()

    void (async () => {
      setLoadingPreview(true)
      try {
        const next = await fetchOltMetricsGridPreview(oltRouteParam, controller.signal)
        if (active) setPreviewResult(next)
      } catch {
        if (active && !controller.signal.aborted) setPreviewResult(errorPreview)
      } finally {
        if (active) setLoadingPreview(false)
      }
    })()

    return () => {
      active = false
      controller.abort()
    }
  }, [oltRouteParam, useFullTable, viewportReady])

  const handleCompare = useCallback(
    (serials: string[]) => {
      if (serials.length < 2) return
      // Desktop (full en OLT summary o /informacion-ont desktop): panel al costado.
      if (isDesktop) {
        setComparisonSerials(serials)
        return
      }
      // Mobile forceFull (ruta /informacion-ont): página dedicada.
      const params = new URLSearchParams({
        olt: oltRouteParam,
        onts: serials.join(','),
      })
      void navigate(`/ftth/ont/comparar-historicos?${params.toString()}`)
    },
    [isDesktop, navigate, oltRouteParam],
  )

  const handleCloseCompare = useCallback(() => {
    setComparisonSerials([])
  }, [])

  const handleSelectedSerialsChange = useCallback(
    (serials: string[]) => {
      if (!isDesktop) return
      setComparisonSerials((prev) => (prev.length === 0 ? prev : serials.length >= 2 ? serials : []))
    },
    [isDesktop],
  )

  if (!viewportReady) {
    return <OltInformacionOntCardLoading />
  }

  if (!useFullTable) {
    return loadingPreview ? (
      <OltInformacionOntCardLoading />
    ) : (
      <OltInformacionOntCard
        model={previewResult.model}
        oltRouteParam={oltRouteParam}
        issue={previewResult.issue}
      />
    )
  }

  const showCompare = comparisonSerials.length > 0

  const table = (
    <OltOntMetricsGridFull
      oltRouteParam={oltRouteParam}
      embedded={isDesktop}
      showCompare={showCompare}
      onCompare={handleCompare}
      onCloseCompare={handleCloseCompare}
      onSelectedSerialsChange={handleSelectedSerialsChange}
      onPageLoadStateChange={setGridPageLoadState}
    />
  )

  // Solo split con comparativa en desktop; mobile full usa la tabla sola.
  if (!isDesktop) {
    return <div className="ftth-grid-table-host min-w-0">{table}</div>
  }

  return (
    <NeighborsResizableSplit
      className="m-4 xl:m-0"
      showComparison={showCompare}
      comparisonContent={
        showCompare ? (
          <OntHistoricalComparisonPanel
            ontSerials={comparisonSerials}
            oltId={oltRouteParam}
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
  )
}
