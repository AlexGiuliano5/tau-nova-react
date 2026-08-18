import { useEffect, useMemo, useState } from 'react'

import { getTreeFromLocalStorage } from '@/features/ftth/lib/tree-cache'
import { oltNamesFromTree } from '@/features/ftth/lib/olt-names'
import { useFtthTreeStore } from '@/features/ftth/stores/tree-store'
import type { BffTreeResponse } from '@/features/ftth/types/tree'

export function useFtthOltNames(): string[] {
  const treeFromStore = useFtthTreeStore((state) => state.treeData)
  const [treeFromLocalStorage, setTreeFromLocalStorage] = useState<BffTreeResponse | null>(
    null,
  )

  useEffect(() => {
    setTreeFromLocalStorage(getTreeFromLocalStorage())
  }, [])

  return useMemo(() => {
    const data = treeFromStore ?? treeFromLocalStorage
    return oltNamesFromTree(data)
  }, [treeFromLocalStorage, treeFromStore])
}
