import { isValidTreeData } from '@/features/ftth/lib/tree-cache'
import type { BffTreeResponse } from '@/features/ftth/types/tree'
import { parseJsonResponse } from '@/shared/api/bff'
import { apiFetch } from '@/shared/api/http'

const TREE_ENDPOINT = '/api/services/portal/treeFtthByUser'

export async function fetchTreeFtthByUser(signal?: AbortSignal): Promise<BffTreeResponse | null> {
  const response = await apiFetch(TREE_ENDPOINT, {
    method: 'GET',
    signal,
  })

  if (response.status === 202 || !response.ok) {
    return null
  }

  const data = await parseJsonResponse(response)
  if (!isValidTreeData(data)) {
    return null
  }

  return {
    tree: data.tree,
    treeArray: Array.isArray(data.treeArray) ? data.treeArray : [],
  }
}
