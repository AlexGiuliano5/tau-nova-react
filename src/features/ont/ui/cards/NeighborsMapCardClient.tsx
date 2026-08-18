import { FtthCardIssueState } from '@/features/ftth/components/FtthCardIssueState'
import { useOntNeighborsQuery } from '@/features/ont/hooks/use-ont-neighbors-query'
import { useNeighborsMapSelectionStore } from '@/features/ont/stores/neighbors-map-selection-store'
import type { OntContext } from '@/features/ont/types/ont'
import { NeighborsMapCard } from '@/features/ont/ui/NeighborsMapCard'
import { OntVecinosSectionLoading } from '@/features/ont/ui/OntInfoCardLoadings'

interface Props {
  context: OntContext
}

export function NeighborsMapCardClient({ context }: Props) {
  const query = useOntNeighborsQuery(context.entityId)
  const selectedSerials = useNeighborsMapSelectionStore((state) => state.selectedSerials)

  if (query.isLoading) return <OntVecinosSectionLoading />

  if (!query.data) {
    return (
      <FtthCardIssueState
        title="Mapa de vecinos"
        issue="unexpected"
        context="las coordenadas de vecinos"
        cardClassName="m-4 rounded-xl border bg-(--card) p-3.5 shadow-[0_1px_6px_rgb(15_23_42/0.05)] xl:m-3 dark:shadow-[0_8px_18px_rgb(0_0_0/0.3)]"
        bodyClassName="min-h-[160px]"
      />
    )
  }

  return (
    <NeighborsMapCard
      mapPoints={query.data.mapPoints}
      mapStats={query.data.mapStats}
      selectedSerials={selectedSerials}
    />
  )
}
