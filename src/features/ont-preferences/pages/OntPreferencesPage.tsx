import clsx from 'clsx'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { IoDesktopOutline, IoPhonePortraitOutline } from 'react-icons/io5'

import {
  loadOntInfoLayoutDraft,
  saveOntInfoLayoutDraft,
} from '@/features/ont-preferences/api/layout-preferences'
import { OntCapaControlOrderEditor } from '@/features/ont-preferences/components/OntCapaControlOrderEditor'
import { OntInfoLayoutPreview } from '@/features/ont-preferences/components/OntInfoLayoutPreview'
import { OntInfoOrderEditor } from '@/features/ont-preferences/components/OntInfoOrderEditor'
import { PreferencesSaveFeedback } from '@/features/ont-preferences/components/PreferencesSaveFeedback'
import { PreferencesSectionPanel } from '@/features/ont-preferences/components/PreferencesSectionPanel'
import { normalizeOntInfoCardItemsOrder } from '@/features/ont-preferences/lib/card-order'
import {
  buildDefaultCapaMetricItems,
  buildDefaultLayoutDraft,
  buildDefaultOpticalMetricItems,
  buildDefaultOntInfoCardOrderItems,
} from '@/features/ont-preferences/lib/defaults'
import type {
  OntInfoOrderItem,
  OntInfoScreenLayoutDraft,
  OntInfoScreenViewMode,
  OntInfoScreenViewport,
} from '@/features/ont-preferences/types/layout'
import {
  resolveOntInfoCardsPreferenceKey,
  resolveOntInfoMetricsPreferenceKey,
} from '@/features/ont-preferences/types/layout'

const segmentedGroupClass =
  'grid rounded-xl border border-black/8 bg-(--background) p-1 dark:border-white/10'

const segmentedOptionClass =
  'inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors sm:text-sm'

const segmentedActiveClass =
  'bg-(--card) text-(--primary) shadow-[0_1px_3px_rgb(15_23_42/0.08)] dark:bg-(--secondary)/20 dark:text-(--secondary) dark:shadow-[0_1px_4px_rgb(0_0_0/0.35)]'

const segmentedIdleClass =
  'text-(--text-secondary) hover:text-(--text-primary) dark:hover:text-white'

const saveSpinnerMinVisibleMs = 400

type SaveMessage = {
  type: 'success' | 'error'
  text: string
}

function resolveSaveErrorMessage(error?: 'auth' | 'validation' | 'unknown' | 'network'): string {
  if (error === 'auth') {
    return 'Tu sesión expiró. Volvé a iniciar sesión e intentá de nuevo.'
  }
  if (error === 'validation') {
    return 'Las preferencias no son válidas. Revisá la configuración e intentá de nuevo.'
  }
  if (error === 'network') {
    return 'No pudimos conectar con el servidor. Verificá tu red e intentá de nuevo.'
  }
  return 'No pudimos guardar las preferencias. Intentá de nuevo.'
}

export function OntPreferencesPage() {
  const [draft, setDraft] = useState<OntInfoScreenLayoutDraft>(() => buildDefaultLayoutDraft())
  const [isLoaded, setIsLoaded] = useState(false)
  const [activeViewport, setActiveViewport] = useState<OntInfoScreenViewport>('desktop')
  const [viewMode, setViewMode] = useState<OntInfoScreenViewMode>('normal')
  const [saveMessage, setSaveMessage] = useState<SaveMessage | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isMdUp, setIsMdUp] = useState(true)

  useEffect(() => {
    const media = window.matchMedia('(min-width: 768px)')
    const onChange = () => setIsMdUp(media.matches)
    onChange()
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    if (!isMdUp) setActiveViewport('mobile')
  }, [isMdUp])

  useEffect(() => {
    const controller = new AbortController()
    void (async () => {
      const next = await loadOntInfoLayoutDraft(controller.signal)
      if (controller.signal.aborted) return
      setDraft(next)
      setIsLoaded(true)
    })()
    return () => controller.abort()
  }, [])

  const activeCardItems = useMemo(() => {
    const key = resolveOntInfoCardsPreferenceKey(activeViewport, viewMode)
    return draft[key]
  }, [activeViewport, draft, viewMode])

  const defaultCardItems = useMemo(
    () => buildDefaultOntInfoCardOrderItems(activeViewport, viewMode),
    [activeViewport, viewMode],
  )

  const activeMetricItems = useMemo(() => {
    const key = resolveOntInfoMetricsPreferenceKey(activeViewport, viewMode)
    return draft[key]
  }, [activeViewport, draft, viewMode])

  const defaultOpticalMetricItems = useMemo(
    () => buildDefaultOpticalMetricItems(viewMode),
    [viewMode],
  )
  const defaultCapaMetricItems = useMemo(() => buildDefaultCapaMetricItems(), [])

  const opticalMetricEditorItems = useMemo(() => {
    const defaults = buildDefaultOpticalMetricItems(viewMode)
    const defaultIds = new Set(defaults.map((item) => item.id))
    const known = activeMetricItems.filter((item) => defaultIds.has(item.id))
    const knownIds = new Set(known.map((item) => item.id))
    const missing = defaults.filter((item) => !knownIds.has(item.id))
    return [...known, ...missing]
  }, [activeMetricItems, viewMode])

  const capaMetricEditorItems = useMemo(() => {
    if (viewMode === 'infraco') return null
    const defaults = buildDefaultCapaMetricItems()
    const defaultIds = new Set(defaults.map((item) => item.id))
    const known = activeMetricItems.filter((item) => defaultIds.has(item.id))
    const knownIds = new Set(known.map((item) => item.id))
    const missing = defaults.filter((item) => !knownIds.has(item.id))
    return [...known, ...missing]
  }, [activeMetricItems, viewMode])

  const metricsCardVisible = activeCardItems.some(
    (item) => item.id === 'metricas' && item.visible,
  )

  const updateActiveCardItems = useCallback(
    (items: OntInfoOrderItem[]) => {
      const cardsKey = resolveOntInfoCardsPreferenceKey(activeViewport, viewMode)
      setDraft((current) => ({
        ...current,
        [cardsKey]: normalizeOntInfoCardItemsOrder(items),
      }))
    },
    [activeViewport, viewMode],
  )

  const updateOpticalMetricItems = useCallback(
    (items: OntInfoOrderItem[]) => {
      const metricsKey = resolveOntInfoMetricsPreferenceKey(activeViewport, 'normal')
      setDraft((current) => {
        const currentMetrics = current[metricsKey]
        const capa = currentMetrics.filter((item) =>
          buildDefaultCapaMetricItems().some((capaItem) => capaItem.id === item.id),
        )
        return { ...current, [metricsKey]: [...items, ...capa] }
      })
    },
    [activeViewport],
  )

  const updateCapaMetricItems = useCallback(
    (items: OntInfoOrderItem[]) => {
      const metricsKey = resolveOntInfoMetricsPreferenceKey(activeViewport, 'normal')
      setDraft((current) => {
        const currentMetrics = current[metricsKey]
        const optical = currentMetrics.filter((item) =>
          buildDefaultOpticalMetricItems('normal').some((opt) => opt.id === item.id),
        )
        return { ...current, [metricsKey]: [...optical, ...items] }
      })
    },
    [activeViewport],
  )

  const updateMetricItemsForInfraco = useCallback(
    (items: OntInfoOrderItem[]) => {
      const metricsKey = resolveOntInfoMetricsPreferenceKey(activeViewport, 'infraco')
      setDraft((current) => ({ ...current, [metricsKey]: items }))
    },
    [activeViewport],
  )

  const handleSave = () => {
    if (isSaving) return

    void (async () => {
      setIsSaving(true)
      setSaveMessage(null)
      const startedAt = Date.now()

      try {
        const result = await saveOntInfoLayoutDraft(draft)
        const elapsed = Date.now() - startedAt
        if (elapsed < saveSpinnerMinVisibleMs) {
          await new Promise((resolve) => {
            window.setTimeout(resolve, saveSpinnerMinVisibleMs - elapsed)
          })
        }

        if (!result.ok) {
          setSaveMessage({
            type: 'error',
            text: resolveSaveErrorMessage(result.error),
          })
          return
        }

        setSaveMessage({
          type: 'success',
          text: 'Se sincronizaron con tu cuenta y ya aplican en la pantalla ONT.',
        })
        window.setTimeout(() => setSaveMessage(null), 5000)
      } finally {
        setIsSaving(false)
      }
    })()
  }

  const resetToDefaults = () => {
    setDraft(buildDefaultLayoutDraft())
    setSaveMessage(null)
  }

  return (
    <>
      {saveMessage ? (
        <PreferencesSaveFeedback
          type={saveMessage.type}
          message={saveMessage.text}
          onDismiss={() => setSaveMessage(null)}
        />
      ) : null}

      <PreferencesSectionPanel
        title="Pantalla ONT"
        description="Orden y visibilidad de cards y métricas en la pestaña Información."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={resetToDefaults}
              className="inline-flex h-10 cursor-pointer items-center justify-center rounded-xl border border-(--outline) bg-(--card) px-4 text-sm font-semibold text-(--text-primary) transition-colors hover:bg-black/4 dark:border-white/15 dark:hover:bg-white/8"
            >
              Restablecer todo
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!isLoaded || isSaving}
              aria-busy={isSaving}
              className={clsx(
                'inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-60',
                isSaving
                  ? 'cursor-wait bg-(--primary)/70 opacity-80 dark:bg-(--secondary)/70'
                  : 'cursor-pointer bg-(--primary) dark:bg-(--secondary)',
              )}
            >
              {isSaving ? (
                <>
                  <span
                    aria-hidden="true"
                    className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
                  />
                  Guardando…
                </>
              ) : (
                'Guardar'
              )}
            </button>
          </div>
        }
      >
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
          {!isLoaded ? (
            <div className="flex min-h-[240px] items-center justify-center text-sm text-(--text-secondary)">
              Cargando preferencias
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-3">
                {isMdUp ? (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-(--text-secondary)">
                      Viewport
                    </p>
                    <div className={clsx(segmentedGroupClass, 'mt-2 grid-cols-2')}>
                      <button
                        type="button"
                        onClick={() => setActiveViewport('desktop')}
                        aria-pressed={activeViewport === 'desktop'}
                        className={clsx(
                          segmentedOptionClass,
                          activeViewport === 'desktop'
                            ? segmentedActiveClass
                            : segmentedIdleClass,
                        )}
                      >
                        <IoDesktopOutline size={16} />
                        Desktop
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveViewport('mobile')}
                        aria-pressed={activeViewport === 'mobile'}
                        className={clsx(
                          segmentedOptionClass,
                          activeViewport === 'mobile'
                            ? segmentedActiveClass
                            : segmentedIdleClass,
                        )}
                      >
                        <IoPhonePortraitOutline size={16} />
                        Mobile
                      </button>
                    </div>
                  </div>
                ) : null}

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-(--text-secondary)">
                    Modo ONT
                  </p>
                  <div className={clsx(segmentedGroupClass, 'mt-2 grid-cols-2')}>
                    <button
                      type="button"
                      onClick={() => setViewMode('normal')}
                      aria-pressed={viewMode === 'normal'}
                      className={clsx(
                        segmentedOptionClass,
                        viewMode === 'normal' ? segmentedActiveClass : segmentedIdleClass,
                      )}
                    >
                      Normal
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('infraco')}
                      aria-pressed={viewMode === 'infraco'}
                      className={clsx(
                        segmentedOptionClass,
                        viewMode === 'infraco' ? segmentedActiveClass : segmentedIdleClass,
                      )}
                    >
                      Infraco
                    </button>
                  </div>
                </div>
              </div>

              <OntInfoLayoutPreview
                viewport={activeViewport}
                items={activeCardItems}
                defaultItems={defaultCardItems}
                onChange={updateActiveCardItems}
              />

              {metricsCardVisible ? (
                <div className="flex flex-col gap-4">
                  <OntInfoOrderEditor
                    title="Métricas ópticas"
                    description=""
                    viewport={activeViewport}
                    items={opticalMetricEditorItems}
                    defaultItems={defaultOpticalMetricItems}
                    onChange={
                      viewMode === 'infraco'
                        ? updateMetricItemsForInfraco
                        : updateOpticalMetricItems
                    }
                  />

                  {capaMetricEditorItems ? (
                    <OntCapaControlOrderEditor
                      viewport={activeViewport}
                      items={capaMetricEditorItems}
                      defaultItems={defaultCapaMetricItems}
                      onChange={updateCapaMetricItems}
                    />
                  ) : null}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-black/12 px-4 py-5 text-sm text-(--text-secondary) dark:border-white/15">
                  Activá la card{' '}
                  <span className="font-semibold text-(--text-primary)">Métricas</span> para
                  configurar las métricas individuales.
                </div>
              )}
            </>
          )}
        </div>
      </PreferencesSectionPanel>
    </>
  )
}
