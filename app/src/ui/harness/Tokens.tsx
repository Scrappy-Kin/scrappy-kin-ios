import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react'
import AppText from '../primitives/AppText'
import './harness.css'

export default function Tokens() {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar className="app-header">
          <IonTitle>Tokens</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="app-content">
        <div className="app-shell">
          <section className="app-section">
            <AppText intent="label">Palette tokens</AppText>
            <div className="spec-grid">
              <div className="spec-row">
                <div className="spec-cell" data-label="Token">--primary</div>
                <div className="spec-cell" data-label="Example">
                  <span className="spec-swatch">
                    <span className="spec-swatch__chip bg-primary" aria-hidden="true" />
                    <span className="t-sm lh-sm w-400">Primary</span>
                  </span>
                </div>
                <div className="spec-cell" data-label="Usage notes">Near-black default ink and primary actions.</div>
              </div>
              <div className="spec-row">
                <div className="spec-cell" data-label="Token">--secondary</div>
                <div className="spec-cell" data-label="Example">
                  <span className="spec-swatch">
                    <span className="spec-swatch__chip bg-secondary" aria-hidden="true" />
                    <span className="t-sm lh-sm w-400">Secondary</span>
                  </span>
                </div>
                <div className="spec-cell" data-label="Usage notes">Supporting text and secondary accents.</div>
              </div>
              <div className="spec-row">
                <div className="spec-cell" data-label="Token">--danger</div>
                <div className="spec-cell" data-label="Example">
                  <span className="spec-swatch">
                    <span className="spec-swatch__chip bg-danger" aria-hidden="true" />
                    <span className="t-sm lh-sm w-400">Danger</span>
                  </span>
                </div>
                <div className="spec-cell" data-label="Usage notes">Critical warnings and destructive actions.</div>
              </div>
              <div className="spec-row">
                <div className="spec-cell" data-label="Token">--neutral-0</div>
                <div className="spec-cell" data-label="Example">
                  <span className="spec-swatch">
                    <span className="spec-swatch__chip bg-neutral-0" aria-hidden="true" />
                    <span className="t-sm lh-sm w-400">Neutral 0</span>
                  </span>
                </div>
                <div className="spec-cell" data-label="Usage notes">App background.</div>
              </div>
              <div className="spec-row">
                <div className="spec-cell" data-label="Token">--neutral-50</div>
                <div className="spec-cell" data-label="Example">
                  <span className="spec-swatch">
                    <span className="spec-swatch__chip bg-neutral-50" aria-hidden="true" />
                    <span className="t-sm lh-sm w-400">Neutral 50</span>
                  </span>
                </div>
                <div className="spec-cell" data-label="Usage notes">Cards and default surfaces.</div>
              </div>
              <div className="spec-row">
                <div className="spec-cell" data-label="Token">--neutral-700</div>
                <div className="spec-cell" data-label="Example">
                  <span className="spec-swatch">
                    <span className="spec-swatch__chip bg-neutral-700" aria-hidden="true" />
                    <span className="t-sm lh-sm w-400">Neutral 700</span>
                  </span>
                </div>
                <div className="spec-cell" data-label="Usage notes">Secondary ink token value.</div>
              </div>
              <div className="spec-row">
                <div className="spec-cell" data-label="Token">--neutral-900</div>
                <div className="spec-cell" data-label="Example">
                  <span className="spec-swatch">
                    <span className="spec-swatch__chip bg-neutral-900" aria-hidden="true" />
                    <span className="t-sm lh-sm w-400">Neutral 900</span>
                  </span>
                </div>
                <div className="spec-cell" data-label="Usage notes">Primary ink token value.</div>
              </div>
            </div>
          </section>

          <section className="app-section">
            <AppText intent="label">Raw type utilities</AppText>
            <div className="spec-grid">
              <div className="spec-row">
                <div className="spec-cell" data-label="Class name">t-3xl</div>
                <div className="spec-cell" data-label="Example">
                  <span className="spec-example t-3xl">Hero size</span>
                </div>
                <div className="spec-cell" data-label="Usage notes">Use for hero only.</div>
              </div>
              <div className="spec-row">
                <div className="spec-cell" data-label="Class name">t-xl</div>
                <div className="spec-cell" data-label="Example">
                  <span className="spec-example t-xl">Section size</span>
                </div>
                <div className="spec-cell" data-label="Usage notes">Section headings.</div>
              </div>
              <div className="spec-row">
                <div className="spec-cell" data-label="Class name">t-base</div>
                <div className="spec-cell" data-label="Example">
                  <span className="spec-example t-base">Body size</span>
                </div>
                <div className="spec-cell" data-label="Usage notes">Default body size.</div>
              </div>
              <div className="spec-row">
                <div className="spec-cell" data-label="Class name">lh-md</div>
                <div className="spec-cell" data-label="Example">
                  <span className="spec-example lh-md">Line height md</span>
                </div>
                <div className="spec-cell" data-label="Usage notes">Pairs with t-base.</div>
              </div>
              <div className="spec-row">
                <div className="spec-cell" data-label="Class name">w-600</div>
                <div className="spec-cell" data-label="Example">
                  <span className="spec-example w-600">Semibold weight</span>
                </div>
                <div className="spec-cell" data-label="Usage notes">Headings and emphasis.</div>
              </div>
              <div className="spec-row">
                <div className="spec-cell" data-label="Class name">text-secondary</div>
                <div className="spec-cell" data-label="Example">
                  <span className="spec-example text-secondary">Secondary ink</span>
                </div>
                <div className="spec-cell" data-label="Usage notes">Supporting text.</div>
              </div>
              <div className="spec-row">
                <div className="spec-cell" data-label="Class name">ls-wide</div>
                <div className="spec-cell" data-label="Example">
                  <span className="spec-example ls-wide">Wide tracking</span>
                </div>
                <div className="spec-cell" data-label="Usage notes">Labels only.</div>
              </div>
              <div className="spec-row">
                <div className="spec-cell" data-label="Class name">uc</div>
                <div className="spec-cell" data-label="Example">
                  <span className="spec-example uc">Uppercase</span>
                </div>
                <div className="spec-cell" data-label="Usage notes">Labels only.</div>
              </div>
            </div>
          </section>

          <section className="app-section">
            <AppText intent="label">Text utilities</AppText>
            <div className="spec-grid">
              <div className="spec-row">
                <div className="spec-cell" data-label="Class name">text-primary</div>
                <div className="spec-cell" data-label="Example">
                  <span className="spec-example text-primary">Primary text</span>
                </div>
                <div className="spec-cell" data-label="Usage notes">Default text and headings.</div>
              </div>
              <div className="spec-row">
                <div className="spec-cell" data-label="Class name">text-secondary</div>
                <div className="spec-cell" data-label="Example">
                  <span className="spec-example text-secondary">Secondary text</span>
                </div>
                <div className="spec-cell" data-label="Usage notes">Supporting copy and labels.</div>
              </div>
              <div className="spec-row">
                <div className="spec-cell" data-label="Class name">text-danger</div>
                <div className="spec-cell" data-label="Example">
                  <span className="spec-example text-danger">Danger text</span>
                </div>
                <div className="spec-cell" data-label="Usage notes">Errors and critical warnings.</div>
              </div>
            </div>
          </section>

          <section className="app-section">
            <AppText intent="label">Background utilities</AppText>
            <div className="spec-grid">
              <div className="spec-row">
                <div className="spec-cell" data-label="Class name">bg-neutral-0</div>
                <div className="spec-cell" data-label="Example">
                  <span className="spec-swatch">
                    <span className="spec-swatch__chip bg-neutral-0" aria-hidden="true" />
                    <span className="t-sm lh-sm w-400">App background</span>
                  </span>
                </div>
                <div className="spec-cell" data-label="Usage notes">Default page background.</div>
              </div>
              <div className="spec-row">
                <div className="spec-cell" data-label="Class name">bg-neutral-50</div>
                <div className="spec-cell" data-label="Example">
                  <span className="spec-swatch">
                    <span className="spec-swatch__chip bg-neutral-50" aria-hidden="true" />
                    <span className="t-sm lh-sm w-400">Card</span>
                  </span>
                </div>
                <div className="spec-cell" data-label="Usage notes">Default cards and surfaces.</div>
              </div>
            </div>
          </section>

          <section className="app-section">
            <AppText intent="label">Border + elevation tokens</AppText>
            <div className="spec-grid">
              <div className="spec-row">
                <div className="spec-cell" data-label="Token/Class">border-neutral-900-12</div>
                <div className="spec-cell" data-label="Example">
                  <span className="spec-border-sample border-neutral-900-12">Subtle border</span>
                </div>
                <div className="spec-cell" data-label="Usage notes">Default separators and card borders.</div>
              </div>
              <div className="spec-row">
                <div className="spec-cell" data-label="Token/Class">border-neutral-900-20</div>
                <div className="spec-cell" data-label="Example">
                  <span className="spec-border-sample border-neutral-900-20">Strong border</span>
                </div>
                <div className="spec-cell" data-label="Usage notes">Emphasis or focus states.</div>
              </div>
              <div className="spec-row">
                <div className="spec-cell" data-label="Token">--shadow-1</div>
                <div className="spec-cell" data-label="Example">
                  <span className="spec-elevation-sample">Elevation</span>
                </div>
                <div className="spec-cell" data-label="Usage notes">Card lift on key panels.</div>
              </div>
            </div>
          </section>
        </div>
      </IonContent>
    </IonPage>
  )
}
