import type { BffTreeResponse } from '@/features/ftth/types/tree'

const TREE_CACHE_KEY = 'tau_ftth_tree_v1'

export function isValidTreeData(data: unknown): data is BffTreeResponse {
  if (!data || typeof data !== 'object') return false
  const tree = (data as BffTreeResponse).tree
  return Array.isArray(tree) && tree.length > 0
}

export function getTreeFromLocalStorage(): BffTreeResponse | null {
  try {
    const raw = localStorage.getItem(TREE_CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    return isValidTreeData(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function saveTreeToLocalStorage(data: BffTreeResponse): void {
  try {
    localStorage.setItem(TREE_CACHE_KEY, JSON.stringify(data))
  } catch {
    // ignore
  }
}

export function clearTreeFromLocalStorage(): void {
  try {
    localStorage.removeItem(TREE_CACHE_KEY)
  } catch {
    // ignore
  }
}
