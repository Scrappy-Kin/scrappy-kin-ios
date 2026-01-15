import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react'
import './harness.css'

export default function Typography() {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar className="app-header">
          <IonTitle>Typography</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="harness-content">
        <div className="harness-shell">
          <section className="harness-section">
            <div className="type-caption-tight">Headings</div>
            <div className="harness-card type-stack">
              <div className="type-row">
                <div className="type-meta">Display</div>
                <div className="type-display">Trust starts with clarity.</div>
              </div>
              <div className="type-row">
                <div className="type-meta">Title</div>
                <div className="type-title">Scrappy Kin keeps your data local.</div>
              </div>
              <div className="type-row">
                <div className="type-meta">Heading</div>
                <div className="type-heading">Send requests without giving away access.</div>
              </div>
            </div>
          </section>

          <section className="harness-section">
            <div className="type-caption-tight">Body</div>
            <div className="harness-card type-stack">
              <div className="type-row">
                <div className="type-meta">Body</div>
                <div className="type-body">
                  We keep every request on-device. Nothing is uploaded until you press send.
                </div>
              </div>
              <div className="type-row">
                <div className="type-meta">Body Strong</div>
                <div className="type-body-strong">
                  You control when and where your requests go.
                </div>
              </div>
            </div>
          </section>

          <section className="harness-section">
            <div className="type-caption-tight">Caption</div>
            <div className="harness-card type-stack">
              <div className="type-row">
                <div className="type-meta">Caption</div>
                <div className="type-caption">Last sync: 2 minutes ago</div>
              </div>
              <div className="type-row">
                <div className="type-meta">Caption Tight</div>
                <div className="type-caption-tight">LOCAL ONLY</div>
              </div>
            </div>
          </section>
        </div>
      </IonContent>
    </IonPage>
  )
}
