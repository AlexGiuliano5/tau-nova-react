import { useEffect, useMemo, useState, type ReactNode } from 'react'
import clsx from 'clsx'
import { Link, useParams } from 'react-router-dom'

import { OntLastMetricError } from '@/features/ont/hooks/use-ont-last-metric-query'
import { useOntContextQuery } from '@/features/ont/hooks/use-ont-context-query'
import {
  buildDesktopVisualRows,
  prepareOntInfoRuntimeCards,
  resolveOntInfoDesktopSlotWrapperClass,
  resolveOntInfoResponsiveItemWidthClass,
} from '@/features/ont/lib/layout-runtime'
import type { OntContext } from '@/features/ont/types/ont'
import { AlertasCardClient } from '@/features/ont/ui/cards/AlertasCardClient'
import { ClienteCardClient } from '@/features/ont/ui/cards/ClienteCardClient'
import { DetailsCardClient } from '@/features/ont/ui/cards/DetailsCardClient'
import { InterruptionsCardClient } from '@/features/ont/ui/cards/InterruptionsCardClient'
import { MetricsCardClient } from '@/features/ont/ui/cards/MetricsCardClient'
import { NeighborsCardClient } from '@/features/ont/ui/cards/NeighborsCardClient'
import { NeighborsMapCardClient } from '@/features/ont/ui/cards/NeighborsMapCardClient'
import { InfracoMapCardClient } from '@/features/ont/ui/cards/InfracoMapCardClient'
import {
  OntAlertasCardLoading,
  OntClientCardLoading,
  OntInfoCardLoading,
  OntInterrupcionesCardLoading,
  OntMetricsCardGridLoading,
  OntVecinosSectionLoading,
} from '@/features/ont/ui/OntInfoCardLoadings'
import { loadOntInfoLayoutDraft } from '@/features/ont-preferences/api/layout-preferences'
import { buildDefaultLayoutDraft } from '@/features/ont-preferences/lib/defaults'
import type {
  OntInfoCardId,
  OntInfoOrderItem,
  OntInfoScreenLayoutDraft,
  OntInfoScreenViewMode,
} from '@/features/ont-preferences/types/layout'
import {
  resolveOntInfoCardsPreferenceKey,
  resolveOntInfoMetricsPreferenceKey,
} from '@/features/ont-preferences/types/layout'

function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(true)

  useEffect(() => {
    const media = window.matchMedia('(min-width: 768px)')
    const onChange = () => setIsDesktop(media.matches)
    onChange()
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  return isDesktop
}

/**
 * Flujo idéntico a tau-nova:
 * 1) Skeleton de cards default mientras cargan prefs (+ contexto normal/infraco).
 * 2) Con prefs (o defaults), montar solo cards visibles según modo.
 * 3) Cada card carga su API de forma independiente.
 */
export function OntInfoPage() {
  const { ont = '' } = useParams()
  const isDesktop = useIsDesktop()
  const ontContext = useOntContextQuery(ont)

  const [prefsReady, setPrefsReady] = useState(false)
  const [layoutDraft, setLayoutDraft] = useState<OntInfoScreenLayoutDraft>(() =>
    buildDefaultLayoutDraft(),
  )

  useEffect(() => {
    const controller = new AbortController()
    let active = true
    setPrefsReady(false)

    void (async () => {
      try {
        const prefsResult = await loadOntInfoLayoutDraft(controller.signal).catch(() =>
          buildDefaultLayoutDraft(),
        )
        if (!active) return
        setLayoutDraft(prefsResult)
      } finally {
        if (active) setPrefsReady(true)
      }
    })()

    return () => {
      active = false
      controller.abort()
    }
  }, [ont])

  const context = ontContext.data ?? null
  const viewMode: OntInfoScreenViewMode = context?.mode ?? 'normal'
  const contextPending = ontContext.isPending && !ontContext.data
  const skeletonOnly = !prefsReady || contextPending

  const viewport = isDesktop ? 'desktop' : 'mobile'
  const cardsKey = resolveOntInfoCardsPreferenceKey(viewport, viewMode)
  const metricsKey = resolveOntInfoMetricsPreferenceKey(viewport, viewMode)
  const preferenceCards = skeletonOnly
    ? buildDefaultLayoutDraft()[
        viewMode === 'infraco'
          ? isDesktop
            ? 'infracoDesktop'
            : 'infracoMobile'
          : isDesktop
            ? 'desktop'
            : 'mobile'
      ]
    : layoutDraft[cardsKey]
  const metricPreferences = layoutDraft[metricsKey]

  const runtimeCards = useMemo(
    () => prepareOntInfoRuntimeCards(preferenceCards, viewMode, isDesktop),
    [preferenceCards, viewMode, isDesktop],
  )

  if (!skeletonOnly && !context) {
    const code =
      ontContext.error instanceof OntLastMetricError ? ontContext.error.code : 'unknown'
    const message =
      code === 'auth'
        ? 'Sesión inválida. Volvé a iniciar sesión.'
        : code === 'no-data'
          ? 'No encontramos métricas para esta ONT.'
          : 'No pudimos cargar el contexto de la ONT.'
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
        <p className="text-sm text-(--state-03)">{message}</p>
        <Link to="/ftth" className="text-sm font-semibold text-(--primary-2) dark:text-(--secondary)">
          Volver al home
        </Link>
      </div>
    )
  }

  return (
    <div className="flex min-w-0 flex-col gap-3" aria-busy={skeletonOnly || undefined}>
      <OntInfoStreamingLayout
        cards={runtimeCards}
        isDesktop={isDesktop}
        skeletonOnly={skeletonOnly}
        ont={ont}
        context={context}
        metricPreferences={metricPreferences}
      />
    </div>
  )
}

function OntInfoStreamingLayout({
  cards,
  isDesktop,
  skeletonOnly,
  ont,
  context,
  metricPreferences,
}: {
  cards: OntInfoOrderItem[]
  isDesktop: boolean
  skeletonOnly: boolean
  ont: string
  context: OntContext | null
  metricPreferences: OntInfoOrderItem[]
}) {
  const renderSlot = (card: OntInfoOrderItem): ReactNode => {
    if (skeletonOnly || !context) {
      return cardLoadingFallback(card.id as OntInfoCardId)
    }
    return renderLiveCard(card.id as OntInfoCardId, ont, context, isDesktop, metricPreferences)
  }

  if (!isDesktop) {
    return (
      <div className="flex min-w-0 flex-col gap-3 pb-2">
        {cards.map((card) => (
          <div key={card.id} className="w-full min-w-0">
            {renderSlot(card)}
          </div>
        ))}
      </div>
    )
  }

  const rows = buildDesktopVisualRows(cards)

  return (
    <div className="flex min-w-0 flex-col gap-3 pb-2">
      {rows.map((rowIndices) => (
        <div key={rowIndices.join('-')} className="flex w-full min-w-0 flex-col gap-3 md:flex-row">
          {rowIndices.map((itemIndex) => {
            const card = cards[itemIndex]
            if (!card) return null
            return (
              <div
                key={card.id}
                className={clsx(
                  resolveOntInfoResponsiveItemWidthClass(card),
                  resolveOntInfoDesktopSlotWrapperClass(card, cards, rowIndices),
                )}
              >
                {renderSlot(card)}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

function cardLoadingFallback(cardId: OntInfoCardId): ReactNode {
  switch (cardId) {
    case 'alertas':
      return <OntAlertasCardLoading />
    case 'cliente':
      return <OntClientCardLoading />
    case 'info':
      return <OntInfoCardLoading />
    case 'metricas':
      return <OntMetricsCardGridLoading />
    case 'interrupciones':
      return <OntInterrupcionesCardLoading />
    case 'vecinos':
    case 'mapa-vecinos':
    case 'mapa-infraco':
      return <OntVecinosSectionLoading />
    default:
      return null
  }
}

function renderLiveCard(
  cardId: OntInfoCardId,
  ont: string,
  context: OntContext,
  isDesktop: boolean,
  metricPreferences: OntInfoOrderItem[],
): ReactNode {
  switch (cardId) {
    case 'alertas':
      return <AlertasCardClient ont={ont} />
    case 'cliente':
      return <ClienteCardClient ont={ont} />
    case 'info':
      return <DetailsCardClient ont={ont} context={context} />
    case 'metricas':
      return (
        <MetricsCardClient ont={ont} context={context} metricPreferences={metricPreferences} />
      )
    case 'interrupciones':
      return context.mode === 'infraco' ? null : (
        <InterruptionsCardClient ont={ont} context={context} />
      )
    case 'vecinos':
      return context.mode === 'infraco' ? null : (
        <NeighborsCardClient ont={ont} context={context} isDesktop={isDesktop} />
      )
    case 'mapa-vecinos':
      return context.mode === 'infraco' ? null : <NeighborsMapCardClient context={context} />
    case 'mapa-infraco':
      return <InfracoMapCardClient ont={ont} context={context} />
    default:
      return null
  }
}
