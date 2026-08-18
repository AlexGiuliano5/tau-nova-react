import clsx from 'clsx'
import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'

import { PreferencesNav } from '@/features/ont-preferences/components/PreferencesNav'

interface PreferencesShellProps {
  children: ReactNode
}

export function PreferencesShell({ children }: PreferencesShellProps) {
  const location = useLocation()
  const isRoot = location.pathname === '/ftth/preferencias'

  return (
    <div className="flex min-h-[calc(100dvh-70px-50px)] flex-1 flex-col md:min-h-[calc(100dvh-58px-36px)] md:flex-row md:items-stretch">
      <PreferencesNav className={clsx(isRoot ? 'flex' : 'hidden md:flex')} />

      <div
        className={clsx(
          'flex min-h-0 min-w-0 flex-1 flex-col bg-(--background)',
          isRoot && 'hidden md:flex',
        )}
      >
        {children}
      </div>
    </div>
  )
}
