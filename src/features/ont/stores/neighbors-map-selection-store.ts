import { create } from 'zustand'

interface NeighborsMapSelectionState {
  selectedSerials: string[]
  setSelectedSerials: (serials: string[]) => void
}

export const useNeighborsMapSelectionStore = create<NeighborsMapSelectionState>((set) => ({
  selectedSerials: [],
  setSelectedSerials: (serials) => set({ selectedSerials: serials }),
}))
