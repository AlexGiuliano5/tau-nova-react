import type {
  OntInfoCardDefinition,
  OntInfoCardId,
  OntInfoOrderItem,
  OntInfoScreenViewMode,
  OntInfoScreenViewport,
} from '@/features/ont-preferences/types/layout'

export const ontInfoScreenCards: OntInfoCardDefinition[] = [
  { id: 'alertas', label: 'Alertas', span: 'third', availableIn: 'always' },
  { id: 'cliente', label: 'Cliente', span: 'third', availableIn: 'always' },
  { id: 'info', label: 'Información ONT', span: 'two-thirds', availableIn: 'always' },
  { id: 'interrupciones', label: 'Interrupciones', span: 'two-thirds', availableIn: 'normal' },
  { id: 'metricas', label: 'Métricas', span: 'full', availableIn: 'always' },
  { id: 'vecinos', label: 'Vecinos', span: 'full', availableIn: 'normal' },
  { id: 'mapa-vecinos', label: 'Mapa', span: 'full', availableIn: 'normal' },
  { id: 'mapa-infraco', label: 'Mapa infraco', span: 'full', availableIn: 'infraco' },
]

const desktopDefaultOrderNormal: OntInfoCardId[] = [
  'alertas',
  'interrupciones',
  'cliente',
  'info',
  'metricas',
  'vecinos',
]

const desktopDefaultOrderInfraco: OntInfoCardId[] = [
  'alertas',
  'cliente',
  'info',
  'metricas',
  'mapa-infraco',
]

const mobileDefaultOrderNormal: OntInfoCardId[] = [
  'alertas',
  'cliente',
  'info',
  'metricas',
  'interrupciones',
  'vecinos',
  'mapa-vecinos',
]

const mobileDefaultOrderInfraco: OntInfoCardId[] = [
  'alertas',
  'cliente',
  'info',
  'metricas',
  'mapa-infraco',
]

const opticalMetrics = [
  { id: 'ont rx', label: 'ONT RX' },
  { id: 'ont tx', label: 'ONT TX' },
  { id: 'olt rx', label: 'OLT RX' },
  { id: 'olt tx', label: 'OLT TX' },
  { id: 'ont voltage', label: 'ONT Voltage' },
  { id: 'ont bip us', label: 'ONT Bip US' },
  { id: 'ont bip ds', label: 'ONT Bip DS' },
  { id: 'olt voltage', label: 'OLT Voltage' },
  { id: 'ont temperature', label: 'ONT Temperature' },
  { id: 'port temperature', label: 'PORT Temperature' },
]

const capaMetrics = [
  { id: 'capa-access', label: 'Access' },
  { id: 'capa-ip', label: 'IP' },
  { id: 'capa-portal', label: 'Portal' },
  { id: 'capa-levanto', label: 'Levantó por última vez' },
]

const infracoOpticalMetrics = [
  { id: 'ont rx', label: 'ONT RX' },
  { id: 'ont tx', label: 'ONT TX' },
  { id: 'ont voltage', label: 'ONT Voltage' },
  { id: 'ont temperature', label: 'ONT Temp Laser' },
]

function getDefaultCardOrder(
  viewport: OntInfoScreenViewport,
  viewMode: OntInfoScreenViewMode,
): OntInfoCardId[] {
  if (viewport === 'desktop') {
    return viewMode === 'infraco' ? desktopDefaultOrderInfraco : desktopDefaultOrderNormal
  }
  return viewMode === 'infraco' ? mobileDefaultOrderInfraco : mobileDefaultOrderNormal
}

export function buildDefaultOntInfoCardOrderItems(
  viewport: OntInfoScreenViewport,
  viewMode: OntInfoScreenViewMode,
): OntInfoOrderItem[] {
  const order = getDefaultCardOrder(viewport, viewMode)
  const cardsById = new Map(ontInfoScreenCards.map((card) => [card.id, card]))

  return order
    .map((cardId) => cardsById.get(cardId))
    .filter((card): card is OntInfoCardDefinition => card !== undefined)
    .filter(
      (card) =>
        card.availableIn === 'always' || card.availableIn === viewMode,
    )
    .map((card) => ({
      id: card.id,
      label: card.label,
      visible: true,
      span: card.span,
    }))
}

export function buildDefaultOpticalMetricItems(viewMode: OntInfoScreenViewMode): OntInfoOrderItem[] {
  const catalog = viewMode === 'infraco' ? infracoOpticalMetrics : opticalMetrics
  return catalog.map((metric) => ({ ...metric, visible: true }))
}

export function buildDefaultCapaMetricItems(): OntInfoOrderItem[] {
  return capaMetrics.map((metric) => ({ ...metric, visible: true }))
}

export function buildDefaultMetrics(
  viewMode: OntInfoScreenViewMode,
): OntInfoOrderItem[] {
  if (viewMode === 'infraco') {
    return buildDefaultOpticalMetricItems('infraco')
  }
  return [...buildDefaultOpticalMetricItems('normal'), ...buildDefaultCapaMetricItems()]
}

export function buildDefaultLayoutDraft() {
  return {
    desktop: buildDefaultOntInfoCardOrderItems('desktop', 'normal'),
    mobile: buildDefaultOntInfoCardOrderItems('mobile', 'normal'),
    infracoDesktop: buildDefaultOntInfoCardOrderItems('desktop', 'infraco'),
    infracoMobile: buildDefaultOntInfoCardOrderItems('mobile', 'infraco'),
    metricsDesktop: buildDefaultMetrics('normal'),
    metricsMobile: buildDefaultMetrics('normal'),
    metricsInfracoDesktop: buildDefaultMetrics('infraco'),
    metricsInfracoMobile: buildDefaultMetrics('infraco'),
  }
}

export function spanClass(span?: string): string {
  switch (span) {
    case 'third':
      return 'md:col-span-4'
    case 'half':
      return 'md:col-span-6'
    case 'two-thirds':
      return 'md:col-span-8'
    case 'full':
    default:
      return 'md:col-span-12'
  }
}
