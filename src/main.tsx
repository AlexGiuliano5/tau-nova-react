import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { App } from '@/App'
import { useAuthStore } from '@/features/auth/store/auth-store'
import { useUiStore } from '@/shared/stores/ui-store'
import '@/index.css'

useAuthStore.getState().hydrateFromStorage()
useUiStore.getState().hydrateTheme()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
