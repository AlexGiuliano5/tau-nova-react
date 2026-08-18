import { useMemo, useState } from 'react'
import { IoArrowBack } from 'react-icons/io5'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { FtthCardIssueState } from '@/features/ftth/components/FtthCardIssueState'
import { OntHistoricalComparisonPanel } from '@/features/ont/ui/OntHistoricalComparisonPanel'

export function OntHistoricalComparisonPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const oltId = (params.get('olt') ?? '').trim()

  const initialOnts = useMemo(() => {
    const raw = params.get('onts') ?? ''
    return raw
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  }, [params])

  const [ontSerials, setOntSerials] = useState(initialOnts)

  if (ontSerials.length < 2) {
    return (
      <div className="mx-4 my-6 flex flex-col gap-3">
        <FtthCardIssueState
          title="Comparar históricos"
          issue="no-data"
          message="Seleccioná al menos 2 ONTs para comparar."
          cardClassName="rounded-xl border bg-(--card) p-6 shadow-sm"
          bodyClassName="min-h-[80px]"
        />
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 self-start rounded-md border border-(--table-stroke) px-3 py-2 text-sm text-(--text-primary)"
        >
          <IoArrowBack size={16} />
          Volver
        </button>
      </div>
    )
  }

  return (
    <div className="flex min-h-[70dvh] flex-col bg-(--background)">
      <header className="sticky top-0 z-10 flex shrink-0 items-center gap-3 border-b border-(--table-stroke) bg-(--card)/95 px-4 py-3 backdrop-blur-sm dark:border-white/10">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Volver"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-(--table-stroke) text-(--text-secondary) transition-colors hover:bg-(--table-header) hover:text-(--text-primary) dark:border-white/12"
        >
          <IoArrowBack size={20} />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="text-base font-semibold leading-tight text-(--primary-2) dark:text-(--secondary)">
            Comparar histórico
          </h1>
          <p className="truncate text-xs text-(--text-secondary)">
            {oltId || 'Multiserie por ONT'}
          </p>
        </div>
      </header>

      <div className="min-h-0 flex-1">
        <OntHistoricalComparisonPanel
          ontSerials={ontSerials}
          oltId={oltId}
          hideHeader
          onClose={() => navigate(-1)}
          onRemoveOnt={(serial) =>
            setOntSerials((prev) => prev.filter((item) => item !== serial))
          }
        />
      </div>
    </div>
  )
}
