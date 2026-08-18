import { IoClose, IoPersonCircleOutline } from 'react-icons/io5'
import { useShallow } from 'zustand/react/shallow'

import { useUiStore } from '@/shared/stores/ui-store'

interface SideMenuToggleButtonProps {
  className?: string
  iconSize?: number
}

const defaultClassName = 'mr-5 flex w-6/12 items-center justify-end'

export function SideMenuToggleButton({
  className = defaultClassName,
  iconSize = 32,
}: SideMenuToggleButtonProps) {
  const { isSideMenuOpen, openSideMenu, closeSideMenu } = useUiStore(
    useShallow((state) => ({
      isSideMenuOpen: state.isSideMenuOpen,
      openSideMenu: state.openSideMenu,
      closeSideMenu: state.closeSideMenu,
    })),
  )

  if (isSideMenuOpen) {
    return (
      <button
        type="button"
        className={className}
        onClick={closeSideMenu}
        aria-label="Cerrar menú lateral"
      >
        <IoClose size={iconSize} />
      </button>
    )
  }

  return (
    <button
      type="button"
      className={className}
      onClick={openSideMenu}
      aria-label="Abrir menú lateral"
    >
      <IoPersonCircleOutline size={iconSize} />
    </button>
  )
}
