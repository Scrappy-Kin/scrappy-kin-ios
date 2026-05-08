import { useEffect, type RefObject } from 'react'

type RouteFocusRef = RefObject<HTMLElement | null>

export function useRouteFocus(
  focusKey: unknown,
  enabled: boolean,
  primaryRef: RouteFocusRef,
  fallbackRef?: RouteFocusRef,
) {
  useEffect(() => {
    if (!enabled) return

    const frame = requestAnimationFrame(() => {
      const target = primaryRef.current ?? fallbackRef?.current
      target?.focus({ preventScroll: true })
    })

    return () => cancelAnimationFrame(frame)
  }, [enabled, fallbackRef, focusKey, primaryRef])
}
