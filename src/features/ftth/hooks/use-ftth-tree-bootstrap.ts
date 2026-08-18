import { useEffect } from 'react'

import { fetchTreeFtthByUser } from '@/features/ftth/api/tree'
import {
  getTreeFromLocalStorage,
  isValidTreeData,
  saveTreeToLocalStorage,
} from '@/features/ftth/lib/tree-cache'
import { useFtthTreeStore } from '@/features/ftth/stores/tree-store'

/**
 * Hidrata el árbol FTTH (store + localStorage + BFF) para topología y búsqueda de árbol.
 */
export function useFtthTreeBootstrap() {
  const setTreeData = useFtthTreeStore((state) => state.setTreeData)

  useEffect(() => {
    const controller = new AbortController()
    let active = true

    const hydrateFromCache = () => {
      const storeTree = useFtthTreeStore.getState().treeData
      if (isValidTreeData(storeTree)) return true
      const cached = getTreeFromLocalStorage()
      if (isValidTreeData(cached)) {
        setTreeData(cached)
        return true
      }
      return false
    }

    void (async () => {
      if (hydrateFromCache()) return
      try {
        const payload = await fetchTreeFtthByUser(controller.signal)
        if (!active) return
        if (isValidTreeData(payload)) {
          setTreeData(payload)
          saveTreeToLocalStorage(payload)
        }
      } catch {
        if (active) hydrateFromCache()
      }
    })()

    return () => {
      active = false
      controller.abort()
    }
  }, [setTreeData])
}
