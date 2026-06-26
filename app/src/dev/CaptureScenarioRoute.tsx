import { IonContent, IonPage } from '@ionic/react'
import { Capacitor } from '@capacitor/core'
import { useEffect, useState } from 'react'
import { useHistory, useLocation, useParams } from 'react-router-dom'
import AppText from '../ui/primitives/AppText'
import { applyCaptureScenario } from './captureScenarios'

type CaptureRouteParams = {
  scenario: string
}

type CaptureScenarioRouteProps = {
  scenarioOverride?: string
  searchOverride?: string
}

function routeWithAuditParams(route: string, a11yText: string | null) {
  if (!a11yText) return route

  const [pathAndSearch, hash = ''] = route.split('#', 2)
  const [path, routeSearch = ''] = pathAndSearch.split('?', 2)
  const targetParams = new URLSearchParams(routeSearch)
  targetParams.set('a11yText', a11yText)
  const query = targetParams.toString()

  return `${path}${query ? `?${query}` : ''}${hash ? `#${hash}` : ''}`
}

export function CaptureScenarioRunner({
  scenario,
  search,
}: {
  scenario: string
  search: string
}) {
  const history = useHistory()
  const [error, setError] = useState<string | null>(null)
  const [preparedRoute, setPreparedRoute] = useState<string | null>(null)
  const params = new URLSearchParams(search)
  const qaArmed = params.get('qa') === '1'
  const inspectMode = params.get('inspect') === '1'
  const a11yText = params.get('a11yText')

  useEffect(() => {
    if (!qaArmed) return

    let cancelled = false

    applyCaptureScenario(scenario)
      .then((targetRoute) => {
        if (cancelled) return
        const preparedTargetRoute = routeWithAuditParams(targetRoute, a11yText)
        if (inspectMode) {
          setPreparedRoute(preparedTargetRoute)
          return
        }
        if (Capacitor.isNativePlatform()) {
          history.replace(preparedTargetRoute)
          return
        }
        // Capture routes need a cold boot from seeded storage so stale in-memory
        // onboarding state cannot leak between scenarios in the same browser session.
        window.location.replace(preparedTargetRoute)
      })
      .catch((cause) => {
        if (cancelled) return
        setError((cause as Error).message ?? 'Capture scenario failed.')
      })

    return () => {
      cancelled = true
    }
  }, [a11yText, history, inspectMode, qaArmed, scenario])

  return (
    <IonPage>
      <IonContent className="page-content">
        <div className="offline-shell">
          {!qaArmed ? (
            <AppText intent="body" tone="danger">
              QA arm missing. This route is for simulator capture only.
            </AppText>
          ) : (
            <>
              <AppText intent="body" emphasis>
                Preparing capture scenario…
              </AppText>
              {preparedRoute ? (
                <AppText intent="body">
                  {`Prepared ${scenario} -> ${preparedRoute}`}
                </AppText>
              ) : null}
              {error ? <AppText intent="body" tone="danger">{error}</AppText> : null}
            </>
          )}
        </div>
      </IonContent>
    </IonPage>
  )
}

export default function CaptureScenarioRoute({ scenarioOverride, searchOverride }: CaptureScenarioRouteProps) {
  const location = useLocation()
  const { scenario: routeScenario } = useParams<CaptureRouteParams>()
  return (
    <CaptureScenarioRunner
      scenario={scenarioOverride ?? routeScenario}
      search={searchOverride ?? location.search}
    />
  )
}
