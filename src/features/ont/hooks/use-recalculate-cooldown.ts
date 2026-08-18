import { useCallback, useEffect, useRef, useState } from 'react'

export const RECALCULATE_COOLDOWN_SECONDS = 10

export function useRecalculateCooldown(cooldownSeconds = RECALCULATE_COOLDOWN_SECONDS) {
  const [secondsRemaining, setSecondsRemaining] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearCooldownTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const startCooldown = useCallback(() => {
    clearCooldownTimer()
    setSecondsRemaining(cooldownSeconds)
    intervalRef.current = setInterval(() => {
      setSecondsRemaining((previousSeconds) => {
        if (previousSeconds <= 1) {
          clearCooldownTimer()
          return 0
        }
        return previousSeconds - 1
      })
    }, 1000)
  }, [clearCooldownTimer, cooldownSeconds])

  useEffect(() => () => clearCooldownTimer(), [clearCooldownTimer])

  return {
    secondsRemaining,
    isOnCooldown: secondsRemaining > 0,
    startCooldown,
  }
}

export function buildRecalculateActionLabel(options: {
  baseLabel?: string
  loadingLabel?: string
  isLoading?: boolean
  cooldownSeconds?: number
}): string {
  const {
    baseLabel = 'Recalcular ONTs',
    loadingLabel = 'Recalculando…',
    isLoading = false,
    cooldownSeconds = 0,
  } = options

  if (cooldownSeconds > 0) return `Podés recalcular en ${cooldownSeconds}s`
  if (isLoading) return loadingLabel
  return baseLabel
}
