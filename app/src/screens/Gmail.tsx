import { IonContent, IonPage, useIonViewWillEnter } from '@ionic/react'
import { useRef, useState } from 'react'
import { useHistory, useLocation } from 'react-router-dom'
import { connectGmail, disconnectGmail, getGmailStatus } from '../services/googleAuth'
import {
  getCurrentRoute,
  readReturnTo,
  readSuccessTo,
} from '../services/navigation'
import { getTaskSuccessHref, shouldCompleteGmailRepairInPlace } from '../services/taskRoutes'
import AppButton from '../ui/primitives/AppButton'
import AppHeading from '../ui/primitives/AppHeading'
import AppNotice from '../ui/primitives/AppNotice'
import AppText from '../ui/primitives/AppText'
import GmailAccessExplainer, {
  GMAIL_CONNECTED_DESCRIPTION,
  GMAIL_DISCONNECTED_DESCRIPTION,
} from '../ui/patterns/GmailAccessExplainer'
import GmailConnectionStatusCard from '../ui/patterns/GmailConnectionStatusCard'
import AppTopNav from '../ui/patterns/AppTopNav'
import { useRouteFocus } from '../ui/patterns/useRouteFocus'

export default function Gmail() {
  const history = useHistory()
  const location = useLocation()
  const currentRoute = getCurrentRoute(location)
  const returnTo = readReturnTo(location.search) ?? '/home'
  const successTo = readSuccessTo(location.search)
  const showContinue = Boolean(successTo && successTo !== returnTo)
  const headingRef = useRef<HTMLHeadingElement | null>(null)
  const [gmailConnected, setGmailConnected] = useState(false)
  const [oauthError, setOauthError] = useState<string | null>(null)
  const [gmailStatusMessage, setGmailStatusMessage] = useState('')
  const [oauthInFlight, setOauthInFlight] = useState(false)
  const shouldStayOnSettingsGmailPage = shouldCompleteGmailRepairInPlace(returnTo, successTo)

  useIonViewWillEnter(() => {
    setGmailStatusMessage('')
    void getGmailStatus().then((status) => {
      setGmailConnected(status.connected)
    })
  })

  useRouteFocus(currentRoute, true, headingRef)

  function focusHeading() {
    requestAnimationFrame(() => {
      headingRef.current?.focus({ preventScroll: true })
    })
  }

  async function handleConnectGmail() {
    try {
      setOauthError(null)
      setGmailStatusMessage('')
      setOauthInFlight(true)
      await connectGmail()
      const status = await getGmailStatus()
      setGmailConnected(status.connected)
      if (status.connected) {
        if (shouldStayOnSettingsGmailPage) {
          setGmailStatusMessage('Gmail successfully connected.')
          focusHeading()
          return
        }

        history.replace(
          getTaskSuccessHref('repair_gmail', {
            returnTo,
            successTo,
          }),
        )
      }
    } catch (error) {
      const message = (error as Error).message ?? 'Gmail connection didn’t finish. Please try again.'
      setOauthError(message)
    } finally {
      setOauthInFlight(false)
    }
  }

  async function handleDisconnect() {
    await disconnectGmail()
    setGmailConnected(false)
    setGmailStatusMessage('Gmail successfully disconnected.')
    focusHeading()
  }

  return (
    <IonPage>
      <IonContent className="page-content">
        <div className="app-screen-shell">
          <AppTopNav backHref={returnTo} />
          <div className="app-screen-shell">
            <AppHeading intent="section" level={1} ref={headingRef} tabIndex={-1}>
              Gmail connection
            </AppHeading>
            <section className="app-section-shell">
              <div className="app-sr-only" role="status" aria-live="polite" aria-atomic="true">
                {gmailStatusMessage}
              </div>
              <AppText intent="supporting">
                Connect or manage the Gmail account used to send the opt-out emails you approve.
              </AppText>
              {gmailConnected ? (
                <GmailConnectionStatusCard
                  connected
                  connectedDescription={GMAIL_CONNECTED_DESCRIPTION}
                  disconnectedDescription=""
                  connectedActions={
                    <div className="flow-stack">
                      {showContinue ? (
                        <AppButton onClick={() => history.push(successTo!)}>Continue</AppButton>
                      ) : null}
                      <AppButton variant="secondary" onClick={handleDisconnect}>
                        Disconnect Gmail
                      </AppButton>
                    </div>
                  }
                />
              ) : (
                <>
                  <GmailConnectionStatusCard
                    connected={false}
                    connectedDescription=""
                    disconnectedDescription={GMAIL_DISCONNECTED_DESCRIPTION}
                  />
                  <GmailAccessExplainer showGooglePermissionHint showAccountBoundaryCopy={false} />
                  {oauthError ? (
                    <AppNotice variant="error" title="Gmail connection didn’t finish">
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
        </div>
      </IonContent>
    </IonPage>
  )
}
