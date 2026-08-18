import { create } from 'zustand'

import {
  applyDarkClass,
  persistThemeMode,
  readStoredThemeMode,
  resolveDarkAppearance,
  type ThemeMode,
} from '@/shared/lib/theme'

interface UiState {
  isSideMenuOpen: boolean
  themeMode: ThemeMode
  openSideMenu: () => void
  closeSideMenu: () => void
  setThemeMode: (mode: ThemeMode) => void
  hydrateTheme: () => void
}

export const useUiStore = create<UiState>((set) => ({
  isSideMenuOpen: false,
  themeMode: 'light',

  openSideMenu: () => set({ isSideMenuOpen: true }),
  closeSideMenu: () => set({ isSideMenuOpen: false }),

  setThemeMode: (mode) => {
    persistThemeMode(mode)
    // Apariencia concreta la aplica ThemeModeSync (auto → sensor/cámara).
    if (mode !== 'auto') {
      applyDarkClass(resolveDarkAppearance(mode))
    }
    set({ themeMode: mode })
  },

  hydrateTheme: () => {
    const mode = readStoredThemeMode()
    applyDarkClass(resolveDarkAppearance(mode))
    set({ themeMode: mode })
  },
}))
