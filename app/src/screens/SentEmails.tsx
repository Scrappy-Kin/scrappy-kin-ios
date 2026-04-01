import { IonContent, IonPage, useIonViewWillEnter } from '@ionic/react'
import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { buildSentReviewItems } from '../services/homeState'
import { readReturnTo } from '../services/navigation'
import { loadBrokers } from '../services/brokerStore'
import { getQueue } from '../services/queueStore'
import AppHeading from '../ui/primitives/AppHeading'
import AppSegmentedCard, { AppSegmentedCardSection } from '../ui/primitives/AppSegmentedCard'
import AppText from '../ui/primitives/AppText'
import AppTopNav from '../ui/patterns/AppTopNav'
import SettingsShortcut from '../ui/patterns/SettingsShortcut'

type SentReviewItem = ReturnType<typeof buildSentReviewItems>[number]

export default function SentEmails() {
  const location = useLocation()
  const returnTo = readReturnTo(location.search)
  const [sentReviewItems, setSentReviewItems] = useState<SentReviewItem[]>([])

  useIonViewWillEnter(() => {
    void Promise.all([getQueue(), loadBrokers()]).then(([queue, brokers]) => {
      setSentReviewItems(buildSentReviewItems(queue, brokers))
    })
  })

  return (
    <IonPage>
      <IonContent className="page-content">
        <div className="app-screen-shell">
          <AppTopNav backHref={returnTo} action={<SettingsShortcut />} />
          <AppHeading intent="section">Sent emails</AppHeading>
          <AppText intent="supporting">
            Review the emails this device has already sent.
          </AppText>

          {sentReviewItems.length > 0 ? (
            <div className="app-stack">
              {sentReviewItems.map((item) => (
                <AppSegmentedCard key={`${item.brokerName}-${item.referenceId}`}>
                  <AppSegmentedCardSection>
                    <AppText intent="body" emphasis>
                      {item.brokerName}
                    </AppText>
                  </AppSegmentedCardSection>
                  <AppSegmentedCardSection>
                    <AppText intent="label">Reference</AppText>
                    <AppText intent="body">{item.referenceId}</AppText>
                  </AppSegmentedCardSection>
                  <AppSegmentedCardSection>
                    <AppText intent="label">Sent</AppText>
                    <AppText intent="body">
                      {item.lastAttemptAt
                        ? new Date(item.lastAttemptAt).toLocaleDateString()
                        : 'Recorded on this device'}
                    </AppText>
                  </AppSegmentedCardSection>
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
