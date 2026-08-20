import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

import { FtthQuickSearchCompact } from '@/features/shell/components/FtthQuickSearchCompact'
import { FtthToolsDesktopMenu } from '@/features/shell/components/FtthToolsDesktopMenu'
import { FtthTopologyDesktopMenu } from '@/features/shell/components/FtthTopologyDesktopMenu'
import { SideMenuToggleButton } from '@/features/shell/components/SideMenuToggleButton'
import {
  DARK_HEADER_BRAND_ICON_HREF,
  LIGHT_HEADER_BRAND_ICON_HREF,
} from '@/shared/lib/theme'

const headerClassName =
  'fixed top-0 right-0 left-0 z-50 h-[70px] w-full bg-(--primary) py-2 text-white dark:bg-(--secondary-2) md:h-[64px] md:bg-(--background) md:py-0 md:text-(--text-primary) md:dark:bg-(--background)'

const desktopNavLinkClassName =
  'inline-flex h-10 items-center rounded-md px-4 text-sm leading-none font-semibold text-(--text-secondary) transition-colors hover:bg-black/5 hover:text-(--text-primary) dark:text-(--text-primary)/80 dark:hover:bg-white/8 dark:hover:text-(--text-primary)'

const wordmarkGradient =
  'bg-[linear-gradient(90deg,#0e7490_0%,#6366f1_100%)] bg-clip-text text-transparent dark:bg-[linear-gradient(90deg,#ddd6fe_0%,#c4b5fd_38%,#a78bfa_100%)]'

function BrandIcon({ sizeClassName }: { sizeClassName: string }) {
  return (
    <span className={`relative block shrink-0 ${sizeClassName}`} aria-hidden>
      <img
        src={LIGHT_HEADER_BRAND_ICON_HREF}
        alt=""
        className="h-full w-full object-contain object-center dark:hidden"
      />
      <img
        src={DARK_HEADER_BRAND_ICON_HREF}
        alt=""
        className="hidden h-full w-full object-contain object-center dark:block"
      />
    </span>
  )
}

function Brand({ homeHref }: { homeHref: string }) {
  return (
    <Link
      to={homeHref}
      className="inline-flex h-full items-center gap-2 leading-none md:gap-2.5"
      aria-label="TAU Nova — Ir al inicio"
    >
      <BrandIcon sizeClassName="h-9 w-9 md:h-8 md:w-8" />
      <span className="text-lg leading-none tracking-tight md:hidden">
        <span className="font-semibold text-white">TAU</span>{' '}
        <span className="font-medium text-white">Nova</span>
      </span>
      <span className="hidden text-lg font-semibold leading-none tracking-tight md:inline">
        <span className="text-(--text-primary)">TAU</span>{' '}
        <span className={wordmarkGradient}>Nova</span>
      </span>
    </Link>
  )
}

interface FtthTopBarProps {
  homeHref?: string
}

export function FtthTopBar({ homeHref = '/ftth' }: FtthTopBarProps) {
  const location = useLocation()
  const isHome =
    location.pathname === homeHref || location.pathname === `${homeHref}/`
  const shouldShowQuickSearch = location.pathname.startsWith('/ftth') && !isHome
  const [addressHint, setAddressHint] = useState<string | null>(null)

  return (
    <header className={headerClassName}>
      <div className="h-full w-full px-4 md:px-6 lg:px-8">
        <div className="flex h-full items-center justify-between md:hidden">
          <Brand homeHref={homeHref} />
          <SideMenuToggleButton />
        </div>

        <div className="hidden h-full items-center justify-between md:flex">
          <div className="-ml-4 flex min-w-0 flex-1 items-center gap-6">
            <Brand homeHref={homeHref} />
            <div className="flex min-w-0 flex-1 items-center gap-5">
              <nav className="flex shrink-0 items-center gap-1" aria-label="Navegación principal">
                <FtthTopologyDesktopMenu />
                <button
                  type="button"
                  className={desktopNavLinkClassName}
                  onClick={() => {
                    setAddressHint('La búsqueda por domicilio estará disponible pronto.')
                    window.setTimeout(() => setAddressHint(null), 2500)
                  }}
                >
                  Domicilio
                </button>
                <FtthToolsDesktopMenu />
              </nav>
              {shouldShowQuickSearch ? <FtthQuickSearchCompact /> : null}
            </div>
          </div>
          <div className="relative flex shrink-0 items-center">
            {addressHint ? (
              <p
                role="status"
                className="absolute right-12 top-1/2 hidden -translate-y-1/2 whitespace-nowrap rounded-md bg-(--card) px-2 py-1 text-[11px] text-(--text-secondary) shadow lg:block"
              >
                {addressHint}
              </p>
            ) : null}
            <SideMenuToggleButton className="flex h-10 w-10 items-center justify-center rounded-full text-(--text-secondary) transition-colors hover:bg-black/5 hover:text-(--text-primary) dark:text-(--text-primary)/80 dark:hover:bg-white/8 dark:hover:text-(--text-primary)" />
          </div>
        </div>
      </div>
    </header>
  )
}
