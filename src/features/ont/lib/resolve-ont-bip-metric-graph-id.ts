export type OntBipMetricGraphId = 'ont-bip-us' | 'ont-bip-ds'

function normalizeLabel(title: string): string {
  return title.trim().toLowerCase().replace(/\s+/g, ' ')
}

/** Resuelve el graphId histórico para tarjetas de métricas BIP (US / DS). */
export function resolveOntBipMetricGraphId(title: string): OntBipMetricGraphId | null {
  const normalized = normalizeLabel(title)

  if (normalized === 'ont bip us' || (normalized.includes('bip') && normalized.includes('us'))) {
    return 'ont-bip-us'
  }

  if (normalized === 'ont bip ds' || (normalized.includes('bip') && normalized.includes('ds'))) {
    return 'ont-bip-ds'
  }

  return null
}
