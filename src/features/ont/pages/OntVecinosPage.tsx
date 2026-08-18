import { useCallback, useMemo, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { FtthCardIssueState } from '@/features/ftth/components/FtthCardIssueState'
import { NeighborsTable } from '@/features/ont/components/NeighborsTable'
import { useOntContextQuery } from '@/features/ont/hooks/use-ont-context-query'
import { useOntNeighborsQuery } from '@/features/ont/hooks/use-ont-neighbors-query'
import { OntLastMetricError } from '@/features/ont/hooks/use-ont-last-metric-query'
import { normalizeOntId } from '@/features/ont/lib/ont-serial'
import { useNeighborsMapSelectionStore } from '@/features/ont/stores/neighbors-map-selection-store'
import { NeighborsMapCard } from '@/features/ont/ui/NeighborsMapCard'
import { OntDetailBreadcrumb } from '@/features/ont/ui/OntDetailBreadcrumb'
import { OntVecinosSectionLoading } from '@/features/ont/ui/OntInfoCardLoadings'

/**
 * Tabla completa de vecinos (mobile: desde “Ver tabla completa” del preview).
 * Layout alineado a tau-nova `/ftth/ont/[ont]/vecinos`.
 */
export function OntVecinosPage() {
  const { ont = '' } = useParams()
  const navigate = useNavigate()
  const ontContext = useOntContextQuery(ont)
  const context = ontContext.data ?? null
  const entityId = context?.entityId?.trim() ?? ''
  const query = useOntNeighborsQuery(entityId)
  const setSelectedSerials = useNeighborsMapSelectionStore((state) => state.setSelectedSerials)
  const selectedSerials = useNeighborsMapSelectionStore((state) => state.selectedSerials)

  const infoHref = useMemo(
    () => `/ftth/ont/${encodeURIComponent(ont)}/info`,
    [ont],
  )

  const realtimeTarget =
    context?.olt.trim() && context.slot.trim() && context.port.trim()
      ? { olt: context.olt.trim(), slot: context.slot.trim(), port: context.port.trim() }
      : null

  const handleCompare = useCallback(
    (serials: string[]) => {
      if (serials.length < 2) return
      const params = new URLSearchParams({ onts: serials.join(',') })
      if (context?.olt.trim()) params.set('olt', context.olt.trim())
      navigate(`/ftth/ont/comparar-historicos?${params.toString()}`)
    },
    [context?.olt, navigate],
  )

  if (!ont.trim()) {
    return null
  }

  const shell = (body: ReactNode) => (
    <div className="flex w-full flex-1 flex-col">
      <OntDetailBreadcrumb ont={ont} backHref={infoHref} showLinkIndicator={false} />
      <div className="flex max-h-[calc(100dvh-208px)] min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto">{body}</div>
      </div>
    </div>
  )

  if (ontContext.isPending && !context) {
    return shell(<OntVecinosSectionLoading />)
  }

  if (!context || context.mode === 'infraco' || !entityId) {
    const isInfraco = context?.mode === 'infraco'
    const code =
      ontContext.error instanceof OntLastMetricError ? ontContext.error.code : 'unknown'
    const issue = isInfraco ? 'no-data' : code === 'auth' ? 'error' : 'unexpected'

    return shell(
      <div className="mx-4 my-6 flex flex-col gap-3">
        <FtthCardIssueState
          title="Vecinos"
          issue={issue}
          message={isInfraco ? 'En modo infraco no hay vecinos de puerto.' : undefined}
          context={isInfraco ? undefined : 'los vecinos del puerto'}
          cardClassName="rounded-xl border bg-(--card) p-6 shadow-sm"
          bodyClassName="min-h-[100px]"
        />
        <Link
          to={infoHref}
          className="text-center text-sm font-semibold text-(--primary-2) dark:text-(--secondary)"
        >
          Volver a la ONT
        </Link>
      </div>,
    )
  }

  if (query.isLoading) {
    return shell(
      <div className="h-full w-full p-3">
        <div
          className="relative flex min-h-[280px] w-full items-center justify-center rounded-lg border border-(--table-stroke) bg-(--card) p-4 shadow-sm dark:border dark:border-white/15"
          aria-busy="true"
          aria-live="polite"
        >
          <OntVecinosSectionLoading />
        </div>
      </div>,
    )
  }

  if (!query.data) {
    return shell(
      <div className="mx-4 my-6 flex flex-col gap-3">
        <FtthCardIssueState
          title="Vecinos"
          issue="unexpected"
          context="la tabla de vecinos"
          cardClassName="rounded-xl border bg-(--card) p-6 shadow-sm"
          bodyClassName="min-h-[100px]"
        />
        <Link
          to={infoHref}
          className="text-center text-sm font-semibold text-(--primary-2) dark:text-(--secondary)"
        >
          Volver a la ONT
        </Link>
      </div>,
    )
  }

  const model = query.data

  return shell(
    <>
      <NeighborsTable
        model={model}
        highlightSerial={normalizeOntId(ont)}
        realtimeTarget={realtimeTarget}
        onCompare={handleCompare}
        onSelectedSerialsChange={setSelectedSerials}
      />

      {/* Mobile: mapa siempre debajo (como FtthGridTableMapLayout en tau-nova). */}
      <div>
        <div className="mx-4 mt-4 border-t border-black/10 dark:border-white/10" />
        <NeighborsMapCard
          mapPoints={model.mapPoints}
          mapStats={model.mapStats}
          selectedSerials={selectedSerials}
          className="mx-4 mt-5"
          compactHeader
          embedded
          mapHeightClassName="h-[232px]"
        />
      </div>
    </>,
  )
}
