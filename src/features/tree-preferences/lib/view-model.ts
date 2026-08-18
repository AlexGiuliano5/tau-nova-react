import type { TreeNode } from '@/features/ftth/types/tree'
import { getNodeCheckState } from '@/features/tree-preferences/lib/checkbox-selection'
import type {
  FtthHiddenRegion,
  FtthPreferencesTreeNode,
  FtthTreeCheckboxSelection,
  FtthTreePreferencesViewModel,
} from '@/features/tree-preferences/types'

const PREFERENCES_TREE_DEPTH = 3

export function buildFtthTreePreferencesViewModel(
  tree: TreeNode[],
  hiddenRegions: FtthHiddenRegion[],
): FtthTreePreferencesViewModel {
  const truncatedTree = truncateTreeLevels(tree, PREFERENCES_TREE_DEPTH)
  const nodes = mapTreeToPreferencesNodes(truncatedTree)
  const selection = buildInitialSelectionFromHiddenRegions(nodes, hiddenRegions)
  const expandedKeys = buildDefaultExpandedKeys(nodes)

  return { nodes, selection, expandedKeys }
}

export function buildHiddenRegionsPayload(
  nodes: FtthPreferencesTreeNode[],
  selection: FtthTreeCheckboxSelection,
): FtthHiddenRegion[] {
  const hiddenRegions: FtthHiddenRegion[] = []

  const visit = (node: FtthPreferencesTreeNode): void => {
    if (!node.children?.length) {
      if (!selection[node.key]?.checked) {
        hiddenRegions.push(parseRegionKey(node.key))
      }
      return
    }
    for (const child of node.children) {
      visit(child)
    }
  }

  for (const root of nodes) {
    visit(root)
  }
  return hiddenRegions
}

function truncateTreeLevels(nodes: TreeNode[], maxDepth: number): TreeNode[] {
  if (maxDepth <= 0) return []
  return nodes.map((node) => ({
    name: node.name,
    childs: maxDepth > 1 ? truncateTreeLevels(node.childs ?? [], maxDepth - 1) : [],
  }))
}

function mapTreeToPreferencesNodes(
  nodes: TreeNode[],
  path = '',
): FtthPreferencesTreeNode[] {
  return nodes.map((node) => {
    const fullPath = path ? `${path}|${node.name}` : node.name
    const childs = node.childs ?? []
    if (childs.length === 0) {
      return { key: fullPath, label: node.name }
    }
    return {
      key: fullPath,
      label: node.name,
      children: mapTreeToPreferencesNodes(childs, fullPath),
    }
  })
}

function buildInitialSelectionFromHiddenRegions(
  nodes: FtthPreferencesTreeNode[],
  hiddenRegions: FtthHiddenRegion[],
): FtthTreeCheckboxSelection {
  const hiddenSet = new Set(
    hiddenRegions.map((region) =>
      `${region.pais}|${region.region}|${region.subregion}`.toLocaleLowerCase('es-AR'),
    ),
  )

  const selection: FtthTreeCheckboxSelection = {}

  const visitLeaves = (node: FtthPreferencesTreeNode): void => {
    if (!node.children?.length) {
      selection[node.key] = {
        checked: !hiddenSet.has(node.key.toLocaleLowerCase('es-AR')),
      }
      return
    }
    for (const child of node.children) {
      visitLeaves(child)
    }
  }

  for (const root of nodes) {
    visitLeaves(root)
  }

  return recomputeParentSelection(nodes, selection)
}

function recomputeParentSelection(
  nodes: FtthPreferencesTreeNode[],
  selection: FtthTreeCheckboxSelection,
): FtthTreeCheckboxSelection {
  const nextSelection = { ...selection }

  const visit = (node: FtthPreferencesTreeNode): void => {
    for (const child of node.children ?? []) {
      visit(child)
    }
    if (!node.children?.length) return

    const state = getNodeCheckState(node, nextSelection)
    if (state === 'checked') {
      nextSelection[node.key] = { checked: true }
      return
    }
    if (state === 'unchecked') {
      nextSelection[node.key] = { checked: false }
      return
    }
    nextSelection[node.key] = { checked: false, partialChecked: true }
  }

  for (const root of nodes) {
    visit(root)
  }
  return nextSelection
}

function buildDefaultExpandedKeys(
  nodes: FtthPreferencesTreeNode[],
): Record<string, boolean> {
  const expandedKeys: Record<string, boolean> = {}

  const visit = (node: FtthPreferencesTreeNode): void => {
    if (!node.children?.length) return
    expandedKeys[node.key] = true
    for (const child of node.children) {
      visit(child)
    }
  }

  for (const root of nodes) {
    visit(root)
  }
  return expandedKeys
}

function parseRegionKey(key: string): FtthHiddenRegion {
  const parts = key.split('|')
  return {
    pais: parts[0] ?? '',
    region: parts[1] ?? '',
    subregion: parts[2] ?? '',
  }
}
