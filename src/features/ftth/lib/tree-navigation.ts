import type { TreeNode } from '@/features/ftth/types/tree'

export const LEVEL_KEYS = ['pais', 'region', 'subregion', 'hub', 'olt'] as const
export type LevelKey = (typeof LEVEL_KEYS)[number]

export interface TreeNavigatorViewModel {
  breadcrumbTitle: string
  backHref: string
  nodesToRender: TreeNode[]
  nextKey: LevelKey | undefined
  selectedByKey: Partial<Record<LevelKey, string>>
}

export function buildHref(values: Partial<Record<LevelKey, string>>): string {
  const params = new URLSearchParams()
  for (const key of LEVEL_KEYS) {
    const value = values[key]
    if (value) params.set(key, value)
  }
  const query = params.toString()
  return query ? `/ftth/busqueda/arbol?${query}` : '/ftth/busqueda/arbol'
}

export function buildOltHref(oltName: string): string {
  return `/ftth/olt/${encodeURIComponent(oltName)}`
}

export function buildOltPlacaPuertoHref(olt: string, placa: number, puerto: number): string {
  return `/ftth/olt/${encodeURIComponent(olt)}/placa/${placa}/puerto/${puerto}`
}

export function buildNextLevelHref(
  selectedByKey: Partial<Record<LevelKey, string>>,
  nextKey: LevelKey,
  nextValue: string,
): string {
  return buildHref({ ...selectedByKey, [nextKey]: nextValue })
}

function getSelectedNodeName(searchParams: URLSearchParams, key: LevelKey): string | null {
  const value = searchParams.get(key)?.trim()
  return value ? value : null
}

function buildBreadcrumbTitle(path: string[]): string {
  if (path.length >= 3) return `... / ${path[path.length - 2]} / ${path[path.length - 1]}`
  if (path.length === 2) return `${path[0]} / ${path[1]}`
  if (path.length === 1) return path[0]
  return 'Búsqueda de árbol'
}

export function buildViewModel(
  tree: TreeNode[],
  searchParams: URLSearchParams,
): TreeNavigatorViewModel {
  if (!tree.length) {
    return {
      breadcrumbTitle: 'Búsqueda de árbol',
      backHref: '/ftth/busqueda',
      nodesToRender: [],
      nextKey: LEVEL_KEYS[0],
      selectedByKey: {},
    }
  }

  let currentNodes = tree
  const selectedByKey: Partial<Record<LevelKey, string>> = {}
  const selectedPath: string[] = []

  for (const key of LEVEL_KEYS) {
    const selectedValue = getSelectedNodeName(searchParams, key)
    if (!selectedValue) break

    const matchedNode = currentNodes.find((node) => node.name === selectedValue)
    if (!matchedNode) break

    selectedByKey[key] = matchedNode.name
    selectedPath.push(matchedNode.name)
    currentNodes = matchedNode.childs ?? []
  }

  const selectedCount = selectedPath.length
  const nextKey = LEVEL_KEYS[selectedCount]

  const previousValues: Partial<Record<LevelKey, string>> = {}
  for (let index = 0; index < Math.max(selectedCount - 1, 0); index += 1) {
    const key = LEVEL_KEYS[index]
    previousValues[key] = selectedByKey[key]
  }
  const backHref = selectedCount > 0 ? buildHref(previousValues) : '/ftth/busqueda'

  return {
    breadcrumbTitle: buildBreadcrumbTitle(selectedPath),
    backHref,
    nodesToRender: currentNodes,
    nextKey,
    selectedByKey,
  }
}
