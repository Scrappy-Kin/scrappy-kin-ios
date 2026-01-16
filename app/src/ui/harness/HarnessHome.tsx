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
      <IonContent className="app-content">
        <div className="app-shell">
          <section className="app-section-header">
            <div className="type-lead">Scrappy Kin UI System</div>
            <div className="type-body">Review tokens and primitives in isolation.</div>
          </section>

          <section className="app-card app-nav">
            <Link className="app-link" to="/ui-harness/typography">
              Typography
            </Link>
            <Link className="app-link" to="/ui-harness/surfaces">
              Surfaces
            </Link>
          </section>
        </div>
      </IonContent>
    </IonPage>
  )
}
