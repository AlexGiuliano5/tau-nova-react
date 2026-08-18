import clsx from 'clsx'
import type { ReactNode } from 'react'
import { IoChevronForward } from 'react-icons/io5'
import { Link } from 'react-router-dom'

interface Props {
  title: string
  icon?: ReactNode
  chevron?: boolean
  disabled?: boolean
  className?: string
  href?: string
  onClick?: React.MouseEventHandler<HTMLButtonElement>
}

export function FtthNetworkLevelButton({
  title,
  icon,
  chevron = false,
  href,
  disabled = false,
  onClick,
  className,
}: Props) {
  const buttonClassName = clsx(
    'flex h-[60px] w-full items-center gap-4 rounded-lg bg-(--primary-2) px-5 text-white shadow-lg dark:bg-(--secondary-3)',
    disabled && 'cursor-not-allowed opacity-50',
    className,
  )

  const content = (
    <div
      className={clsx(
        'flex w-full items-center',
        chevron ? 'justify-between' : 'justify-center',
      )}
    >
      <div className="flex items-center gap-2">
        {icon}
        <span>{title}</span>
      </div>
      {chevron ? <IoChevronForward size={24} /> : null}
    </div>
  )

  if (href && !disabled) {
    return (
      <Link to={href} className={buttonClassName}>
        {content}
      </Link>
    )
  }

  return (
    <button type="button" disabled={disabled} className={buttonClassName} onClick={onClick}>
      {content}
    </button>
  )
}
