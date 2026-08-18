import { useEffect, useState } from 'react'

import { fetchRecentNetworkElementSearches } from '@/features/ftth/api/recent-searches'
import type { RecentNetworkElementSearch } from '@/features/ftth/types/recent-search'
import { NetworkElementSearchForm } from '@/features/ftth-search/components/NetworkElementSearchForm'
import { FtthBreadcrumb } from '@/features/shell/components/FtthBreadcrumb'

export function NetworkElementSearchPage() {
  const [recentSearches, setRecentSearches] = useState<RecentNetworkElementSearch[]>([])

  useEffect(() => {
    const controller = new AbortController()
    let active = true

    void (async () => {
      try {
        const searches = await fetchRecentNetworkElementSearches(controller.signal)
        if (active) setRecentSearches(searches)
      } catch {
        if (active) setRecentSearches([])
      }
    })()

    return () => {
      active = false
      controller.abort()
    }
  }, [])

  return (
    <>
      <FtthBreadcrumb title="Búsqueda por elemento de red" backHref="/ftth/busqueda" />
      <NetworkElementSearchForm recentSearches={recentSearches} />
    </>
  )
}
