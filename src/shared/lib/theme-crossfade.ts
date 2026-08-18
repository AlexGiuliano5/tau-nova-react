const _crossfadeActiveClass = 'tau-theme-crossfade-active'
const _autoCrossfadeCooldownMs = 2000

let _crossfadeInFlight = false
let _crossfadeCooldownUntil = 0

export function prefersReducedThemeMotion(): boolean {
  if (typeof window === 'undefined') {
    return false
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

type CrossfadeOptions = {
  /** En modo auto (sensor/cámara) evita transiciones seguidas. */
  respectAutoCooldown?: boolean
}

function runApplyWithFrozenTransitions(apply: () => void): void {
  const htmlElement = document.documentElement
  htmlElement.classList.add(_crossfadeActiveClass)
  try {
    apply()
  } finally {
    requestAnimationFrame(() => {
      htmlElement.classList.remove(_crossfadeActiveClass)
    })
  }
}

function runViewTransition(apply: () => void): void {
  const htmlElement = document.documentElement
  htmlElement.classList.add(_crossfadeActiveClass)

  const isExpectedTransitionAbort = (error: unknown): boolean => {
    const domErrorName =
      typeof error === 'object' &&
      error !== null &&
      'name' in error &&
      typeof (error as { name?: unknown }).name === 'string'
        ? (error as { name: string }).name
        : ''

    return domErrorName === 'AbortError' || domErrorName === 'InvalidStateError'
  }

  try {
    const transition = document.startViewTransition(() => {
      apply()
    })

    void transition.ready.catch((error) => {
      if (!isExpectedTransitionAbort(error)) {
        console.error('[ThemeCrossfade] ViewTransition ready falló', error)
      }
    })

    void transition.updateCallbackDone.catch((error) => {
      if (!isExpectedTransitionAbort(error)) {
        console.error('[ThemeCrossfade] ViewTransition update falló', error)
      }
    })

    void transition.finished
      .catch((error) => {
        if (!isExpectedTransitionAbort(error)) {
          console.error('[ThemeCrossfade] ViewTransition falló', error)
        }
      })
      .finally(() => {
        htmlElement.classList.remove(_crossfadeActiveClass)
        _crossfadeInFlight = false
      })
  } catch (error) {
    htmlElement.classList.remove(_crossfadeActiveClass)
    _crossfadeInFlight = false
    runApplyWithFrozenTransitions(apply)
    console.warn('[ThemeCrossfade] Fallback sin ViewTransition', error)
  }
}

export function crossfadeThemeApply(
  apply: () => void,
  _targetIsDark: boolean,
  options: CrossfadeOptions = {},
): void {
  const { respectAutoCooldown = false } = options

  if (prefersReducedThemeMotion()) {
    apply()
    return
  }

  if (respectAutoCooldown && Date.now() < _crossfadeCooldownUntil) {
    apply()
    return
  }

  if (_crossfadeInFlight) {
    apply()
    return
  }

  _crossfadeInFlight = true
  if (respectAutoCooldown) {
    _crossfadeCooldownUntil = Date.now() + _autoCrossfadeCooldownMs
  }

  if (typeof document.startViewTransition === 'function') {
    runViewTransition(apply)
    return
  }

  runApplyWithFrozenTransitions(apply)
  _crossfadeInFlight = false
}
