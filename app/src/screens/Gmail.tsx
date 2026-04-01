import { IonContent, IonPage, useIonViewWillEnter } from '@ionic/react'
import { checkmarkCircle, closeCircle } from 'ionicons/icons'
import { useState, type ReactNode } from 'react'
import { useHistory, useLocation } from 'react-router-dom'
import { connectGmail, disconnectGmail, getGmailStatus } from '../services/googleAuth'
import { readReturnTo, readSuccessTo } from '../services/navigation'
import { getTaskSuccessHref } from '../services/taskRoutes'
import AppButton from '../ui/primitives/AppButton'
import AppHeading from '../ui/primitives/AppHeading'
import AppIcon from '../ui/primitives/AppIcon'
import AppNotice from '../ui/primitives/AppNotice'
import AppSegmentedCard, { AppSegmentedCardSection } from '../ui/primitives/AppSegmentedCard'
import AppText from '../ui/primitives/AppText'
import GmailConnectionStatusCard from '../ui/patterns/GmailConnectionStatusCard'
import AppTopNav from '../ui/patterns/AppTopNav'
import ReadMoreSheetLink from '../ui/patterns/ReadMoreSheetLink'
import SettingsShortcut from '../ui/patterns/SettingsShortcut'

function renderWhyUseGmailBody(): ReactNode {
  return (
    <div className="flow-stack">
      <AppText intent="body">Scrappy Kin is built to keep you in control.</AppText>
      <AppText intent="body">
        Instead of asking you to trust a new Scrappy Kin inbox with your personal data, we send
        from an account you already know and manage.
      </AppText>
      <AppText intent="body">
        That keeps the line clear: you approve each batch, the emails go out from you, and your
        data stays off our servers.
      </AppText>
    </div>
  )
}

export default function Gmail() {
  const history = useHistory()
  const location = useLocation()
  const returnTo = readReturnTo(location.search) ?? '/home'
  const successTo = readSuccessTo(location.search)
  const [gmailConnected, setGmailConnected] = useState(false)
  const [oauthError, setOauthError] = useState<string | null>(null)
  const [oauthInFlight, setOauthInFlight] = useState(false)

  useIonViewWillEnter(() => {
    void getGmailStatus().then((status) => {
      setGmailConnected(status.connected)
    })
  })

  async function handleConnectGmail() {
    try {
      setOauthError(null)
      setOauthInFlight(true)
      await connectGmail()
      const status = await getGmailStatus()
      setGmailConnected(status.connected)
      if (status.connected) {
        history.replace(
          getTaskSuccessHref('repair_gmail', {
            returnTo,
            successTo,
          }),
        )
      }
    } catch (error) {
      const message = (error as Error).message ?? 'Sign-in didn’t finish. Please try again.'
      setOauthError(message)
    } finally {
      setOauthInFlight(false)
    }
  }

  async function handleDisconnect() {
    await disconnectGmail()
    setGmailConnected(false)
  }

  return (
    <IonPage>
      <IonContent className="page-content">
        <div className="app-screen-shell">
          <AppTopNav backHref={returnTo} action={<SettingsShortcut />} />
          <AppHeading intent="section">Gmail</AppHeading>
          <section className="app-section-shell">
            <AppText intent="supporting">
              Connect or manage the Gmail account used to send the opt-out emails you approve.
            </AppText>
            {gmailConnected ? (
              <GmailConnectionStatusCard
                connected
                connectedDescription="Send-only access is active. Scrappy Kin cannot read your inbox."
                disconnectedDescription=""
                connectedActions={
                  <div className="flow-stack">
                    {successTo ? (
                      <AppButton onClick={() => history.push(successTo)}>Continue</AppButton>
                    ) : null}
                    <AppButton variant="secondary" onClick={handleDisconnect}>
                      Disconnect Gmail
                    </AppButton>
                  </div>
                }
              />
            ) : (
              <>
                <div className="flow-context">
                  <AppText intent="supporting">
                    We use your Gmail account so the opt-out emails go out from you, not from a
                    Scrappy Kin mailbox.
                  </AppText>
                  <ReadMoreSheetLink
                    label="Why use your Gmail account?"
                    sheetTitle="Why use your Gmail account?"
                    sheetBody={renderWhyUseGmailBody()}
                  />
                </div>
                <AppText intent="body">Google will show its permission screen next.</AppText>
                <AppText intent="label">This access will</AppText>
                <AppSegmentedCard>
                  <AppSegmentedCardSection>
                    <div className="flow-access-row">
                      <AppIcon icon={checkmarkCircle} size="sm" tone="primary" ariaLabel="Allowed" />
                      <AppText intent="body">
                        <strong>Send</strong> opt-out emails from your Gmail account after you
                        approve each batch.
                      </AppText>
                    </div>
                  </AppSegmentedCardSection>
                  <AppSegmentedCardSection>
                    <div className="flow-access-row">
                      <AppIcon icon={closeCircle} size="sm" tone="danger" ariaLabel="Not allowed" />
                      <AppText intent="body">
                        <strong>Not</strong> allow Scrappy Kin to read, delete, or export your
                        email
                      </AppText>
                    </div>
                  </AppSegmentedCardSection>
                </AppSegmentedCard>
                {oauthError ? (
                  <AppNotice variant="error" title="Sign-in didn’t finish">
                    {oauthError}
                  </AppNotice>
                ) : null}
                <AppButton onClick={handleConnectGmail} disabled={oauthInFlight}>
                  {oauthError ? 'Retry Google sign-in' : 'Continue to Google'}
                </AppButton>
              </>
            )}
          </section>
        </div>
      </IonContent>
    </IonPage>
  )
}
