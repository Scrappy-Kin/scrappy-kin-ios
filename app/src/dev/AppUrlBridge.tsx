import { App as CapacitorApp } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { Preferences } from '@capacitor/preferences'
import { useEffect } from 'react'
import { useHistory } from 'react-router-dom'

const CAPTURE_ROUTE_KEY = 'dev_capture_route'

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

  const allowedRoots = [
    '/home',
    '/flow',
    '/onboarding',
    '/gmail',
    '/review-batch',
    '/settings',
    '/ui-harness',
    '/capture',
  ]
  if (!allowedRoots.some((root) => route === root || route.startsWith(`${root}/`) || route.startsWith(`${root}?`))) {
    return null
  }

  return route
}

function normalizeCaptureRoute(route: string) {
  if (!route.startsWith('/')) {
    route = `/${route}`
  }

  const [pathAndSearch, hash = ''] = route.split('#', 2)
  const [path, search = ''] = pathAndSearch.split('?', 2)
  const params = new URLSearchParams(search)
  params.set('qa', '1')
  const query = params.toString()

  return `${path}${query ? `?${query}` : ''}${hash ? `#${hash}` : ''}`
}

export default function AppUrlBridge() {
  const history = useHistory()

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return

    const navigateIfNeeded = (url?: string | null, options?: { alreadyRoute?: boolean }) => {
      if (!url) return
      const route = options?.alreadyRoute ? normalizeCaptureRoute(url) : toAppRoute(url)
      if (!route) return
      history.replace(route)
    }

    void Preferences.get({ key: CAPTURE_ROUTE_KEY }).then(async (result) => {
      if (!result.value) return
      await Preferences.remove({ key: CAPTURE_ROUTE_KEY })
      navigateIfNeeded(result.value, { alreadyRoute: true })
    })

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
