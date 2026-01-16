import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react'
import { Link } from 'react-router-dom'
import './harness.css'

export default function HarnessHome() {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar className="app-header">
          <IonTitle>UI Harness</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="harness-content">
        <div className="harness-shell">
          <section className="harness-header">
            <div className="type-lead">Scrappy Kin UI System</div>
            <div className="type-body">
              Explore tokens in isolation before applying primitives.
            </div>
          </section>

          <section className="harness-card harness-nav">
            <Link className="harness-link" to="/ui-harness/typography">
              Typography
            </Link>
            <Link className="harness-link" to="/ui-harness/surfaces">
              Surfaces
            </Link>
          </section>
        </div>
      </IonContent>
    </IonPage>
  )
}
