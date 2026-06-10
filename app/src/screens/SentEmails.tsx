import { IonContent, IonPage, useIonViewWillEnter } from '@ionic/react'
import { useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { loadBrokers } from '../services/brokerStore'
import { getCurrentRoute, readReturnTo } from '../services/navigation'
import { getMergedSentLog, type SentLogEntry } from '../services/sentLog'
import AppHeading from '../ui/primitives/AppHeading'
import AppSegmentedCard, { AppSegmentedCardSection } from '../ui/primitives/AppSegmentedCard'
import AppText from '../ui/primitives/AppText'
import AppTopNav from '../ui/patterns/AppTopNav'
import SettingsShortcut from '../ui/patterns/SettingsShortcut'
import { useRouteFocus } from '../ui/patterns/useRouteFocus'

export default function SentEmails() {
  const location = useLocation()
  const currentRoute = getCurrentRoute(location)
  const returnTo = readReturnTo(location.search)
  const headingRef = useRef<HTMLHeadingElement | null>(null)
  const [sentEntries, setSentEntries] = useState<SentLogEntry[]>([])

  useIonViewWillEnter(() => {
    void loadBrokers().then((brokers) => getMergedSentLog(brokers)).then((log) => {
      // Most recent first
      setSentEntries([...log].reverse())
    })
  })

  useRouteFocus(currentRoute, true, headingRef)

  return (
    <IonPage>
      <IonContent className="page-content">
        <div className="app-screen-shell">
          <AppTopNav backHref={returnTo} action={<SettingsShortcut />} />
          <AppHeading intent="section" level={1} ref={headingRef} tabIndex={-1}>
            Sent emails
          </AppHeading>
          <AppText intent="supporting">
            Review the emails this device has already sent.
          </AppText>

          {sentEntries.length > 0 ? (
            <div className="app-stack">
              {sentEntries.map((entry, i) => (
                <AppSegmentedCard key={`${entry.brokerId}-${entry.referenceId}-${i}`}>
                  <AppSegmentedCardSection>
                    <AppText intent="body" emphasis>
                      {entry.brokerName}
                    </AppText>
                  </AppSegmentedCardSection>
                  <AppSegmentedCardSection>
                    <AppText intent="label">Reference</AppText>
                    <AppText intent="body">{entry.referenceId}</AppText>
                  </AppSegmentedCardSection>
                  <AppSegmentedCardSection>
                    <AppText intent="label">Sent</AppText>
                    <AppText intent="body">
                      {entry.sentAt
                        ? new Date(entry.sentAt).toLocaleDateString()
                        : 'Recorded on this device'}
                    </AppText>
                  </AppSegmentedCardSection>
                  {entry.recipientMode === 'app_review_test' ? (
                    <AppSegmentedCardSection>
                      <AppText intent="label" tone="danger">App Review demo recipient</AppText>
                      <AppText intent="body">
                        Sent to a Scrappy Kin test inbox instead of the broker inbox.
                      </AppText>
                      {entry.recipientEmail ? (
                        <AppText intent="caption">{entry.recipientEmail}</AppText>
                      ) : null}
                    </AppSegmentedCardSection>
                  ) : null}
                </AppSegmentedCard>
              ))}
            </div>
          ) : (
            <AppSegmentedCard>
              <AppSegmentedCardSection>
                <AppText intent="body" emphasis>
                  No sent emails yet
                </AppText>
              </AppSegmentedCardSection>
              <AppSegmentedCardSection>
                <AppText intent="body">No sent emails have been recorded on this device.</AppText>
              </AppSegmentedCardSection>
            </AppSegmentedCard>
          )}
        </div>
      </IonContent>
    </IonPage>
  )
}
