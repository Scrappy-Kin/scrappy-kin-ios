import { IonContent, IonPage } from '@ionic/react'
import { useEffect, useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import AppText from '../ui/primitives/AppText'
import { applyCaptureScenario } from './captureScenarios'

type CaptureRouteParams = {
  scenario: string
}

type CaptureScenarioRouteProps = {
  scenarioOverride?: string
  searchOverride?: string
}

export function CaptureScenarioRunner({
  scenario,
  search,
}: {
  scenario: string
  search: string
}) {
  const [error, setError] = useState<string | null>(null)
  const [preparedRoute, setPreparedRoute] = useState<string | null>(null)
  const qaArmed = new URLSearchParams(search).get('qa') === '1'
  const inspectMode = new URLSearchParams(search).get('inspect') === '1'

  useEffect(() => {
    if (!qaArmed) return

    let cancelled = false

    applyCaptureScenario(scenario)
      .then((targetRoute) => {
        if (cancelled) return
        if (inspectMode) {
          setPreparedRoute(targetRoute)
          return
        }
        // Capture routes need a cold boot from seeded storage so stale in-memory
        // onboarding state cannot leak between scenarios in the same browser session.
        window.location.replace(targetRoute)
      })
      .catch((cause) => {
        if (cancelled) return
        setError((cause as Error).message ?? 'Capture scenario failed.')
      })

    return () => {
      cancelled = true
    }
  }, [inspectMode, qaArmed, scenario])

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
