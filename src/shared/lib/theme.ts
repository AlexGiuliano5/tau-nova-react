export type ThemeMode = 'light' | 'dark' | 'auto'

export const THEME_STORAGE_KEY = 'tau-theme-mode'
export const DARK_THEME_CLASS = 'dm'
export const DEFAULT_THEME_MODE: ThemeMode = 'light'

export const LIGHT_FAVICON_HREF = '/imgs/tau-favicon-light-round.ico'
export const DARK_FAVICON_HREF = '/imgs/tau-favicon-dark-round.png'
export const LIGHT_APPLE_TOUCH_ICON_HREF = '/imgs/tau-favicon-light-round.png'
export const DARK_APPLE_TOUCH_ICON_HREF = '/imgs/tau-favicon-dark-round.png'
export const LIGHT_HEADER_BRAND_ICON_HREF = '/imgs/tau-favicon-light-round.png'
export const DARK_HEADER_BRAND_ICON_HREF = '/imgs/tau-favicon-dark-round.png'

export function isThemeMode(value: string): value is ThemeMode {
  return value === 'light' || value === 'dark' || value === 'auto'
}

export function parseThemeModeValue(value: string | undefined | null): ThemeMode | null {
  if (!value?.trim()) return null
  const normalized = value.trim()
  return isThemeMode(normalized) ? normalized : null
}

/** Resolución inmediata (OS) para bootstrap; en `auto` la cámara/sensor refina después. */
export function resolveDarkAppearance(themeMode: ThemeMode): boolean {
  if (themeMode === 'dark') return true
  if (themeMode === 'light') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function getThemeFaviconHref(isDarkMode: boolean): string {
  return isDarkMode ? DARK_FAVICON_HREF : LIGHT_FAVICON_HREF
}

export function getAppleTouchIconHref(isDarkMode: boolean): string {
  return isDarkMode ? DARK_APPLE_TOUCH_ICON_HREF : LIGHT_APPLE_TOUCH_ICON_HREF
}

function getFaviconLinkType(href: string): 'image/png' | 'image/x-icon' {
  return href.includes('.png') ? 'image/png' : 'image/x-icon'
}

export function setFaviconByTheme(isDarkMode: boolean): void {
  const cacheToken = isDarkMode ? 'dark' : 'light'
  const nextFaviconHref = `${getThemeFaviconHref(isDarkMode)}?theme=${cacheToken}`
  const nextAppleTouchIconHref = `${getAppleTouchIconHref(isDarkMode)}?theme=${cacheToken}`
  const nextFaviconType = getFaviconLinkType(nextFaviconHref)

  const faviconLinks = Array.from(
    document.querySelectorAll<HTMLLinkElement>('link[rel~="icon"]'),
  ).filter((linkElement) => linkElement.rel !== 'apple-touch-icon')

  if (faviconLinks.length === 0) {
    const iconLink = document.createElement('link')
    iconLink.rel = 'icon'
    iconLink.type = nextFaviconType
    iconLink.href = nextFaviconHref
    document.head.appendChild(iconLink)
  } else {
    for (const linkElement of faviconLinks) {
      linkElement.href = nextFaviconHref
      linkElement.type = nextFaviconType
      linkElement.removeAttribute('media')
    }
  }

  const appleTouchIconLink = document.querySelector<HTMLLinkElement>(
    'link[rel="apple-touch-icon"]',
  )
  if (appleTouchIconLink) {
    appleTouchIconLink.href = nextAppleTouchIconHref
    appleTouchIconLink.type = 'image/png'
  } else {
    const nextAppleTouchIconLink = document.createElement('link')
    nextAppleTouchIconLink.rel = 'apple-touch-icon'
    nextAppleTouchIconLink.type = 'image/png'
    nextAppleTouchIconLink.href = nextAppleTouchIconHref
    document.head.appendChild(nextAppleTouchIconLink)
  }
}

export function applyDarkClass(isDarkMode: boolean): void {
  document.documentElement.classList.toggle(DARK_THEME_CLASS, isDarkMode)
  setFaviconByTheme(isDarkMode)
}

export function readStoredThemeMode(): ThemeMode {
  try {
    return parseThemeModeValue(localStorage.getItem(THEME_STORAGE_KEY)) ?? DEFAULT_THEME_MODE
  } catch {
    return DEFAULT_THEME_MODE
  }
}

export function persistThemeMode(themeMode: ThemeMode): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, themeMode)
  } catch {
    // ignore
  }
}
