import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { FtthCardIssueState } from '@/features/ftth/components/FtthCardIssueState'
import { NeighborsTable } from '@/features/ont/components/NeighborsTable'
import { NeighborsTablePreview } from '@/features/ont/components/NeighborsTablePreview'
import { useOntNeighborsQuery } from '@/features/ont/hooks/use-ont-neighbors-query'
import { buildNeighborPreviewItems } from '@/features/ont/lib/neighbors-preview'
import { normalizeOntId } from '@/features/ont/lib/ont-serial'
import { useNeighborsMapSelectionStore } from '@/features/ont/stores/neighbors-map-selection-store'
import type { OntContext } from '@/features/ont/types/ont'
import { NeighborsMapCard } from '@/features/ont/ui/NeighborsMapCard'
import { NeighborsResizableSplit } from '@/features/ont/ui/NeighborsResizableSplit'
import { OntHistoricalComparisonPanel } from '@/features/ont/ui/OntHistoricalComparisonPanel'
import { OntVecinosSectionLoading } from '@/features/ont/ui/OntInfoCardLoadings'

interface Props {
  ont: string
  context: OntContext
  isDesktop?: boolean
}

export function NeighborsCardClient({ ont, context, isDesktop = true }: Props) {
  const navigate = useNavigate()
  const query = useOntNeighborsQuery(context.entityId)
  const [showMap, setShowMap] = useState(false)
  const [comparisonSerials, setComparisonSerials] = useState<string[]>([])
  const setSelectedSerials = useNeighborsMapSelectionStore((state) => state.setSelectedSerials)
  const selectedSerials = useNeighborsMapSelectionStore((state) => state.selectedSerials)

  const realtimeTarget =
    context.olt.trim() && context.slot.trim() && context.port.trim()
      ? { olt: context.olt.trim(), slot: context.slot.trim(), port: context.port.trim() }
      : null

  const onSelectedSerialsChange = useCallback(
    (serials: string[]) => {
      setSelectedSerials(serials)
      if (!isDesktop) return
      setComparisonSerials((prev) => (prev.length === 0 ? prev : serials))
    },
    [isDesktop, setSelectedSerials],
  )

  const handleCompare = useCallback(
    (serials: string[]) => {
      if (serials.length < 2) return
      if (!isDesktop) {
        const params = new URLSearchParams({ onts: serials.join(',') })
        if (context.olt.trim()) params.set('olt', context.olt.trim())
        navigate(`/ftth/ont/comparar-historicos?${params.toString()}`)
        return
      }
      setComparisonSerials(serials)
    },
    [context.olt, isDesktop, navigate],
  )

  const handleCloseCompare = useCallback(() => {
    setComparisonSerials([])
  }, [])

  if (query.isLoading) return <OntVecinosSectionLoading />

  if (!query.data) {
    return (
      <FtthCardIssueState
        title="Información de las ONT vecinas"
        issue="unexpected"
        context="los vecinos del puerto"
        cardClassName="mx-4 mb-4 rounded-xl border bg-(--card) p-3.5 shadow-[0_1px_6px_rgb(15_23_42/0.05)] xl:mx-3 dark:shadow-[0_8px_18px_rgb(0_0_0/0.3)]"
        bodyClassName="min-h-[160px]"
      />
    )
  }

  const model = query.data
  const showCompare = comparisonSerials.length > 0

  if (!isDesktop) {
    const previewNeighbors = buildNeighborPreviewItems(model)
    return (
      <div className="mx-4 mb-4 xl:mx-3 xl:mb-3">
        <NeighborsTablePreview
          ont={ont}
          neighbors={previewNeighbors}
          realtimeTarget={realtimeTarget}
        />
      </div>
    )
  }

  const table = (
    <NeighborsTable
      model={model}
      highlightSerial={normalizeOntId(ont)}
      showMap={showMap}
      embedded
      realtimeTarget={realtimeTarget}
      showCompare={showCompare}
      onCompare={handleCompare}
      onCloseCompare={handleCloseCompare}
      onSelectedSerialsChange={onSelectedSerialsChange}
      onToggleMap={() => setShowMap((prev) => !prev)}
    />
  )

  return (
    <NeighborsResizableSplit
      className="mx-4 mb-4 xl:mx-3 xl:mb-3"
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
            oltId={context.olt}
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
