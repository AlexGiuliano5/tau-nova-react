import type { ReactNode } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

import { PreferencesShell } from '@/features/ont-preferences/components/PreferencesShell'
import { preferencesSections } from '@/features/ont-preferences/lib/preferences-sections'
import { FtthBreadcrumb } from '@/features/shell/components/FtthBreadcrumb'

export function PreferencesLayout() {
  const location = useLocation()
  const section = preferencesSections.find(
    (item) =>
      location.pathname === item.href || location.pathname.startsWith(`${item.href}/`),
  )

  const isRoot = location.pathname === '/ftth/preferencias'
  const title = section?.label ?? 'Preferencias'
  const backHref = isRoot ? '/ftth' : '/ftth/preferencias'
  const desktopItems = isRoot
    ? [
        { label: 'Home', href: '/ftth' },
        { label: 'Preferencias' },
      ]
    : [
        { label: 'Home', href: '/ftth' },
        { label: 'Preferencias', href: '/ftth/preferencias' },
        { label: title },
      ]

  return (
    <>
      <FtthBreadcrumb title={title} backHref={backHref} desktopItems={desktopItems} />
      <PreferencesShell>
        <Outlet />
      </PreferencesShell>
    </>
  )
}

// re-export for pages that wrap content
export type PreferencesLayoutChildren = ReactNode
