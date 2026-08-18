import { useShallow } from 'zustand/react/shallow'

import { useUiStore } from '@/shared/stores/ui-store'

/**
 * Coordina menús del header con el sidebar de usuario en desktop.
 */
export function useDesktopNavMenuWithSidebar() {
  const { isSideMenuOpen, closeSideMenu } = useUiStore(
    useShallow((state) => ({
      isSideMenuOpen: state.isSideMenuOpen,
      closeSideMenu: state.closeSideMenu,
    })),
  )

  const tryRunFromClick = (action: () => void) => {
    if (isSideMenuOpen) closeSideMenu()
    action()
  }

  const tryOpenFromPointer = (
    openMenu: (source: 'hover' | 'focus') => void,
    source: 'hover' | 'focus',
  ) => {
    if (isSideMenuOpen) return
    openMenu(source)
  }

  const tryOpenFromClick = (openMenu: (source: 'click') => void, isOpen: boolean) => {
    if (!isSideMenuOpen && isOpen) return
    tryRunFromClick(() => openMenu('click'))
  }

  return { isSideMenuOpen, tryOpenFromPointer, tryOpenFromClick, tryRunFromClick }
}
