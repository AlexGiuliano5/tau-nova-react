import { create } from 'zustand'

import type { BffTreeResponse } from '@/features/ftth/types/tree'

interface TreeState {
  treeData: BffTreeResponse | null
  setTreeData: (data: BffTreeResponse | null) => void
  clearTreeData: () => void
}

export const useFtthTreeStore = create<TreeState>((set) => ({
  treeData: null,
  setTreeData: (data) => set({ treeData: data }),
  clearTreeData: () => set({ treeData: null }),
}))
