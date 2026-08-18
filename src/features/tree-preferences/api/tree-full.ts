import type { BffTreeResponse, TreeNode } from '@/features/ftth/types/tree'
import { isValidTreeData } from '@/features/ftth/lib/tree-cache'
import { parseJsonResponse } from '@/shared/api/bff'
import { apiFetch } from '@/shared/api/http'

const TREE_FULL_ENDPOINT = '/api/services/portal/getTreeFtthElementsAsArrayMap'

export type TreeFullResult =
  | { ok: true; data: BffTreeResponse }
  | { ok: false; error: 'auth' | 'empty' | 'unknown' }

export async function fetchTreeFtthFull(signal?: AbortSignal): Promise<TreeFullResult> {
  try {
    const response = await apiFetch(TREE_FULL_ENDPOINT, {
      method: 'GET',
      signal,
    })

    if (response.status === 204) return { ok: false, error: 'auth' }
    if (response.status === 202 || !response.ok) return { ok: false, error: 'unknown' }

    const raw = await parseJsonResponse(response)
    if (!raw || typeof raw !== 'object') return { ok: false, error: 'empty' }

    const source = raw as Partial<BffTreeResponse>
    if (!Array.isArray(source.tree) || source.tree.length === 0) {
      return { ok: false, error: 'empty' }
    }

    const data: BffTreeResponse = {
      tree: normalizeTreeNodes(source.tree),
      treeArray: Array.isArray(source.treeArray) ? source.treeArray : [],
    }

    if (!isValidTreeData(data)) return { ok: false, error: 'empty' }
    return { ok: true, data }
  } catch {
    return { ok: false, error: 'unknown' }
  }
}

function normalizeTreeNodes(rawNodes: unknown[]): TreeNode[] {
  const nodes: TreeNode[] = []
  for (const rawNode of rawNodes) {
    if (!rawNode || typeof rawNode !== 'object') continue
    const source = rawNode as { name?: unknown; childs?: unknown }
    const name = typeof source.name === 'string' ? source.name.trim() : ''
    if (!name) continue
    const childsRaw = Array.isArray(source.childs) ? source.childs : []
    nodes.push({
      name,
      childs: normalizeTreeNodes(childsRaw),
    })
  }
  return nodes
}
