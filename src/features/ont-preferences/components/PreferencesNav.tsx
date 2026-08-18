import clsx from 'clsx'
import { Link, useLocation } from 'react-router-dom'

import { preferencesSections } from '@/features/ont-preferences/lib/preferences-sections'

interface PreferencesNavProps {
  className?: string
}

export function PreferencesNav({ className }: PreferencesNavProps) {
  const location = useLocation()

  return (
    <nav
      aria-label="Secciones de preferencias"
      className={clsx(
        'border-b border-black/8 bg-(--card) md:w-72 md:shrink-0 md:border-b-0 md:border-r dark:border-white/10',
        className,
      )}
    >
      <div className="px-4 py-4 md:px-5 md:py-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-(--text-secondary)">
          Personalización
        </p>
        <ul className="mt-3 flex flex-col gap-1">
          {preferencesSections.map((section) => {
            const isActive =
              location.pathname === section.href ||
              location.pathname.startsWith(`${section.href}/`)
            const Icon = section.icon

            if (!section.available) {
              return (
                <li key={section.id}>
                  <span
                    aria-disabled="true"
                    className="flex items-start gap-3 rounded-xl px-3 py-3 opacity-50"
                  >
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-black/5 text-(--text-secondary) dark:bg-white/8">
                      <Icon size={18} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-(--text-primary)">
                        {section.label}
                      </span>
                      <span className="mt-0.5 block text-xs leading-snug text-(--text-secondary)">
                        {section.description}
                      </span>
                    </span>
                  </span>
                </li>
              )
            }

            return (
              <li key={section.id}>
                <Link
                  to={section.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={clsx(
                    'flex items-start gap-3 rounded-xl px-3 py-3 transition-colors',
                    isActive
                      ? 'bg-(--primary)/10 text-(--primary) dark:bg-(--secondary)/16 dark:text-(--secondary)'
                      : 'text-(--text-primary) hover:bg-black/4 dark:hover:bg-white/6',
                  )}
                >
                  <span
                    className={clsx(
                      'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
                      isActive
                        ? 'bg-(--primary)/14 text-(--primary) dark:bg-(--secondary)/20 dark:text-(--secondary)'
                        : 'bg-black/5 text-(--text-secondary) dark:bg-white/8',
                    )}
                  >
                    <Icon size={18} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">{section.label}</span>
                    <span
                      className={clsx(
                        'mt-0.5 block text-xs leading-snug',
                        isActive ? 'text-(--text-primary)/80' : 'text-(--text-secondary)',
                      )}
                    >
                      {section.description}
                    </span>
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}
