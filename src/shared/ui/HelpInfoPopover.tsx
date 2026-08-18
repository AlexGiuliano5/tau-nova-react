import clsx from 'clsx'
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { IoHelpCircleOutline } from 'react-icons/io5'

interface HelpInfoPopoverProps {
  content: ReactNode
  ariaLabel: string
  className?: string
  iconClassName?: string
  panelClassName?: string
}

export function HelpInfoPopover({
  content,
  ariaLabel,
  className,
  iconClassName,
  panelClassName,
}: HelpInfoPopoverProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const panelId = useId()

  useEffect(() => {
    if (!isOpen) return

    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  return (
    <div ref={containerRef} className={clsx('relative inline-flex', className)}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        aria-controls={isOpen ? panelId : undefined}
        className={clsx(
          'inline-flex h-6 w-6 items-center justify-center rounded-full text-(--primary-2) transition-colors hover:bg-black/5 hover:text-(--primary-2) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--primary-2) dark:text-(--secondary) dark:hover:bg-white/10',
          iconClassName,
        )}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <IoHelpCircleOutline size={16} />
      </button>

      {isOpen ? (
        <div
          id={panelId}
          role="dialog"
          className={clsx(
            'absolute left-1/2 top-[calc(100%+0.5rem)] z-40 w-72 -translate-x-1/2 rounded-lg border border-black/10 bg-(--card) p-3 text-sm text-(--text-primary) shadow-lg dark:border-white/15',
            panelClassName,
          )}
        >
          {content}
        </div>
      ) : null}
    </div>
  )
}
