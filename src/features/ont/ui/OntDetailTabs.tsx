import clsx from 'clsx'
import { Link, useLocation } from 'react-router-dom'

export type OntDetailTabId = 'info' | 'graficos-historicos'

const tabs: Array<{ id: OntDetailTabId; label: string }> = [
  { id: 'info', label: 'Información' },
  { id: 'graficos-historicos', label: 'Gráficos históricos' },
]

interface Props {
  ont: string
}

export function OntDetailTabs({ ont }: Props) {
  const location = useLocation()
  const activeTab: OntDetailTabId = location.pathname.includes('/graficos-historicos')
    ? 'graficos-historicos'
    : 'info'

  return (
    <>
      <nav
        aria-label="Secciones de detalle ONT"
        className="grid h-[50px] w-full grid-cols-2 items-end border-t border-white/20 bg-(--primary-2) text-white dark:bg-(--secondary-4) md:hidden"
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab
          const href = `/ftth/ont/${encodeURIComponent(ont)}/${tab.id}`
          const classes = clsx(
            'inline-flex h-full w-full items-center justify-center border-b-[3px] text-sm tracking-wide transition-colors',
            isActive
              ? 'ont-detail-tab-active font-semibold text-white'
              : 'border-b-transparent text-white/80 hover:text-white',
          )

          if (isActive) {
            return (
              <span key={tab.id} aria-current="page" className={classes}>
                <span className="leading-none">{tab.label}</span>
              </span>
            )
          }

          return (
            <Link key={tab.id} to={href} className={classes}>
              <span className="leading-none">{tab.label}</span>
            </Link>
          )
        })}
      </nav>

      <nav
        aria-label="Secciones de detalle ONT"
        className="mx-3 mt-3 hidden h-10 grid-cols-2 rounded-lg bg-[#f6f9fc] p-1 text-[#2c5e8a] dark:bg-[#1d1a2a] dark:text-[#c7c0df] md:grid"
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab
          const href = `/ftth/ont/${encodeURIComponent(ont)}/${tab.id}`
          const classes = clsx(
            'inline-flex h-full w-full items-center justify-center rounded-md text-[11px] font-semibold tracking-wide transition-colors',
            isActive
              ? 'bg-[#e8f2fb] text-[#155a96] ring-1 ring-[#b7d4ee] dark:bg-[#31294a] dark:text-[#f0e9ff] dark:ring-0'
              : 'text-[#4f7ba1] hover:bg-white/70 hover:text-[#0f4f8a] dark:text-[#b1a9cc] dark:hover:bg-[#2a2340] dark:hover:text-[#e6dcff]',
          )

          if (isActive) {
            return (
              <span key={tab.id} aria-current="page" className={classes}>
                <span className="leading-none">{tab.label}</span>
              </span>
            )
          }

          return (
            <Link key={tab.id} to={href} className={classes}>
              <span className="leading-none">{tab.label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
