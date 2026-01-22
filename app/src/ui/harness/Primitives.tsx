import { IonContent, IonHeader, IonIcon, IonPage, IonTitle, IonToolbar } from '@ionic/react'
import { add, alertCircle, arrowForward, chevronBack, home, informationCircle } from 'ionicons/icons'
import { useState } from 'react'
import AppButton from '../primitives/AppButton'
import AppCard from '../primitives/AppCard'
import AppHeading from '../primitives/AppHeading'
import AppCheckbox from '../primitives/AppCheckbox'
import AppInput from '../primitives/AppInput'
import AppIcon from '../primitives/AppIcon'
import AppIconButton from '../primitives/AppIconButton'
import AppList from '../primitives/AppList'
import AppListRow from '../primitives/AppListRow'
import AppNotice from '../primitives/AppNotice'
import AppProgress from '../primitives/AppProgress'
import AppSurface from '../primitives/AppSurface'
import AppSheet from '../primitives/AppSheet'
import AppDisclosure from '../primitives/AppDisclosure'
import AppToggle from '../primitives/AppToggle'
import AppToast from '../primitives/AppToast'
import AppTextarea from '../primitives/AppTextarea'
import AppText from '../primitives/AppText'
import './harness.css'

export default function Primitives() {
  const [nameValue, setNameValue] = useState('Scrappy Kin')
  const [emailValue, setEmailValue] = useState('hello@scrappykin')
  const [bioValue, setBioValue] = useState('Local-first trust tooling.')
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [diagnosticsEnabled, setDiagnosticsEnabled] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [toastOpen, setToastOpen] = useState(false)

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar className="app-header">
          <IonTitle>Primitives</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="app-content">
        <div className="app-shell">
          <section className="app-section">
            <div className="t-xs lh-xs w-500 text-secondary uc ls-wide">AppHeading</div>
            <div className="app-stack">
              <AppHeading intent="hero">Hero heading</AppHeading>
              <AppHeading intent="lead">Lead heading</AppHeading>
              <AppHeading intent="section">Section heading</AppHeading>
            </div>
          </section>

          <section className="app-section">
            <div className="t-xs lh-xs w-500 text-secondary uc ls-wide">AppText</div>
            <div className="app-stack">
              <AppText intent="body">Body text for primary reading.</AppText>
              <AppText intent="supporting">Supporting text for secondary emphasis.</AppText>
              <AppText intent="caption">Caption text for metadata.</AppText>
              <AppText intent="label">Label text for small UI markers.</AppText>
              <AppText intent="body" emphasis>
                Emphasis uses a heavier weight but keeps body sizing.
              </AppText>
              <AppText intent="body" tone="danger">
                Danger tone for critical warnings.
              </AppText>
              <AppText intent="label" truncate>
                Single-line label (truncate): This line should end with an ellipsis if it does not fit.
              </AppText>
            </div>
          </section>

          <section className="app-section">
            <div className="t-xs lh-xs w-500 text-secondary uc ls-wide">AppButton</div>
            <div className="app-stack">
              <AppButton>Primary</AppButton>
              <AppButton variant="secondary">Secondary</AppButton>
              <AppButton variant="destructive">Destructive</AppButton>
              <AppButton variant="ghost">Ghost</AppButton>
              <AppIconButton icon={chevronBack} ariaLabel="Back" size="lg" />
              <div className="app-stack">
                <AppButton size="sm" iconStart={<IonIcon icon={add} aria-hidden="true" />}>
                  Small
                </AppButton>
                <AppButton size="md" iconEnd={<IonIcon icon={arrowForward} aria-hidden="true" />}>
                  Medium
                </AppButton>
                <AppButton size="lg" loading>
                  Large (loading)
                </AppButton>
              </div>
            </div>
          </section>

          <section className="app-section">
            <div className="t-xs lh-xs w-500 text-secondary uc ls-wide">AppSurface</div>
            <div className="app-stack">
              <AppSurface>
                <AppText intent="body">Default surface with standard padding.</AppText>
              </AppSurface>
              <AppSurface padding="compact">
                <AppText intent="body">Compact surface for dense layouts.</AppText>
              </AppSurface>
            </div>
          </section>

          <section className="app-section">
            <div className="t-xs lh-xs w-500 text-secondary uc ls-wide">AppCard</div>
            <AppCard
              title="Card title"
              actions={
                <AppButton size="sm" variant="ghost">
                  Edit
                </AppButton>
              }
            >
              <AppText intent="body">
                Cards hold grouped content and optional actions.
              </AppText>
              <AppText intent="supporting">
                This example uses a title + action in the header.
              </AppText>
            </AppCard>
          </section>

          <section className="app-section">
            <div className="t-xs lh-xs w-500 text-secondary uc ls-wide">AppList</div>
            <AppList header="Default list">
              <AppListRow
                title="Primary row"
                description="Supporting detail for this row."
                right={<AppText intent="caption">Default</AppText>}
              />
              <AppListRow
                title="Selectable row"
                description="Left slot holds selection controls."
                left={<AppCheckbox checked={true} onChange={() => undefined} />}
              />
              <AppListRow
                title="Clickable row"
                description="Tappable rows use the same layout."
                onClick={() => undefined}
              />
              <AppListRow
                title="Destructive row"
                description="Use danger tone for critical actions."
                right={<AppText intent="caption">Delete</AppText>}
                tone="danger"
              />
              <AppListRow
                title="Disabled row"
                description="Disabled rows are visibly muted."
                right={<AppText intent="caption">Off</AppText>}
                disabled
              />
            </AppList>
          </section>

          <section className="app-section">
            <div className="t-xs lh-xs w-500 text-secondary uc ls-wide">AppInput</div>
            <div className="app-form-stack">
              <AppInput
                label="Full name"
                value={nameValue}
                onChange={setNameValue}
                placeholder="Enter your name"
                helpText="Used for broker outreach."
              />
              <AppInput
                label="Email"
                value={emailValue}
                onChange={setEmailValue}
                placeholder="name@example.com"
                inputMode="email"
                error="Please enter a valid email."
              />
            </div>
          </section>

          <section className="app-section">
            <div className="t-xs lh-xs w-500 text-secondary uc ls-wide">AppTextarea</div>
            <div className="app-form-stack">
              <AppTextarea
                label="Bio"
                value={bioValue}
                onChange={setBioValue}
                placeholder="Short description"
                rows={4}
                helpText="Shown in your broker profile."
              />
            </div>
          </section>

          <section className="app-section">
            <div className="t-xs lh-xs w-500 text-secondary uc ls-wide">AppToggle</div>
            <div className="app-form-stack">
              <AppToggle
                label="Notifications"
                description="Send updates about broker replies."
                checked={notificationsEnabled}
                onChange={setNotificationsEnabled}
              />
              <AppToggle
                label="Diagnostics"
                description="Capture local logs for 15 minutes."
                checked={diagnosticsEnabled}
                onChange={setDiagnosticsEnabled}
              />
              <AppToggle
                label="Delete local data"
                description="Disables all local storage until re-enabled."
                checked={false}
                onChange={() => undefined}
                tone="danger"
              />
              <AppToggle
                label="Disabled toggle"
                description="This control is turned off."
                checked={false}
                onChange={() => undefined}
                disabled
              />
            </div>
          </section>

          <section className="app-section">
            <div className="t-xs lh-xs w-500 text-secondary uc ls-wide">AppNotice</div>
            <div className="app-stack">
              <AppNotice variant="info" title="Info">
                Inline guidance that reinforces trust.
              </AppNotice>
              <AppNotice variant="warning" title="Warning">
                Use for situations that need extra attention.
              </AppNotice>
              <AppNotice variant="error" title="Error">
                Critical warnings and destructive confirmations.
              </AppNotice>
              <AppNotice
                variant="success"
                title="Success"
                actions={
                  <AppButton size="sm" variant="secondary">
                    Undo
                  </AppButton>
                }
              >
                Confirmation states after a successful action.
              </AppNotice>
            </div>
          </section>

          <section className="app-section">
            <div className="t-xs lh-xs w-500 text-secondary uc ls-wide">AppDisclosure</div>
            <AppDisclosure
              label="Why we ask"
              collapsedSummary="We only request what is required to send broker emails."
            >
              <AppText intent="body">
                Expanded details go here, with concrete proof or artifacts when available.
              </AppText>
              <AppText intent="supporting">
                The collapsed state remains complete even without expansion.
              </AppText>
            </AppDisclosure>
          </section>

          <section className="app-section">
            <div className="t-xs lh-xs w-500 text-secondary uc ls-wide">AppSheet</div>
            <div className="app-stack">
              <AppText intent="body">Sheets are for deeper reading only.</AppText>
              <AppButton onClick={() => setSheetOpen(true)}>Open sheet</AppButton>
            </div>
            <AppSheet title="Why we ask" open={sheetOpen} onDismiss={() => setSheetOpen(false)}>
              <AppText intent="body">
                This sheet holds longer explanations and can be dismissed at any time.
              </AppText>
              <AppText intent="supporting">
                It should never be required to proceed.
              </AppText>
              <AppButton variant="secondary" onClick={() => setSheetOpen(false)}>
                Done
              </AppButton>
            </AppSheet>
          </section>

          <section className="app-section">
            <div className="t-xs lh-xs w-500 text-secondary uc ls-wide">AppProgress</div>
            <div className="app-stack">
              <AppProgress current={2} total={5} label="Progress" />
              <AppProgress current={4} total={5} label="Almost there" />
            </div>
          </section>

          <section className="app-section">
            <div className="t-xs lh-xs w-500 text-secondary uc ls-wide">AppToast</div>
            <div className="app-stack">
              <AppText intent="body">Toasts confirm short actions.</AppText>
              <AppButton onClick={() => setToastOpen(true)}>Show toast</AppButton>
            </div>
            <AppToast
              open={toastOpen}
              onDismiss={() => setToastOpen(false)}
              variant="success"
              message="Saved locally."
            />
          </section>

          <section className="app-section">
            <div className="t-xs lh-xs w-500 text-secondary uc ls-wide">AppIcon</div>
            <div className="app-stack">
              <div className="app-row">
                <AppText intent="caption">Sizes</AppText>
                <div className="app-stack">
                  <div className="app-inline">
                    <AppIcon icon={home} size="sm" />
                    <AppText intent="caption">sm</AppText>
                  </div>
                  <div className="app-inline">
                    <AppIcon icon={home} size="md" />
                    <AppText intent="caption">md</AppText>
                  </div>
                  <div className="app-inline">
                    <AppIcon icon={home} size="lg" />
                    <AppText intent="caption">lg</AppText>
                  </div>
                </div>
              </div>
              <div className="app-row">
                <AppText intent="caption">Tones</AppText>
                <div className="app-stack">
                  <div className="app-inline">
                    <AppIcon icon={informationCircle} tone="neutral" />
                    <AppText intent="caption">neutral</AppText>
                  </div>
                  <div className="app-inline">
                    <AppIcon icon={informationCircle} tone="primary" />
                    <AppText intent="caption">primary</AppText>
                  </div>
                  <div className="app-inline">
                    <AppIcon icon={alertCircle} tone="danger" />
                    <AppText intent="caption">danger</AppText>
                  </div>
                </div>
              </div>
            </div>
          </section>

        </div>
      </IonContent>
    </IonPage>
  )
}
