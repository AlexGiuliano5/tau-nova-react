import type { ReactNode } from 'react'

interface PreferencesSectionPanelProps {
  title: string
  description: string
  children: ReactNode
  actions?: ReactNode
}

export function PreferencesSectionPanel({
  title,
  description,
  children,
  actions,
}: PreferencesSectionPanelProps) {
  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <header className="border-b border-black/8 px-5 py-5 dark:border-white/10 md:px-8 md:py-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-(--text-primary) md:text-xl">{title}</h2>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-(--text-secondary)">
              {description}
            </p>
          </div>
          {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 md:px-8 md:py-6">{children}</div>
    </section>
  )
}
