import { closeCircle } from 'ionicons/icons'
import AppBulletRow from '../primitives/AppBulletRow'
import AppSegmentedCard, { AppSegmentedCardSection } from '../primitives/AppSegmentedCard'
import AppText from '../primitives/AppText'

export const GMAIL_CONNECTED_DESCRIPTION =
  'Send-only access is active. Scrappy Kin cannot read your inbox.'
export const GMAIL_DISCONNECTED_DESCRIPTION =
  'Gmail is disconnected. Reconnect to send opt-out emails from your account.'

type GmailAccessExplainerProps = {
  showGooglePermissionHint?: boolean
}

export default function GmailAccessExplainer({
  showGooglePermissionHint = false,
}: GmailAccessExplainerProps) {
  return (
    <section className="app-section-shell">
      <AppText intent="body">Scrappy Kin is built to keep you in control.</AppText>
      <AppText intent="body">
        We do not ask you to trust a Scrappy Kin inbox with your personal data. The app sends
        opt-out emails from your Gmail account after you approve each batch.
      </AppText>
      <AppText intent="body">
        That keeps the boundary clear: you approve the emails, Google sends them, brokers see the
        request coming from you, and your data never passes through Scrappy Kin servers.
      </AppText>
      <AppText intent="label">What Gmail access does</AppText>
      <AppSegmentedCard>
        <AppSegmentedCardSection>
          <AppBulletRow
            label="Allows Scrappy Kin to send opt-out emails from your Gmail account"
            subtext="Only after you approve each batch."
            accessibilityLabel="Allows Scrappy Kin to send opt-out emails from your Gmail account. Only after you approve each batch."
          />
        </AppSegmentedCardSection>
        <AppSegmentedCardSection>
          <AppBulletRow
            icon={closeCircle}
            tone="danger"
            label="Does not allow Scrappy Kin to read, delete, or export your email"
            subtext="We do not ask Google for that access."
            accessibilityLabel="Does not allow Scrappy Kin to read, delete, or export your email. We do not ask Google for that access."
          />
        </AppSegmentedCardSection>
      </AppSegmentedCard>
      {showGooglePermissionHint ? (
        <AppText intent="body">Google will show its permission screen next.</AppText>
      ) : null}
    </section>
  )
}
