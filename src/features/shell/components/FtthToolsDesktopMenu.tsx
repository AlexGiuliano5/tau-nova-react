import clsx from 'clsx'
import { useEffect, useRef, useState } from 'react'
import { IoChevronDown } from 'react-icons/io5'
import { Link, useLocation } from 'react-router-dom'

const triggerClassName =
  'inline-flex h-10 items-center gap-2 rounded-md px-4 text-sm leading-none font-semibold text-(--text-secondary) transition-colors hover:bg-black/5 hover:text-(--text-primary) dark:text-(--text-primary)/80 dark:hover:bg-white/8 dark:hover:text-(--text-primary)'

const menuItemClassName =
  'block w-full rounded-md px-3 py-2 text-left text-[12px] font-medium text-(--text-secondary) transition-colors hover:bg-black/5 hover:text-(--text-primary) dark:hover:bg-white/8 dark:hover:text-(--text-primary)'

export function FtthToolsDesktopMenu() {
  const location = useLocation()
  const rootRef = useRef<HTMLDivElement | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const isToolsActive = location.pathname.startsWith('/ftth/herramientas')

  useEffect(() => {
    setIsOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!isOpen) return
    const onClickOutside = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false)
    }
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    document.addEventListener('keydown', onEscape)
    return () => {
      document.removeEventListener('mousedown', onClickOutside)
      document.removeEventListener('keydown', onEscape)
    }
  }, [isOpen])

  return (
    <div
      ref={rootRef}
      className={clsx('relative hidden md:block', isOpen && 'z-70')}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        type="button"
        className={clsx(
          triggerClassName,
          (isOpen || isToolsActive) &&
            'bg-black/6 text-(--text-primary) dark:bg-white/10 dark:text-(--text-primary)',
        )}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onMouseEnter={() => setIsOpen(true)}
        onClick={() => setIsOpen((open) => !open)}
      >
        Herramientas
        <IoChevronDown
          size={14}
          className={clsx(
            'transition-transform',
            isOpen ? 'rotate-180 text-(--primary-2) dark:text-(--secondary)' : '',
          )}
          aria-hidden
        />
      </button>

      {isOpen ? (
        <div
          role="menu"
          aria-label="Menú de herramientas"
          className="absolute left-0 top-[calc(100%+0.4rem)] z-70 min-w-[220px] rounded-xl border border-black/10 bg-(--card) p-1.5 shadow-[0_14px_28px_rgba(15,23,42,0.14)] dark:border-white/10 dark:shadow-[0_16px_34px_rgba(0,0,0,0.42)]"
          onMouseEnter={() => setIsOpen(true)}
        >
          <Link to="/ftth/herramientas/recalcular-onts" className={menuItemClassName} role="menuitem">
            Recalcular ONTs
          </Link>
          <Link
            to="/ftth/herramientas/validacion-fusion"
            className={menuItemClassName}
            role="menuitem"
          >
            Validación fusión
          </Link>
        </div>
      ) : null}
    </div>
  )
}
