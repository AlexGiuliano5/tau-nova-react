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
        {tabs.map((tab) => (
          <OntDetailTabLink
            key={tab.id}
            ont={ont}
            tab={tab}
            isActive={tab.id === activeTab}
            variant="mobile"
          />
        ))}
      </nav>

      <nav
        aria-label="Secciones de detalle ONT"
        className="hidden items-end gap-6 border-b border-[#e5e7eb] bg-(--background) px-6 pt-3 dark:border-white/10 md:flex lg:px-8"
      >
        {tabs.map((tab) => (
          <OntDetailTabLink
            key={tab.id}
            ont={ont}
            tab={tab}
            isActive={tab.id === activeTab}
            variant="desktop"
          />
        ))}
      </nav>
    </>
  )
}

function OntDetailTabLink({
  ont,
  tab,
  isActive,
  variant,
}: {
  ont: string
  tab: (typeof tabs)[number]
  isActive: boolean
  variant: 'mobile' | 'desktop'
}) {
  const href = `/ftth/ont/${encodeURIComponent(ont)}/${tab.id}`
  const className =
    variant === 'mobile'
      ? clsx(
          'inline-flex h-full w-full items-center justify-center border-b-[3px] text-sm tracking-wide transition-colors',
          isActive
            ? 'ont-detail-tab-active font-semibold text-white'
            : 'border-b-transparent text-white/80 hover:text-white',
        )
      : clsx(
          'inline-flex items-center border-b-2 px-3 pb-3 pt-1 text-sm -mb-px transition-colors',
          isActive
            ? 'border-(--primary) font-medium text-(--primary-2) dark:border-(--secondary) dark:text-(--secondary)'
            : 'border-transparent text-black/45 hover:text-black/70 dark:text-white/45 dark:hover:text-white/70',
        )

  return (
    <Link to={href} aria-current={isActive ? 'page' : undefined} className={className}>
      <span className="leading-none">{tab.label}</span>
    </Link>
  )
}
