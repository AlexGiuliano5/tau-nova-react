export type OntInfoScreenViewport = 'desktop' | 'mobile'
export type OntInfoScreenViewMode = 'normal' | 'infraco'

export type OntInfoCardId =
  | 'alertas'
  | 'cliente'
  | 'info'
  | 'metricas'
  | 'interrupciones'
  | 'vecinos'
  | 'mapa-vecinos'
  | 'mapa-infraco'

export type OntInfoCardSpan = 'third' | 'half' | 'two-thirds' | 'full'
export type OntInfoCardAvailability = 'always' | 'normal' | 'infraco'

export interface OntInfoCardDefinition {
  id: OntInfoCardId
  label: string
  span: OntInfoCardSpan
  availableIn: OntInfoCardAvailability
}

export interface OntInfoOrderItem {
  id: string
  label: string
  visible: boolean
  span?: OntInfoCardSpan
}

export interface OntInfoScreenLayoutStoredItem {
  id: OntInfoCardId
  visible: boolean
}

export interface OntInfoScreenLayoutStoredMetricItem {
  id: string
  visible: boolean
}

export interface OntInfoScreenLayoutPreferences {
  version: 1
  desktop: OntInfoScreenLayoutStoredItem[]
  mobile: OntInfoScreenLayoutStoredItem[]
  infracoDesktop: OntInfoScreenLayoutStoredItem[]
  infracoMobile: OntInfoScreenLayoutStoredItem[]
  metricsDesktop: OntInfoScreenLayoutStoredMetricItem[]
  metricsMobile: OntInfoScreenLayoutStoredMetricItem[]
  metricsInfracoDesktop: OntInfoScreenLayoutStoredMetricItem[]
  metricsInfracoMobile: OntInfoScreenLayoutStoredMetricItem[]
}

export interface OntInfoScreenLayoutDraft {
  desktop: OntInfoOrderItem[]
  mobile: OntInfoOrderItem[]
  infracoDesktop: OntInfoOrderItem[]
  infracoMobile: OntInfoOrderItem[]
  metricsDesktop: OntInfoOrderItem[]
  metricsMobile: OntInfoOrderItem[]
  metricsInfracoDesktop: OntInfoOrderItem[]
  metricsInfracoMobile: OntInfoOrderItem[]
}

export const ONT_INFO_LAYOUT_SISTEMA = 'TAU Nova' as const
export const ONT_INFO_LAYOUT_ELEMENTO = 'Pantalla ONT' as const
export const ONT_INFO_LAYOUT_OPCION = 'layout' as const

export function resolveOntInfoCardsPreferenceKey(
  viewport: OntInfoScreenViewport,
  viewMode: OntInfoScreenViewMode,
): 'desktop' | 'mobile' | 'infracoDesktop' | 'infracoMobile' {
  if (viewMode === 'infraco') {
    return viewport === 'desktop' ? 'infracoDesktop' : 'infracoMobile'
  }
  return viewport === 'desktop' ? 'desktop' : 'mobile'
}

export function resolveOntInfoMetricsPreferenceKey(
  viewport: OntInfoScreenViewport,
  viewMode: OntInfoScreenViewMode,
):
  | 'metricsDesktop'
  | 'metricsMobile'
  | 'metricsInfracoDesktop'
  | 'metricsInfracoMobile' {
  if (viewMode === 'infraco') {
    return viewport === 'desktop' ? 'metricsInfracoDesktop' : 'metricsInfracoMobile'
  }
  return viewport === 'desktop' ? 'metricsDesktop' : 'metricsMobile'
}
