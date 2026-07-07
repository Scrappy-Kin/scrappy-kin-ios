import { closeCircle } from 'ionicons/icons'
import AppBulletRow from '../primitives/AppBulletRow'
import AppSegmentedCard, { AppSegmentedCardSection } from '../primitives/AppSegmentedCard'
import AppSectionLabel from '../primitives/AppSectionLabel'
import AppText from '../primitives/AppText'

export const GMAIL_CONNECTED_DESCRIPTION =
  'Send-only access is active. Scrappy Kin cannot read your inbox.'
export const GMAIL_DISCONNECTED_DESCRIPTION =
  'Gmail is disconnected. Reconnect to send opt-out emails from your account.'

type GmailAccessExplainerProps = {
  showGooglePermissionHint?: boolean
  showAccountBoundaryCopy?: boolean
}

export default function GmailAccessExplainer({
  showGooglePermissionHint = false,
  showAccountBoundaryCopy = true,
}: GmailAccessExplainerProps) {
  return (
    <section className="app-section-shell">
      {showAccountBoundaryCopy ? (
        <AppText intent="body">
          Opt-out emails go from your Gmail account. You approve each round, and your data
          doesn&apos;t pass through Scrappy Kin servers.
        </AppText>
      ) : null}
      <AppSectionLabel>What Gmail access does</AppSectionLabel>
      <AppSegmentedCard>
        <AppSegmentedCardSection>
          <AppBulletRow
            label="Allows Scrappy Kin to send opt-out emails from your Gmail account"
            subtext="Only after you approve each round."
            accessibilityLabel="Allows Scrappy Kin to send opt-out emails from your Gmail account. Only after you approve each round."
          />
        </AppSegmentedCardSection>
        <AppSegmentedCardSection>
          <AppBulletRow
            icon={closeCircle}
            tone="danger"
            label="Does not allow Scrappy Kin to read, delete, or export your email"
            subtext="We don't request those permissions."
            accessibilityLabel="Does not allow Scrappy Kin to read, delete, or export your email. We don't request those permissions."
          />
        </AppSegmentedCardSection>
      </AppSegmentedCard>
      {showGooglePermissionHint ? (
        <AppText intent="body">Google will show its own permission screen next.</AppText>
      ) : null}
    </section>
  )
}
