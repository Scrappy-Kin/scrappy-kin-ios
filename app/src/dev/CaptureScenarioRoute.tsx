import { IonContent, IonPage } from '@ionic/react'
import { useEffect, useState } from 'react'
import { useHistory, useLocation, useParams } from 'react-router-dom'
import AppText from '../ui/primitives/AppText'
import { applyCaptureScenario } from './captureScenarios'

type CaptureRouteParams = {
  scenario: string
}

export default function CaptureScenarioRoute() {
  const history = useHistory()
  const location = useLocation()
  const { scenario } = useParams<CaptureRouteParams>()
  const [error, setError] = useState<string | null>(null)
  const qaArmed = new URLSearchParams(location.search).get('qa') === '1'

  useEffect(() => {
    if (!qaArmed) return

    let cancelled = false

    applyCaptureScenario(scenario)
      .then((targetRoute) => {
        if (cancelled) return
        history.replace(targetRoute)
      })
      .catch((cause) => {
        if (cancelled) return
        setError((cause as Error).message ?? 'Capture scenario failed.')
      })

      return () => {
      cancelled = true
    }
  }, [history, qaArmed, scenario])

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
              {error ? <AppText intent="body" tone="danger">{error}</AppText> : null}
            </>
          )}
        </div>
      </IonContent>
    </IonPage>
  )
}
