import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { fetchRecentNetworkElementSearches } from '@/features/ftth/api/recent-searches'
import { fetchTreeFtthByUser } from '@/features/ftth/api/tree'
import { oltNamesFromTree } from '@/features/ftth/lib/olt-names'
import {
  getTreeFromLocalStorage,
  isValidTreeData,
  saveTreeToLocalStorage,
} from '@/features/ftth/lib/tree-cache'
import { useFtthTreeStore } from '@/features/ftth/stores/tree-store'
import type { BffTreeResponse } from '@/features/ftth/types/tree'
import type { RecentNetworkElementSearch } from '@/features/ftth/types/recent-search'
import { FtthDesktopHomeHero } from '@/features/ftth-home/components/FtthDesktopHomeHero'

export function FtthHomeSection() {
  const [searchParams, setSearchParams] = useSearchParams()
  const shouldRefreshTree = searchParams.get('refreshTree') === '1'
  const setTreeData = useFtthTreeStore((s) => s.setTreeData)

  const [recentSearches, setRecentSearches] = useState<RecentNetworkElementSearch[]>([])
  const [treeData, setLocalTreeData] = useState<BffTreeResponse | null>(() => {
    const storeTree = useFtthTreeStore.getState().treeData
    if (isValidTreeData(storeTree)) return storeTree
    return getTreeFromLocalStorage()
  })

  useEffect(() => {
    const controller = new AbortController()
    let active = true

    void (async () => {
      try {
        const searches = await fetchRecentNetworkElementSearches(controller.signal)
        if (active) setRecentSearches(searches)
      } catch {
        // abort / network
      }
    })()

    return () => {
      active = false
      controller.abort()
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    let active = true

    const hydrateFromCache = () => {
      const currentStoreTree = useFtthTreeStore.getState().treeData
      if (isValidTreeData(currentStoreTree)) {
        setLocalTreeData(currentStoreTree)
        return true
      }
      const cachedTree = getTreeFromLocalStorage()
      if (isValidTreeData(cachedTree)) {
        setLocalTreeData(cachedTree)
        setTreeData(cachedTree)
        return true
      }
      return false
    }

    void (async () => {
      if (!shouldRefreshTree && hydrateFromCache()) return

      try {
        const payload = await fetchTreeFtthByUser(controller.signal)
        if (!active) return

        if (isValidTreeData(payload)) {
          setLocalTreeData(payload)
          setTreeData(payload)
          saveTreeToLocalStorage(payload)
        } else {
          hydrateFromCache()
        }
      } catch {
        if (active) hydrateFromCache()
      }
    })()

    return () => {
      active = false
      controller.abort()
    }
  }, [setTreeData, shouldRefreshTree])

  useEffect(() => {
    if (!shouldRefreshTree) return
    const next = new URLSearchParams(searchParams)
    next.delete('refreshTree')
    setSearchParams(next, { replace: true })
  }, [searchParams, setSearchParams, shouldRefreshTree])

  const oltNameList = useMemo(() => oltNamesFromTree(treeData), [treeData])

  return (
    <FtthDesktopHomeHero oltNameList={oltNameList} recentSearches={recentSearches} />
  )
}
