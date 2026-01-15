import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react'
import './harness.css'

export default function Surfaces() {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar className="app-header">
          <IonTitle>Surfaces</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="harness-content">
        <div className="harness-shell">
          <section className="harness-section">
            <div className="type-caption-tight">Backgrounds</div>
            <div className="harness-card surface-grid">
              <div className="surface-row">
                <div className="surface-swatch surface-swatch--app">
                  <div className="type-body-strong">App background</div>
                  <div className="surface-meta">--app-background</div>
                </div>
                <div className="surface-swatch surface-swatch--surface-1">
                  <div className="type-body-strong">Surface 1</div>
                  <div className="surface-meta">--surface-1</div>
                </div>
                <div className="surface-swatch surface-swatch--surface-2">
                  <div className="type-body-strong">Surface 2</div>
                  <div className="surface-meta">--surface-2</div>
                </div>
                <div className="surface-swatch surface-swatch--surface-3">
                  <div className="type-body-strong">Surface 3</div>
                  <div className="surface-meta">--surface-3</div>
                </div>
              </div>
            </div>
          </section>

          <section className="harness-section">
            <div className="type-caption-tight">Borders + Elevation</div>
            <div className="harness-card surface-grid">
              <div className="surface-row">
                <div className="surface-swatch surface-swatch--surface-1">
                  <div className="type-body-strong">Border 1</div>
                  <div className="surface-meta">--border-1</div>
                </div>
                <div className="surface-swatch surface-swatch--surface-1" style={{ borderColor: 'var(--border-2)' }}>
                  <div className="type-body-strong">Border 2</div>
                  <div className="surface-meta">--border-2</div>
                </div>
                <div className="surface-swatch surface-swatch--elevated">
                  <div className="type-body-strong">Elevation</div>
                  <div className="surface-meta">--shadow-1</div>
                </div>
                <div className="surface-swatch surface-swatch--surface-1">
                  <div className="type-body-strong">Ink</div>
                  <div className="surface-meta">--text-1 / --text-2 / --text-3</div>
                  <div className="type-caption">Secondary ink sample</div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </IonContent>
    </IonPage>
  )
}
