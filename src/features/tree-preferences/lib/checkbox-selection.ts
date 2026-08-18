import type {
  FtthPreferencesTreeNode,
  FtthTreeCheckboxSelection,
  FtthTreeNodeCheckState,
} from '@/features/tree-preferences/types'

function findNodeByKey(
  nodes: FtthPreferencesTreeNode[],
  key: string,
): FtthPreferencesTreeNode | null {
  for (const node of nodes) {
    if (node.key === key) return node
    if (node.children?.length) {
      const match = findNodeByKey(node.children, key)
      if (match) return match
    }
  }
  return null
}

function collectDescendantKeys(node: FtthPreferencesTreeNode): string[] {
  const keys = [node.key]
  for (const child of node.children ?? []) {
    keys.push(...collectDescendantKeys(child))
  }
  return keys
}

export function getNodeCheckState(
  node: FtthPreferencesTreeNode,
  selection: FtthTreeCheckboxSelection,
): FtthTreeNodeCheckState {
  if (!node.children?.length) {
    return selection[node.key]?.checked ? 'checked' : 'unchecked'
  }

  const childStates = node.children.map((child) => getNodeCheckState(child, selection))
  const checkedCount = childStates.filter((state) => state === 'checked').length
  const uncheckedCount = childStates.filter((state) => state === 'unchecked').length

  if (checkedCount === childStates.length) return 'checked'
  if (uncheckedCount === childStates.length) return 'unchecked'
  return 'partial'
}

function propagateSelectionUp(
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

export function toggleTreeNodeSelection(
  nodes: FtthPreferencesTreeNode[],
  selection: FtthTreeCheckboxSelection,
  nodeKey: string,
): FtthTreeCheckboxSelection {
  const node = findNodeByKey(nodes, nodeKey)
  if (!node) return selection

  const currentState = getNodeCheckState(node, selection)
  const nextChecked = currentState !== 'checked'
  const keysToUpdate = collectDescendantKeys(node)
  const nextSelection = { ...selection }

  for (const key of keysToUpdate) {
    nextSelection[key] = { checked: nextChecked }
  }

  return propagateSelectionUp(nodes, nextSelection)
}

export function countCheckedLeaves(
  nodes: FtthPreferencesTreeNode[],
  selection: FtthTreeCheckboxSelection,
): { checked: number; total: number } {
  let checked = 0
  let total = 0

  const visit = (node: FtthPreferencesTreeNode): void => {
    if (!node.children?.length) {
      total += 1
      if (selection[node.key]?.checked) checked += 1
      return
    }
    for (const child of node.children) {
      visit(child)
    }
  }

  for (const root of nodes) {
    visit(root)
  }
  return { checked, total }
}
