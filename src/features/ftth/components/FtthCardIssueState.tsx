import { FtthDataIssueNotice } from '@/features/ftth/components/FtthDataIssueNotice'
import type { FtthDataIssue, FtthDisplayIssue } from '@/features/ftth/lib/card-issue'
import { hasFtthCardIssue } from '@/features/ftth/lib/card-issue'

interface Props {
  title: string
  issue: FtthDisplayIssue | Exclude<FtthDataIssue, 'none'>
  cardClassName: string
  context?: string
  message?: string
  bodyClassName?: string
  className?: string
}

/** Card completa con cartel de issue (borde/fondo rojo o amarillo + mensaje). */
export function FtthCardIssueState({
  title,
  issue,
  cardClassName,
  context,
  message,
  bodyClassName,
  className,
}: Props) {
  const displayIssue = hasFtthCardIssue(issue) ? issue : 'no-data'

  return (
    <FtthDataIssueNotice
      presentation="card"
      title={title}
      issue={displayIssue}
      context={context}
      message={message}
      cardClassName={cardClassName}
      bodyClassName={bodyClassName}
      className={className}
    />
  )
}
