import { useSyncExternalStore } from 'react'

const MD_QUERY = '(min-width: 768px)'

/** `true` cuando el viewport cumple breakpoint Tailwind `md` (768px). */
export function useMdUp(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

function subscribe(onStoreChange: () => void): () => void {
  const mediaQuery = window.matchMedia(MD_QUERY)
  mediaQuery.addEventListener('change', onStoreChange)
  return () => mediaQuery.removeEventListener('change', onStoreChange)
}

function getSnapshot(): boolean {
  return window.matchMedia(MD_QUERY).matches
}

function getServerSnapshot(): boolean {
  return false
}
