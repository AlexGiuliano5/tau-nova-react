import { z } from 'zod'

import type { RecentNetworkElementSearch } from '@/features/ftth/types/recent-search'
import { useAuthStore } from '@/features/auth/store/auth-store'
import { parseJsonResponse } from '@/shared/api/bff'
import { apiFetch } from '@/shared/api/http'

const PREFERENCE_CONTEXT = {
  sistema: 'TAU Nova',
  elemento: 'Busqueda',
  opcion: 'BusquedasRecientes',
} as const

const MAX_RECENT_SEARCHES = 5

const saveRecentSearchInputSchema = z.object({
  value: z.string().trim().min(1).max(128),
})

const storedRecentSearchSchema = z.object({
  value: z.string().trim().min(1).max(128),
  updatedAt: z.string().datetime(),
})

function parseStoredRecentSearches(rawValor: string): RecentNetworkElementSearch[] {
  if (!rawValor.trim()) return []

  try {
    const parsed = JSON.parse(rawValor) as unknown
    if (!Array.isArray(parsed)) return []

    const normalized = parsed
      .map((item) => storedRecentSearchSchema.safeParse(item))
      .filter((result): result is { success: true; data: RecentNetworkElementSearch } => result.success)
      .map((result) => result.data)
      .sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt))

    return deduplicateRecentSearches(normalized).slice(0, MAX_RECENT_SEARCHES)
  } catch {
    return []
  }
}

export async function fetchRecentNetworkElementSearches(
  signal?: AbortSignal,
): Promise<RecentNetworkElementSearch[]> {
  const { token, user } = useAuthStore.getState()
  const legajo = user?.legajo?.trim()
  if (!token || !legajo) return []

  try {
    const response = await apiFetch('/api/services/preferences/byUser', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ legajo, ...PREFERENCE_CONTEXT }),
      signal,
    })

    if (!response.ok) return []

    const parsed = await parseJsonResponse(response)
    if (!parsed || typeof parsed !== 'object') return []

    const raw = parsed as Record<string, unknown>
    const rawValor = raw.valor ?? raw.Valor
    const valor =
      typeof rawValor === 'string'
        ? rawValor
        : rawValor && typeof rawValor === 'object'
          ? JSON.stringify(rawValor)
          : ''

    const rawTiene =
      raw.tienePreferencia ?? raw.TienePreferencia ?? raw.tiene_preferencia
    const tienePreferencia =
      rawTiene === true || rawTiene === 1 || rawTiene === '1' || rawTiene === 'true'

    if (!tienePreferencia || !valor) return []
    return parseStoredRecentSearches(valor)
  } catch {
    return []
  }
}

export async function saveRecentNetworkElementSearch(input: {
  value: string
}): Promise<{ ok: boolean; error?: 'auth' | 'validation' | 'unknown' }> {
  const parsedInput = saveRecentSearchInputSchema.safeParse(input)
  if (!parsedInput.success) return { ok: false, error: 'validation' }

  const legajo = useAuthStore.getState().user?.legajo?.trim()
  if (!legajo) return { ok: false, error: 'auth' }

  try {
    const currentSearches = await fetchRecentNetworkElementSearches()
    const updatedSearches = upsertRecentSearch(currentSearches, parsedInput.data.value)

    const response = await apiFetch('/api/services/preferences/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        legajo,
        ...PREFERENCE_CONTEXT,
        valor: JSON.stringify(updatedSearches),
      }),
    })

    if (response.status === 204 || response.status === 401 || response.status === 403) {
      return { ok: false, error: 'auth' }
    }
    if (!response.ok) return { ok: false, error: 'unknown' }
    return { ok: true }
  } catch {
    return { ok: false, error: 'unknown' }
  }
}

function upsertRecentSearch(
  currentSearches: RecentNetworkElementSearch[],
  rawValue: string,
): RecentNetworkElementSearch[] {
  const now = new Date().toISOString()
  const value = rawValue.trim()
  const normalizedValue = normalizeRecentSearchValue(value)

  const withoutCurrentValue = currentSearches.filter(
    (search) => normalizeRecentSearchValue(search.value) !== normalizedValue,
  )

  return deduplicateRecentSearches([{ value, updatedAt: now }, ...withoutCurrentValue]).slice(
    0,
    MAX_RECENT_SEARCHES,
  )
}

function deduplicateRecentSearches(
  searches: RecentNetworkElementSearch[],
): RecentNetworkElementSearch[] {
  const seen = new Set<string>()
  const deduplicated: RecentNetworkElementSearch[] = []

  for (const search of searches) {
    const normalized = normalizeRecentSearchValue(search.value)
    if (!normalized || seen.has(normalized)) continue
    seen.add(normalized)
    deduplicated.push(search)
  }

  return deduplicated.sort(
    (left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt),
  )
}

function normalizeRecentSearchValue(value: string): string {
  return value.trim().toLocaleLowerCase('es-AR')
}
