import { IonContent, IonHeader, IonIcon, IonPage, IonTitle, IonToolbar } from '@ionic/react'
import { add, arrowForward } from 'ionicons/icons'
import AppButton from '../primitives/AppButton'
import AppHeading from '../primitives/AppHeading'
import AppText from '../primitives/AppText'
import './harness.css'

export default function Typography() {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar className="app-header">
          <IonTitle>Typography</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="app-content">
        <div className="app-shell">
          <section className="app-section">
            <div className="type-caption-tight">Headings</div>
            <div className="app-card type-stack">
              <div className="type-row">
                <div className="type-caption-tight">Hero</div>
                <div className="type-hero">Trust starts with clarity.</div>
              </div>
              <div className="type-row">
                <div className="type-caption-tight">Lead</div>
                <div className="type-lead">Scrappy Kin keeps your data local.</div>
              </div>
              <div className="type-row">
                <div className="type-caption-tight">Section Heading</div>
                <div className="type-section-heading">Send requests without giving away access.</div>
              </div>
            </div>
          </section>

          <section className="app-section">
            <div className="type-caption-tight">Primitives</div>
            <div className="app-card type-stack">
              <div className="type-row">
                <div className="type-caption-tight">AppHeading</div>
                <AppHeading variant="h1">Hero heading (h1)</AppHeading>
                <AppHeading variant="h2">Lead heading (h2)</AppHeading>
                <AppHeading variant="h3">Section heading (h3)</AppHeading>
              </div>
              <div className="type-row">
                <div className="type-caption-tight">AppText variants</div>
                <AppText variant="body">Body text for primary reading.</AppText>
                <AppText variant="caption">Caption text for metadata.</AppText>
                <AppText variant="label">Label text for small UI markers.</AppText>
                <AppText variant="muted" tone="muted">
                  Muted text for secondary emphasis.
                </AppText>
              </div>
              <div className="type-row">
                <div className="type-caption-tight">AppText tone + truncate</div>
                <AppText tone="danger">Danger tone for critical warnings.</AppText>
                <AppText truncate>
                  Single-line label (truncate): This line should end with an ellipsis if
                  it does not fit.
                </AppText>
              </div>
              <div className="type-row">
                <div className="type-caption-tight">AppButton variants</div>
                <div className="type-stack">
                  <AppButton>Primary</AppButton>
                  <AppButton variant="secondary">Secondary</AppButton>
                  <AppButton variant="destructive">Destructive</AppButton>
                  <AppButton variant="ghost">Ghost</AppButton>
                </div>
              </div>
              <div className="type-row">
                <div className="type-caption-tight">AppButton sizes + icons</div>
                <div className="type-stack">
                  <AppButton size="sm" iconStart={<IonIcon icon={add} aria-hidden=\"true\" />}>Small</AppButton>
                  <AppButton size="md" iconEnd={<IonIcon icon={arrowForward} aria-hidden=\"true\" />}>Medium</AppButton>
                  <AppButton size="lg" loading>Large (loading)</AppButton>
                </div>
              </div>
            </div>
          </section>

          <section className="app-section">
            <div className="type-caption-tight">Body</div>
            <div className="app-card type-stack">
              <div className="type-row">
                <div className="type-caption-tight">Body</div>
                <div className="type-body">
                  We keep every request on-device. Nothing is uploaded until you press send.
                </div>
              </div>
              <div className="type-row">
                <div className="type-caption-tight">Body Strong</div>
                <div className="type-body-strong">
                  You control when and where your requests go.
                </div>
              </div>
            </div>
          </section>

          <section className="app-section">
            <div className="type-caption-tight">Caption</div>
            <div className="app-card type-stack">
              <div className="type-row">
                <div className="type-caption-tight">Caption</div>
                <div className="type-caption">Last sync: 2 minutes ago</div>
              </div>
              <div className="type-row">
                <div className="type-caption-tight">Caption Tight</div>
                <div className="type-caption-tight">LOCAL ONLY</div>
              </div>
            </div>
          </section>

          <section className="app-section">
            <div className="type-caption-tight">In Situ</div>
            <div className="app-card type-stack">
              <div className="type-hero">A privacy co-op, not a black box.</div>
              <div className="type-lead">Auditability over automation.</div>
              <div className="type-body">
                We keep the work on-device and let you drive the hard parts.{' '}
                <strong>Human-in-the-loop is the point</strong> because it keeps power
                inspectable and accountability real.
              </div>
              <div className="type-body">
                We publish what brokers do, protect what people do, and leave room to
                learn without overpromising what comes next.
              </div>
              <div className="type-section-heading">What we share, what we shield</div>
              <div className="type-body">
                When behavior describes brokers, we default to openness. When it
                describes people, we default to protection. That boundary keeps the
                system honest without turning users into product.
              </div>
              <div className="type-body">
                This is a cooperative habit: small, repeatable steps that build a
                public record and keep your private record yours.
              </div>
            </div>
          </section>
        </div>
      </IonContent>
    </IonPage>
  )
}
