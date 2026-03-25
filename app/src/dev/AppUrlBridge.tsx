import { App as CapacitorApp } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { useEffect } from 'react'
import { useHistory } from 'react-router-dom'

function toAppRoute(urlString: string) {
  let parsed: URL
  try {
    parsed = new URL(urlString)
  } catch {
    return null
  }

  if (parsed.pathname === '/oauthredirect') {
    return null
  }

  const hostPath = parsed.host && parsed.host !== 'localhost'
    ? `/${parsed.host}${parsed.pathname}`
    : parsed.pathname || '/'
  const route = `${hostPath}${parsed.search}${parsed.hash}`

  if (route.startsWith('/capture') && parsed.searchParams.get('qa') !== '1') {
    return null
  }

  const allowedRoots = ['/home', '/flow', '/brokers', '/settings', '/ui-harness', '/capture']
  if (!allowedRoots.some((root) => route === root || route.startsWith(`${root}/`) || route.startsWith(`${root}?`))) {
    return null
  }

  return route
}

export default function AppUrlBridge() {
  const history = useHistory()

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return

    const navigateIfNeeded = (url?: string | null) => {
      if (!url) return
      const route = toAppRoute(url)
      if (!route) return
      history.replace(route)
    }

    void CapacitorApp.getLaunchUrl().then((result) => {
      navigateIfNeeded(result?.url)
    })

    const removePromise = CapacitorApp.addListener('appUrlOpen', (event) => {
      navigateIfNeeded(event.url)
    })

    return () => {
      void removePromise.then((listener) => listener.remove())
    }
  }, [history])

  return null
}
