import { IonContent, IonPage } from '@ionic/react'
import { useHistory, useLocation } from 'react-router-dom'
import { DEFAULT_ROUND_SIZE } from '../services/brokerStore'
import { readReturnTo } from '../services/navigation'
import AppButton from '../ui/primitives/AppButton'
import AppHeading from '../ui/primitives/AppHeading'
import AppText from '../ui/primitives/AppText'
import AppTopNav from '../ui/patterns/AppTopNav'

export default function BatchSizePlaceholder() {
  const history = useHistory()
  const location = useLocation()
  const returnTo = readReturnTo(location.search) ?? '/review-batch'

  return (
    <IonPage>
      <IonContent className="page-content">
        <div className="app-screen-shell">
          <AppTopNav backHref={returnTo} />
          <AppHeading intent="section" level={1}>
            Round size
          </AppHeading>
          <section className="app-section-shell">
            <AppText intent="body">
              Placeholder for choosing how many brokers go into the next round.
            </AppText>
            <AppText intent="supporting">
              Default is {DEFAULT_ROUND_SIZE} brokers. The full control is still being mocked up.
            </AppText>
            <AppButton fullWidth onClick={() => history.replace(returnTo)}>
              Back to review
            </AppButton>
          </section>
        </div>
      </IonContent>
    </IonPage>
  )
}
