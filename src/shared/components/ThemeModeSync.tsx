import { useEffect, useLayoutEffect, useRef } from 'react'

import {
  applyDarkClass,
  DARK_THEME_CLASS,
  persistThemeMode,
  resolveDarkAppearance,
  setFaviconByTheme,
} from '@/shared/lib/theme'
import { crossfadeThemeApply, prefersReducedThemeMotion } from '@/shared/lib/theme-crossfade'
import { useUiStore } from '@/shared/stores/ui-store'

const SENSOR_DARK_LUX_THRESHOLD = 45
const CAMERA_DARK_BRIGHTNESS_THRESHOLD = 95
const CAMERA_LIGHT_BRIGHTNESS_THRESHOLD = 125

function stopMediaStreamTracks(stream: MediaStream) {
  for (const track of stream.getTracks()) {
    track.stop()
  }
}

/**
 * Aplica claro/oscuro y, en modo `auto`, usa AmbientLightSensor o cámara
 * para estimar la iluminación del entorno (misma lógica que tau-nova).
 */
export function ThemeModeSync() {
  const themeMode = useUiStore((state) => state.themeMode)
  const autoRunIdRef = useRef(0)
  const hasAppliedThemeRef = useRef(false)
  const lastDarkModeRef = useRef<boolean | null>(null)

  useLayoutEffect(() => {
    // En auto, la iluminación ambiente se aplica en el effect de sensores.
    if (themeMode === 'auto' && hasAppliedThemeRef.current) {
      return
    }

    const isDarkMode = resolveDarkAppearance(themeMode)

    if (lastDarkModeRef.current === isDarkMode) {
      return
    }

    const commitThemeClass = () => {
      applyDarkClass(isDarkMode)
      lastDarkModeRef.current = isDarkMode
    }

    const shouldCrossfade = hasAppliedThemeRef.current && !prefersReducedThemeMotion()
    hasAppliedThemeRef.current = true

    if (!shouldCrossfade) {
      commitThemeClass()
      return
    }

    crossfadeThemeApply(commitThemeClass, isDarkMode, {
      respectAutoCooldown: themeMode === 'auto',
    })
  }, [themeMode])

  useEffect(() => {
    persistThemeMode(themeMode)
  }, [themeMode])

  useEffect(() => {
    if (themeMode !== 'auto') {
      return
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const runId = ++autoRunIdRef.current
    let hasAmbientReading = false
    let isDisposed = false
    let stopCameraSampling: (() => void) | null = null
    let sensorCleanup: (() => void) | null = null
    let mediaQueryCleanup: (() => void) | null = null

    const applyAmbientDarkness = (isDarkMode: boolean) => {
      hasAmbientReading = true

      if (lastDarkModeRef.current === isDarkMode) {
        return
      }

      const commitThemeClass = () => {
        document.documentElement.classList.toggle(DARK_THEME_CLASS, isDarkMode)
        setFaviconByTheme(isDarkMode)
        lastDarkModeRef.current = isDarkMode
      }

      if (prefersReducedThemeMotion()) {
        commitThemeClass()
        return
      }

      crossfadeThemeApply(commitThemeClass, isDarkMode, { respectAutoCooldown: true })
    }

    const onSystemThemeChange = () => {
      if (!hasAmbientReading) {
        applyAmbientDarkness(mediaQuery.matches)
      }
    }

    const startCameraFallback = async () => {
      if (stopCameraSampling) {
        return
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
          audio: false,
        })

        if (isDisposed || runId !== autoRunIdRef.current) {
          stopMediaStreamTracks(stream)
          return
        }

        const video = document.createElement('video')
        video.srcObject = stream
        video.muted = true
        video.playsInline = true
        await video.play()

        const canvas = document.createElement('canvas')
        canvas.width = 40
        canvas.height = 30
        const context = canvas.getContext('2d', { willReadFrequently: true })
        let lastDarkDecision: boolean | null = null

        if (!context) {
          stopMediaStreamTracks(stream)
          return
        }

        const sample = () => {
          if (isDisposed || runId !== autoRunIdRef.current) {
            return
          }

          if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
            return
          }

          context.drawImage(video, 0, 0, canvas.width, canvas.height)
          const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data
          let brightnessTotal = 0

          for (let i = 0; i < pixels.length; i += 4) {
            brightnessTotal += 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2]
          }

          const avgBrightness = brightnessTotal / (pixels.length / 4)
          let nextDarkDecision =
            lastDarkDecision ?? avgBrightness < CAMERA_DARK_BRIGHTNESS_THRESHOLD

          if (avgBrightness <= CAMERA_DARK_BRIGHTNESS_THRESHOLD) {
            nextDarkDecision = true
          } else if (avgBrightness >= CAMERA_LIGHT_BRIGHTNESS_THRESHOLD) {
            nextDarkDecision = false
          }

          if (nextDarkDecision !== lastDarkDecision) {
            lastDarkDecision = nextDarkDecision
            applyAmbientDarkness(nextDarkDecision)
          }
        }

        sample()
        const intervalId = window.setInterval(sample, 1500)

        stopCameraSampling = () => {
          window.clearInterval(intervalId)
          video.pause()
          stopMediaStreamTracks(stream)
          video.srcObject = null
        }
      } catch {
        // Fallback: seguir con prefers-color-scheme.
      }
    }

    type LegacyMediaQueryList = MediaQueryList & {
      addListener?: (listener: (event: MediaQueryListEvent) => void) => void
      removeListener?: (listener: (event: MediaQueryListEvent) => void) => void
    }
    const legacyMediaQuery = mediaQuery as LegacyMediaQueryList
    const onSystemThemeChangeLegacy = () => {
      onSystemThemeChange()
    }

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', onSystemThemeChange)
      mediaQueryCleanup = () => {
        mediaQuery.removeEventListener('change', onSystemThemeChange)
      }
    } else if (typeof legacyMediaQuery.addListener === 'function') {
      legacyMediaQuery.addListener(onSystemThemeChangeLegacy)
      mediaQueryCleanup = () => {
        legacyMediaQuery.removeListener?.(onSystemThemeChangeLegacy)
      }
    }

    if ('AmbientLightSensor' in window) {
      try {
        const SensorCtor = (
          window as Window & {
            AmbientLightSensor?: new (options?: {
              frequency?: number
            }) => {
              illuminance: number
              start: () => void
              stop: () => void
              addEventListener: (type: string, listener: () => void) => void
              removeEventListener: (type: string, listener: () => void) => void
            }
          }
        ).AmbientLightSensor

        if (SensorCtor) {
          const sensor = new SensorCtor({ frequency: 0.8 })
          const onReading = () => {
            applyAmbientDarkness(sensor.illuminance < SENSOR_DARK_LUX_THRESHOLD)
          }
          const onSensorError = () => {
            void startCameraFallback()
          }

          sensor.addEventListener('reading', onReading)
          sensor.addEventListener('error', onSensorError)
          sensor.start()

          sensorCleanup = () => {
            sensor.removeEventListener('reading', onReading)
            sensor.removeEventListener('error', onSensorError)
            sensor.stop()
          }
        } else {
          void startCameraFallback()
        }
      } catch {
        void startCameraFallback()
      }
    } else {
      void startCameraFallback()
    }

    return () => {
      isDisposed = true
      mediaQueryCleanup?.()
      sensorCleanup?.()
      stopCameraSampling?.()
    }
  }, [themeMode])

  return null
}
