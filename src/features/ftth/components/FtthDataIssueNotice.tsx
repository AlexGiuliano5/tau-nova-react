import clsx from 'clsx'

import {
  resolveFtthDisplayIssueToneClass,
  resolveFtthIssueMessage,
  type FtthDisplayIssue,
} from '@/features/ftth/lib/card-issue'

const NOTICE_CHROME =
  'shadow-sm rounded-lg bg-(--card) dark:border dark:border-white/15 dark:shadow-[0_10px_20px_rgb(0_0_0/0.45)]'

const STANDALONE_SECTION =
  `${NOTICE_CHROME} flex w-full min-w-0 flex-col gap-3 border px-5 pt-5 pb-3`

const STANDALONE_TWIN = 'm-5 box-border flex min-w-0 items-center md:min-h-[520px]'
const STANDALONE_FULL = 'm-5 box-border flex min-w-0 items-center min-h-[280px]'

const INLINE_MESSAGE =
  'text-center text-sm leading-snug text-(--text-primary) md:text-[12px]'

const CARD_TITLE =
  'text-lg font-semibold leading-tight tracking-tight text-(--text-primary) md:text-[1.05rem]'

const STANDALONE_TITLE = 'text-xl font-semibold text-(--text-primary)'

type StandaloneProps = {
  presentation: 'standalone'
  layout: 'twin-column' | 'full-width'
  title: string
}

type CardProps = {
  presentation: 'card'
  title: string
  cardClassName: string
  bodyClassName?: string
}

type InlineProps = {
  presentation: 'inline'
  title?: never
  cardClassName?: never
  layout?: never
}

type BaseProps = {
  issue: FtthDisplayIssue
  /** Fragmento contextual (ej. `el histórico de estados`). Ignorado si `issue === 'unexpected'`. */
  context?: string
  /**
   * Texto opcional solo para `no-data`.
   * En `error` / `unexpected` se ignora (no exponer detalle técnico del BFF).
   */
  message?: string
  className?: string
}

export type FtthDataIssueNoticeProps = BaseProps & (StandaloneProps | CardProps | InlineProps)

export function FtthDataIssueNotice(props: FtthDataIssueNoticeProps) {
  const { issue, context, message, className } = props
  // Errores: nunca mostrar `message` crudo del BFF.
  const text =
    issue === 'error' || issue === 'unexpected'
      ? resolveFtthIssueMessage(issue, context)
      : (message ?? resolveFtthIssueMessage(issue, context))
  const tone = resolveFtthDisplayIssueToneClass(issue)

  if (props.presentation === 'inline') {
    return <p className={clsx(INLINE_MESSAGE, className)}>{text}</p>
  }

  if (props.presentation === 'standalone') {
    const wrapper =
      props.layout === 'twin-column' ? STANDALONE_TWIN : STANDALONE_FULL

    return (
      <div className={wrapper}>
        <section className={clsx(STANDALONE_SECTION, tone, className)}>
          <h2 className={STANDALONE_TITLE}>{props.title}</h2>
          <p className="wrap-break-word text-sm leading-snug text-(--text-primary)">{text}</p>
        </section>
      </div>
    )
  }

  return (
    <div className={clsx(props.cardClassName, 'border', tone, className)} role="status">
      <header className="flex shrink-0 flex-col gap-2">
        <h2 className={CARD_TITLE}>{props.title}</h2>
      </header>
      <div
        className={clsx(
          'flex flex-col items-center justify-center',
          props.bodyClassName ?? 'min-h-[200px]',
        )}
      >
        <p className={INLINE_MESSAGE}>{text}</p>
      </div>
    </div>
  )
}
