import clsx from 'clsx'
import { type ReactNode, useEffect } from 'react'
import {
  IoChevronForward,
  IoContrastOutline,
  IoLogOutOutline,
  IoMoonOutline,
  IoSettingsOutline,
  IoSunnyOutline,
} from 'react-icons/io5'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useShallow } from 'zustand/react/shallow'

import { hasAnyAppRole, hasFtthRole, hasPlantaInternaRole } from '@/features/auth/lib/roles'
import { useAuthStore } from '@/features/auth/store/auth-store'
import { clearTreeFromLocalStorage } from '@/features/ftth/lib/tree-cache'
import { useFtthTreeStore } from '@/features/ftth/stores/tree-store'
import type { ThemeMode } from '@/shared/lib/theme'
import { useUiStore } from '@/shared/stores/ui-store'

type SidebarUserInfo = {
  fullname?: string
  legajo?: string
  roles?: string[]
}

interface SidebarProps {
  userInfo?: SidebarUserInfo
}

const sectionTitleClass =
  'text-[10px] font-semibold uppercase tracking-[0.08em] text-(--text-secondary)'
const segmentedGroupClass = 'grid rounded-xl bg-(--background) p-1'
const segmentedOptionClass = 'px-2 py-2 rounded-lg text-xs font-semibold transition-colors sm:text-xs'
const cardClass = 'rounded-2xl border border-black/8 bg-(--card) p-3 dark:border-white/10'
const accentTextClass = 'text-(--primary) dark:text-(--secondary)'
const segmentedActiveClass = 'bg-(--card) text-(--primary) shadow-sm dark:text-(--secondary)'
const segmentedIdleClass = 'text-(--text-secondary) hover:bg-black/5 dark:hover:bg-white/10'
const navRowClass = clsx(
  cardClass,
  'flex items-center justify-between px-3 py-2.5 text-left transition-colors hover:bg-black/3 dark:hover:bg-white/4',
)

function getUserInitials(displayName: string): string {
  if (!displayName) return 'U'
  const parts = displayName.split(/\s+/).filter(Boolean)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

function isPlantaInternaPath(pathname: string): boolean {
  return (
    pathname === '/planta-interna' ||
    pathname.startsWith('/planta-interna/') ||
    pathname === '/pi'
  )
}

function ThemePicker({
  themeMode,
  setThemeMode,
  showTopMarginOnTitle,
}: {
  themeMode: ThemeMode
  setThemeMode: (mode: ThemeMode) => void
  showTopMarginOnTitle: boolean
}) {
  return (
    <>
      <p className={clsx(sectionTitleClass, showTopMarginOnTitle ? 'mt-4' : '')}>Tema</p>
      <div className="mt-1">
        <div className={clsx(segmentedGroupClass, 'grid-cols-3')}>
          {(
            [
              { mode: 'light' as const, label: 'Claro', Icon: IoSunnyOutline },
              { mode: 'dark' as const, label: 'Oscuro', Icon: IoMoonOutline },
              { mode: 'auto' as const, label: 'Auto', Icon: IoContrastOutline },
            ] as const
          ).map(({ mode, label, Icon }) => (
            <button
              key={mode}
              type="button"
              onClick={() => setThemeMode(mode)}
              aria-pressed={themeMode === mode}
              className={clsx(
                segmentedOptionClass,
                'flex items-center justify-center gap-1',
                themeMode === mode ? segmentedActiveClass : segmentedIdleClass,
              )}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}

function NavRow({
  title,
  subtitle,
  icon,
  iconWrapperClassName,
  href,
  onNavigate,
}: {
  title: string
  subtitle: string
  icon: ReactNode
  iconWrapperClassName: string
  href: string
  onNavigate?: () => void
}) {
  return (
    <Link to={href} onClick={onNavigate} className={navRowClass}>
      <span className="flex items-center gap-3">
        <span
          className={clsx(
            'flex h-11 w-11 items-center justify-center rounded-xl',
            iconWrapperClassName,
          )}
        >
          {icon}
        </span>
        <span>
          <span className="block text-sm font-semibold leading-none text-(--text-primary)">
            {title}
          </span>
          <span className="mt-1 block text-xs text-(--text-secondary)">{subtitle}</span>
        </span>
      </span>
      <IoChevronForward size={16} className="text-(--text-secondary)" />
    </Link>
  )
}

export function Sidebar({ userInfo }: SidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const clearTreeData = useFtthTreeStore((s) => s.clearTreeData)
  const logout = useAuthStore((s) => s.logout)

  const canAccessFtth = hasFtthRole(userInfo?.roles)
  const canAccessPlantaInterna = hasPlantaInternaRole(userInfo?.roles)
  const hasAppAccess = hasAnyAppRole(userInfo?.roles)
  const canSwitchTechnology = canAccessFtth && canAccessPlantaInterna
  const networkMode =
    canAccessPlantaInterna && isPlantaInternaPath(location.pathname)
      ? 'planta-interna'
      : 'ftth'

  const { isSideMenuOpen, closeSideMenu, themeMode, setThemeMode } = useUiStore(
    useShallow((state) => ({
      isSideMenuOpen: state.isSideMenuOpen,
      closeSideMenu: state.closeSideMenu,
      themeMode: state.themeMode,
      setThemeMode: state.setThemeMode,
    })),
  )

  useEffect(() => {
    document.body.style.overflow = isSideMenuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [isSideMenuOpen])

  const displayName = userInfo?.fullname?.trim() ?? ''
  const userInitials = getUserInitials(displayName)

  return (
    <div
      className={clsx(
        'fixed inset-x-0 bottom-0 top-[70px] z-9999 transition-opacity duration-300 md:top-[64px]',
        isSideMenuOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
      )}
    >
      <button
        type="button"
        aria-label="Cerrar menú"
        className="absolute inset-0 bg-black/20"
        onClick={closeSideMenu}
      />

      <nav
        className={clsx(
          'absolute inset-y-0 right-0 flex h-full w-full transform flex-col overflow-y-auto bg-(--background) transition-transform duration-300 md:max-w-[419px] md:border-l md:border-black/10 md:shadow-[-8px_0_24px_rgba(0,0,0,0.18)] dark:md:border-white/10',
          { 'translate-x-full': !isSideMenuOpen },
        )}
      >
        <div className="flex flex-1 flex-col px-4 pb-4 pt-4">
          <section className="px-4">
            <div className="flex flex-col items-center text-center">
              <div
                className={clsx(
                  'relative flex h-26 w-26 shrink-0 items-center justify-center rounded-full text-2xl font-semibold tracking-tight sm:h-18 sm:w-18 sm:text-2xl xl:h-15 xl:w-15 xl:text-xl',
                  'border border-black/8 bg-(--card) text-(--primary-2) shadow-[0_4px_14px_rgba(5,44,80,0.06)]',
                  'dark:bg-[linear-gradient(165deg,color-mix(in_srgb,#ffffff_6%,var(--card))_0%,color-mix(in_srgb,#000_38%,var(--card))_100%)]',
                  'dark:text-(--secondary) dark:shadow-[0_8px_22px_rgba(0,0,0,0.42)]',
                )}
                aria-hidden
              >
                {userInitials}
              </div>
              <h2 className="font-semibold tracking-tight text-(--text-primary) sm:mt-4 xl:mt-2 xl:text-base">
                {userInfo?.fullname ?? 'Usuario'}
              </h2>
              <p className={clsx('mt-1 text-base font-semibold', accentTextClass)}>
                {userInfo?.legajo ?? 'Sin legajo'}
              </p>
              {!hasAppAccess ? (
                <p className="mt-3 rounded-xl border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-sm font-medium text-amber-700 dark:text-amber-300">
                  No tiene roles para entrar en la aplicación.
                </p>
              ) : null}
            </div>
          </section>

          <section className={clsx(cardClass, 'mt-4')}>
            {canSwitchTechnology ? (
              <div>
                <p className={sectionTitleClass}>Tecnología</p>
                <div className="mt-1">
                  <div className={clsx(segmentedGroupClass, 'grid-cols-2')}>
                    <Link
                      to="/ftth"
                      onClick={closeSideMenu}
                      aria-current={networkMode === 'ftth' ? 'page' : undefined}
                      className={clsx(
                        segmentedOptionClass,
                        'flex w-full items-center justify-center text-center',
                        networkMode === 'ftth' ? segmentedActiveClass : segmentedIdleClass,
                      )}
                    >
                      FTTH
                    </Link>
                    <Link
                      to="/planta-interna"
                      onClick={closeSideMenu}
                      aria-current={networkMode === 'planta-interna' ? 'page' : undefined}
                      className={clsx(
                        segmentedOptionClass,
                        'flex w-full items-center justify-center text-center',
                        networkMode === 'planta-interna'
                          ? segmentedActiveClass
                          : segmentedIdleClass,
                      )}
                    >
                      Planta interna
                    </Link>
                  </div>
                </div>
              </div>
            ) : null}
            <ThemePicker
              themeMode={themeMode}
              setThemeMode={setThemeMode}
              showTopMarginOnTitle={canSwitchTechnology}
            />
          </section>

          <section className="mt-3 grid">
            <NavRow
              title="Preferencias"
              subtitle="Configuración del sistema"
              icon={<IoSettingsOutline size={19} />}
              iconWrapperClassName="bg-(--primary)/12 text-(--primary) dark:bg-(--secondary)/16 dark:text-(--secondary)"
              href="/ftth/preferencias"
              onNavigate={closeSideMenu}
            />
          </section>

          <section className="mt-auto pt-5">
            <button
              type="button"
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-red-500/10 font-semibold text-red-600 transition-colors hover:bg-red-500/15 dark:text-red-400"
              onClick={() => {
                clearTreeData()
                clearTreeFromLocalStorage()
                closeSideMenu()
                logout()
                void navigate('/login', { replace: true })
              }}
            >
              <IoLogOutOutline size={20} />
              Cerrar sesión
            </button>
          </section>
        </div>
      </nav>
    </div>
  )
}
