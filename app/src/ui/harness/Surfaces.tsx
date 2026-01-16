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
              <div className="surface-row surface-row--backgrounds">
                <div className="surface-swatch surface-swatch--app surface-swatch--span-two">
                  <div className="type-body-strong">App background</div>
                  <div className="type-caption">--app-background</div>
                </div>
                <div className="surface-swatch surface-swatch--surface-1">
                  <div className="type-body-strong">Surface 1</div>
                  <div className="type-caption">--surface-1</div>
                </div>
                <div className="surface-swatch surface-swatch--surface-2">
                  <div className="type-body-strong">Surface 2</div>
                  <div className="type-caption">--surface-2</div>
                </div>
              </div>
            </div>
          </section>

          <section className="harness-section">
            <div className="type-caption-tight">Ink</div>
            <div className="harness-card surface-grid">
              <div className="surface-row">
                <div className="surface-swatch surface-swatch--surface-1">
                  <div className="type-body-strong">Ink</div>
                  <div className="type-stack">
                    <div className="type-caption" style={{ color: 'var(--text-1)' }}>
                      --text-1 Primary ink sample
                    </div>
                    <div className="type-caption" style={{ color: 'var(--text-2)' }}>
                      --text-2 Secondary ink sample
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="harness-section">
            <div className="type-caption-tight">Borders</div>
            <div className="harness-card surface-grid">
              <div className="surface-row">
                <div className="surface-swatch surface-swatch--surface-1">
                  <div className="type-body-strong">Border 1</div>
                  <div className="type-caption">--border-1</div>
                </div>
                <div className="surface-swatch surface-swatch--surface-1" style={{ borderColor: 'var(--border-2)' }}>
                  <div className="type-body-strong">Border 2</div>
                  <div className="type-caption">--border-2</div>
                </div>
              </div>
            </div>
          </section>

          <section className="harness-section">
            <div className="type-caption-tight">Elevation</div>
            <div className="harness-card surface-grid">
              <div className="surface-row">
                <div className="surface-swatch surface-swatch--elevated">
                  <div className="type-body-strong">Elevation</div>
                  <div className="type-caption">--shadow-1</div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </IonContent>
    </IonPage>
  )
}
