import clsx from 'clsx'
import type { ReactNode } from 'react'
import { FiHome, FiSearch, FiTool } from 'react-icons/fi'
import { LuClipboardPen } from 'react-icons/lu'
import { Link, useLocation } from 'react-router-dom'
import { useShallow } from 'zustand/react/shallow'

import { useUiStore } from '@/shared/stores/ui-store'

const FTTH_MOBILE_BOTTOM_NAV_HEIGHT_PX = 70

const itemColumnClass =
  'flex flex-col items-center justify-center leading-none text-(--primary-2) dark:text-white'

function PillLink({
  href,
  isActive,
  children,
}: {
  href: string
  isActive: boolean
  children: ReactNode
}) {
  return (
    <Link to={href} aria-current={isActive ? 'page' : undefined} className={itemColumnClass}>
      <div
        className={clsx('flex items-center justify-center rounded-full p-2', {
          'bg-(--primary-2)/20 dark:bg-white/20': isActive,
        })}
      >
        {children}
      </div>
    </Link>
  )
}

export function MobileBottomNav() {
  const location = useLocation()
  const pathname = location.pathname
  const isSideMenuOpen = useUiStore(useShallow((s) => s.isSideMenuOpen))

  const isHomeActive = pathname === '/ftth'
  const isSearchActive = pathname.startsWith('/ftth/busqueda')
  const isToolsActive = pathname.startsWith('/ftth/herramientas')

  return (
    <footer
      style={{ height: FTTH_MOBILE_BOTTOM_NAV_HEIGHT_PX }}
      className={clsx(
        'fixed right-0 bottom-0 left-0 z-40 flex w-full items-center justify-between bg-white px-5 py-2 shadow-[0_-4px_12px_rgba(0,0,0,0.1)] md:hidden dark:bg-(--secondary-2)',
        { 'translate-y-full': isSideMenuOpen },
      )}
    >
      <PillLink href="/ftth" isActive={isHomeActive}>
        <FiHome size={32} className="block" />
      </PillLink>
      <PillLink href="/ftth/busqueda" isActive={isSearchActive}>
        <FiSearch size={32} className="block" />
      </PillLink>
      <PillLink href="/ftth/herramientas" isActive={isToolsActive}>
        <FiTool size={32} className="block" />
      </PillLink>
      <button
        type="button"
        aria-disabled="true"
        title="Reporte disponible solo en pantallas FTTH habilitadas"
        className="flex cursor-not-allowed flex-col items-center justify-center leading-none text-(--text-secondary) opacity-60"
      >
        <div className="flex items-center justify-center rounded-full p-2">
          <LuClipboardPen size={32} className="block" />
        </div>
      </button>
    </footer>
  )
}

export function FtthMobileBottomNavSpacer() {
  return (
    <div
      aria-hidden
      className="pointer-events-none h-[max(5.5rem,calc(70px+1.5rem+env(safe-area-inset-bottom,0px)))] shrink-0 md:hidden"
    />
  )
}
