import type { IconType } from 'react-icons'
import { IoGitNetworkOutline, IoHardwareChipOutline } from 'react-icons/io5'

export type PreferencesSectionId = 'arbol-ftth' | 'pantalla-ont'

export interface PreferencesSection {
  id: PreferencesSectionId
  label: string
  description: string
  href: string
  icon: IconType
  available: boolean
}

export const preferencesSections: PreferencesSection[] = [
  {
    id: 'arbol-ftth',
    label: 'Árbol FTTH',
    description: 'Regiones visibles en el menú de topología',
    href: '/ftth/preferencias/arbol',
    icon: IoGitNetworkOutline,
    available: true,
  },
  {
    id: 'pantalla-ont',
    label: 'Pantalla ONT',
    description: 'Cards y métricas en la pestaña Información',
    href: '/ftth/preferencias/ont',
    icon: IoHardwareChipOutline,
    available: true,
  },
]
