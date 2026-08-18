import { useMemo } from 'react'
import clsx from 'clsx'

import {
  buildOntNeighborsMapViewModel,
  filterMapMarkersBySerials,
} from '@/features/ont/lib/neighbors-map'
import type { OntNeighborMapPoint } from '@/features/ont/types/ont'
import { FtthSinglePointMapCard } from '@/features/ont/ui/map/FtthSinglePointMapCard'

interface Props {
  mapPoints: OntNeighborMapPoint[]
  mapStats: { totalCoordinates: number; validCoordinates: number }
  selectedSerials?: string[]
  className?: string
  compact?: boolean
  onClose?: () => void
  panelVisible?: boolean
  compactHeader?: boolean
  mapHeightClassName?: string
  embedded?: boolean
}

export function NeighborsMapCard({
  mapPoints,
  mapStats,
  selectedSerials = [],
  className,
  compact = false,
  onClose,
  panelVisible = true,
  compactHeader = false,
  mapHeightClassName,
  embedded,
}: Props) {
  const viewModel = useMemo(
    () => buildOntNeighborsMapViewModel(mapPoints, mapStats),
    [mapPoints, mapStats],
  )

  const visibleMarkers = useMemo(
    () => filterMapMarkersBySerials(viewModel.mapPoints, selectedSerials),
    [viewModel.mapPoints, selectedSerials],
  )

  const subtitle =
    selectedSerials.length > 0
      ? `${viewModel.mapSubtitle} · filtrado por ${selectedSerials.length} selección${selectedSerials.length === 1 ? '' : 'es'}`
      : viewModel.mapSubtitle

  const isEmbedded = embedded ?? compact
  const heightClass =
    mapHeightClassName ?? (compact ? 'h-full min-h-[320px]' : 'h-[320px]')
  const cardClassName = compact ? 'm-0 h-full' : (className ?? 'm-4 xl:m-3')

  return (
    <div
      id="ont-neighbors-map"
      className={clsx(compact ? 'm-0 h-full min-h-0' : undefined, compact ? className : undefined)}
    >
      <FtthSinglePointMapCard
        points={visibleMarkers}
        title="Mapa"
        subtitle={subtitle}
        center={viewModel.mapCenter}
        preserveViewportOnPointsChange
        viewportResetKey={viewModel.mapPoints.map((point) => point.id).join('|')}
        panelVisible={panelVisible}
        onClose={onClose}
        fullHeight={compact}
        embedded={isEmbedded}
        compactHeader={compactHeader}
        mapHeightClassName={heightClass}
        className={cardClassName}
      />
    </div>
  )
}
