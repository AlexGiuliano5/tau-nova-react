import { useEffect, useState } from 'react'

import { useAuthStore } from '@/features/auth/store/auth-store'
import { PreferencesSectionPanel } from '@/features/ont-preferences/components/PreferencesSectionPanel'
import { loadFtthTreePreferences } from '@/features/tree-preferences/api/tree-preferences'
import { FtthTreePreferencesPanel } from '@/features/tree-preferences/components/FtthTreePreferencesPanel'
import type { FtthTreePreferencesLoadResult } from '@/features/tree-preferences/types'

export function FtthTreePreferencesPage() {
  const legajo = useAuthStore((state) => state.user?.legajo?.trim() ?? '')
  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState<FtthTreePreferencesLoadResult | null>(null)

  useEffect(() => {
    if (!legajo) {
      setResult({ ok: false, error: 'auth' })
      setLoading(false)
      return
    }

    const controller = new AbortController()
    let active = true

    void (async () => {
      setLoading(true)
      try {
        const next = await loadFtthTreePreferences(legajo, controller.signal)
        if (active) setResult(next)
      } catch {
        if (active) setResult({ ok: false, error: 'unknown' })
      } finally {
        if (active) setLoading(false)
      }
    })()

    return () => {
      active = false
      controller.abort()
    }
  }, [legajo])

  if (loading) {
    return (
      <PreferencesSectionPanel
        title="Árbol FTTH"
        description="Elegí qué regiones querés ver en el menú de topología."
      >
        <div
          className="flex min-h-[280px] items-center justify-center"
          aria-busy="true"
          aria-live="polite"
        >
          <div className="flex flex-col items-center gap-3 text-sm text-(--text-secondary)">
            <span className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-(--primary-2) border-t-transparent dark:border-(--secondary)" />
            Cargando preferencias de árbol…
          </div>
        </div>
      </PreferencesSectionPanel>
    )
  }

  if (!result || !result.ok) {
    return (
      <PreferencesSectionPanel
        title="Árbol FTTH"
        description="Elegí qué regiones querés ver en el menú de topología."
      >
        <PreferencesTreeLoadError error={result?.error ?? 'unknown'} />
      </PreferencesSectionPanel>
    )
  }

  return <FtthTreePreferencesPanel initialData={result} legajo={legajo} />
}

function PreferencesTreeLoadError({
  error,
}: {
  error: 'auth' | 'tree' | 'regions' | 'unknown'
}) {
  const context =
    error === 'tree'
      ? 'el árbol FTTH completo'
      : error === 'regions'
        ? 'tus preferencias de regiones'
        : error === 'auth'
          ? 'tu sesión'
          : 'la configuración del árbol FTTH'

  return (
    <div
      role="alert"
      className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300"
    >
      No pudimos cargar {context}. Intentá de nuevo en unos minutos.
    </div>
  )
}
