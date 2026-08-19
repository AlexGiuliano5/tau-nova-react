import clsx from 'clsx'
import type { IconType } from 'react-icons'
import type { ReactNode } from 'react'

/** Título de card con ícono L1 (identidad del bloque). */
export function OntCardTitle({
  icon: Icon,
  children,
  className,
  as: Tag = 'h1',
}: {
  icon: IconType
  children: ReactNode
  className?: string
  as?: 'h1' | 'h2'
}) {
  return (
    <Tag
      className={clsx(
        'inline-flex min-w-0 items-center gap-2 text-base leading-tight font-semibold tracking-tight md:text-[1.05rem]',
        className,
      )}
    >
      <Icon className="size-[18px] shrink-0 text-(--text-primary)/75" aria-hidden />
      <span className="min-w-0">{children}</span>
    </Tag>
  )
}

type OntStatusCalloutTone = 'ok' | 'warning' | 'unknown'

/** Empty / healthy / warning callout (L0). */
export function OntCardStatusCallout({
  tone,
  icon: Icon,
  title,
  description,
}: {
  tone: OntStatusCalloutTone
  icon: IconType
  title: string
  description?: string
}) {
  const iconToneClassName =
    tone === 'ok'
      ? 'text-(--card-green)'
      : tone === 'warning'
        ? 'text-yellow-500'
        : 'text-(--text-secondary)'

  const borderToneClassName =
    tone === 'ok'
      ? 'border-l-(--card-green)/55'
      : tone === 'warning'
        ? 'border-l-yellow-500/55'
        : 'border-l-(--text-secondary)/35'

  const titleToneClassName =
    tone === 'warning' ? 'text-yellow-600 dark:text-yellow-400' : 'text-(--text-primary)'

  return (
    <div className={clsx('flex gap-2.5 border-l-2 py-0.5 pl-2.5', borderToneClassName)}>
      <Icon className={clsx('mt-0.5 size-4 shrink-0', iconToneClassName)} aria-hidden />
      <div className="min-w-0">
        <p className={clsx('text-[13px] leading-snug font-semibold', titleToneClassName)}>{title}</p>
        {description ? (
          <p className="mt-0.5 text-xs leading-snug text-(--text-secondary)">{description}</p>
        ) : null}
      </div>
    </div>
  )
}

/** Chrome L1 compartido (cliente / info / alertas / interrupciones). */
export const ontInfoL1CardClassName =
  'm-4 rounded-xl border border-[#d9e0e8] bg-(--card) shadow-[0_1px_6px_rgb(15_23_42/0.05)] dark:border-white/10 dark:shadow-[0_8px_18px_rgb(0_0_0/0.3)]'
