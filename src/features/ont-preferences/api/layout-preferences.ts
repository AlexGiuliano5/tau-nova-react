import { useAuthStore } from '@/features/auth/store/auth-store'
import { buildDefaultLayoutDraft } from '@/features/ont-preferences/lib/defaults'
import type {
  OntInfoOrderItem,
  OntInfoScreenLayoutDraft,
  OntInfoScreenLayoutPreferences,
  OntInfoScreenLayoutStoredItem,
  OntInfoScreenLayoutStoredMetricItem,
} from '@/features/ont-preferences/types/layout'
import {
  ONT_INFO_LAYOUT_ELEMENTO,
  ONT_INFO_LAYOUT_OPCION,
  ONT_INFO_LAYOUT_SISTEMA,
} from '@/features/ont-preferences/types/layout'
import { ontInfoScreenCards } from '@/features/ont-preferences/lib/defaults'
import { parseJsonResponse } from '@/shared/api/bff'
import { apiFetch } from '@/shared/api/http'

function draftToStored(draft: OntInfoScreenLayoutDraft): OntInfoScreenLayoutPreferences {
  const toCards = (items: OntInfoOrderItem[]): OntInfoScreenLayoutStoredItem[] =>
    items
      .filter((item): item is OntInfoOrderItem & { id: OntInfoScreenLayoutStoredItem['id'] } =>
        ontInfoScreenCards.some((card) => card.id === item.id),
      )
      .map((item) => ({
        id: item.id as OntInfoScreenLayoutStoredItem['id'],
        visible: item.visible,
      }))

  const toMetrics = (items: OntInfoOrderItem[]): OntInfoScreenLayoutStoredMetricItem[] =>
    items.map((item) => ({ id: item.id, visible: item.visible }))

  return {
    version: 1,
    desktop: toCards(draft.desktop),
    mobile: toCards(draft.mobile),
    infracoDesktop: toCards(draft.infracoDesktop),
    infracoMobile: toCards(draft.infracoMobile),
    metricsDesktop: toMetrics(draft.metricsDesktop),
    metricsMobile: toMetrics(draft.metricsMobile),
    metricsInfracoDesktop: toMetrics(draft.metricsInfracoDesktop),
    metricsInfracoMobile: toMetrics(draft.metricsInfracoMobile),
  }
}

function mergeStoredIntoDraft(
  defaults: OntInfoScreenLayoutDraft,
  stored: Partial<OntInfoScreenLayoutPreferences> | null,
): OntInfoScreenLayoutDraft {
  if (!stored) return defaults

  const mergeCards = (
    defaultItems: OntInfoOrderItem[],
    storedItems: OntInfoScreenLayoutStoredItem[] | undefined,
  ): OntInfoOrderItem[] => {
    if (!storedItems?.length) return defaultItems
    const byId = new Map(defaultItems.map((item) => [item.id, item]))
    const ordered: OntInfoOrderItem[] = []
    for (const storedItem of storedItems) {
      const base = byId.get(storedItem.id)
      if (!base) continue
      ordered.push({ ...base, visible: storedItem.visible })
      byId.delete(storedItem.id)
    }
    for (const remaining of byId.values()) ordered.push(remaining)
    return ordered
  }

  const mergeMetrics = (
    defaultItems: OntInfoOrderItem[],
    storedItems: OntInfoScreenLayoutStoredMetricItem[] | undefined,
  ): OntInfoOrderItem[] => {
    if (!storedItems?.length) return defaultItems
    const byId = new Map(defaultItems.map((item) => [item.id, item]))
    const ordered: OntInfoOrderItem[] = []
    for (const storedItem of storedItems) {
      const base = byId.get(storedItem.id)
      if (!base) continue
      ordered.push({ ...base, visible: storedItem.visible })
      byId.delete(storedItem.id)
    }
    for (const remaining of byId.values()) ordered.push(remaining)
    return ordered
  }

  return {
    desktop: mergeCards(defaults.desktop, stored.desktop),
    mobile: mergeCards(defaults.mobile, stored.mobile),
    infracoDesktop: mergeCards(defaults.infracoDesktop, stored.infracoDesktop),
    infracoMobile: mergeCards(defaults.infracoMobile, stored.infracoMobile),
    metricsDesktop: mergeMetrics(defaults.metricsDesktop, stored.metricsDesktop),
    metricsMobile: mergeMetrics(defaults.metricsMobile, stored.metricsMobile),
    metricsInfracoDesktop: mergeMetrics(
      defaults.metricsInfracoDesktop,
      stored.metricsInfracoDesktop,
    ),
    metricsInfracoMobile: mergeMetrics(defaults.metricsInfracoMobile, stored.metricsInfracoMobile),
  }
}

export async function loadOntInfoLayoutDraft(
  signal?: AbortSignal,
): Promise<OntInfoScreenLayoutDraft> {
  const defaults = buildDefaultLayoutDraft()
  const { user } = useAuthStore.getState()
  const legajo = user?.legajo?.trim()
  if (!legajo) return defaults

  const response = await apiFetch('/api/services/preferences/byUser', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      legajo,
      sistema: ONT_INFO_LAYOUT_SISTEMA,
      elemento: ONT_INFO_LAYOUT_ELEMENTO,
      opcion: ONT_INFO_LAYOUT_OPCION,
    }),
    signal,
  })

  if (!response.ok) return defaults

  const parsed = await parseJsonResponse(response)
  if (!parsed || typeof parsed !== 'object') return defaults

  const raw = parsed as Record<string, unknown>
  const rawTiene = raw.tienePreferencia ?? raw.TienePreferencia
  const tiene =
    rawTiene === true || rawTiene === 1 || rawTiene === '1' || rawTiene === 'true'
  if (!tiene) return defaults

  const rawValor = raw.valor ?? raw.Valor
  const valor =
    typeof rawValor === 'string'
      ? rawValor
      : rawValor && typeof rawValor === 'object'
        ? JSON.stringify(rawValor)
        : ''

  if (!valor) return defaults

  try {
    const stored = JSON.parse(valor) as Partial<OntInfoScreenLayoutPreferences>
    return mergeStoredIntoDraft(defaults, stored)
  } catch {
    return defaults
  }
}

export async function saveOntInfoLayoutDraft(
  draft: OntInfoScreenLayoutDraft,
): Promise<{ ok: boolean; error?: 'auth' | 'unknown' }> {
  const { user } = useAuthStore.getState()
  const legajo = user?.legajo?.trim()
  if (!legajo) return { ok: false, error: 'auth' }

  const stored = draftToStored(draft)
  const response = await apiFetch('/api/services/preferences/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      legajo,
      sistema: ONT_INFO_LAYOUT_SISTEMA,
      elemento: ONT_INFO_LAYOUT_ELEMENTO,
      opcion: ONT_INFO_LAYOUT_OPCION,
      valor: JSON.stringify(stored),
    }),
  })

  if (response.status === 204 || response.status === 401 || response.status === 403) {
    return { ok: false, error: 'auth' }
  }
  if (!response.ok) return { ok: false, error: 'unknown' }
  return { ok: true }
}
