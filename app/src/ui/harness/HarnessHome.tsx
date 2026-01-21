import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react'
import { Link } from 'react-router-dom'
import AppCard from '../primitives/AppCard'
import './harness.css'

export default function HarnessHome() {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar className="app-header">
          <IonTitle>UI Harness</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="app-content">
        <div className="app-shell">
          <section className="app-section-header">
            <div className="t-lg lh-lg w-400 text-primary">Scrappy Kin UI System</div>
            <div className="t-base lh-md w-400 text-primary">Review tokens, primitives, and patterns.</div>
          </section>

          <AppCard>
            <div className="app-nav">
              <Link className="app-link" to="/ui-harness/tokens">
                Tokens
              </Link>
              <Link className="app-link" to="/ui-harness/primitives">
                Primitives
              </Link>
              <Link className="app-link" to="/ui-harness/patterns">
                Patterns
              </Link>
            </div>
          </AppCard>
        </div>
      </IonContent>
    </IonPage>
  )
}
