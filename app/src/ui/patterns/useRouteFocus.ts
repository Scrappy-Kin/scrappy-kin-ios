import { useIonViewDidEnter } from '@ionic/react'
import { useCallback, useEffect, type RefObject } from 'react'

type RouteFocusRef = RefObject<HTMLElement | null>

export function useRouteFocus(
  focusKey: unknown,
  enabled: boolean,
  primaryRef: RouteFocusRef,
  fallbackRef?: RouteFocusRef,
) {
  const scheduleRouteFocus = useCallback(() => {
    if (!enabled) return undefined

    const frame = requestAnimationFrame(() => {
      const target = primaryRef.current ?? fallbackRef?.current
      target?.focus({ preventScroll: true })
    })

    return () => cancelAnimationFrame(frame)
  }, [enabled, fallbackRef, primaryRef])

  useEffect(() => scheduleRouteFocus(), [focusKey, scheduleRouteFocus])

  useIonViewDidEnter(() => {
    scheduleRouteFocus()
  })
}
