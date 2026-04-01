import { IonContent, IonPage, useIonViewWillEnter } from '@ionic/react'
import { useState } from 'react'
import { useHistory, useLocation } from 'react-router-dom'
import AppButton from '../ui/primitives/AppButton'
import AppCard from '../ui/primitives/AppCard'
import AppHeading from '../ui/primitives/AppHeading'
import AppText from '../ui/primitives/AppText'
import { getCurrentRoute } from '../services/navigation'
import { getGmailStatus } from '../services/googleAuth'
import {
  filterSelectableBrokers,
  getSelectedBrokerIds,
  loadBrokers,
  setSelectedBrokerIds,
} from '../services/brokerStore'
import { getSavedFlowStep, hasStartedFlow } from '../services/flowProgress'
import { buildSentReviewItems, deriveHomeState } from '../services/homeState'
import { getTotalSentCount } from '../services/metricsStore'
import { getQueue, summarizeQueue } from '../services/queueStore'
import { buildTaskHref, deriveNextBatchTaskTarget } from '../services/taskRoutes'
import { getUserProfile } from '../services/userProfile'
import AppTopNav from '../ui/patterns/AppTopNav'
import SettingsShortcut from '../ui/patterns/SettingsShortcut'

export default function Home() {
  const history = useHistory()
  const location = useLocation()
  const currentRoute = getCurrentRoute(location)
  const [totalSentCount, setTotalSentCount] = useState(0)
  const [summary, setSummary] = useState({ sent: 0, failed: 0, pending: 0, total: 0 })
  const [remainingCount, setRemainingCount] = useState(0)
  const [cardMode, setCardMode] = useState<'next-up' | 'all-done' | null>(null)
  const [canReviewSent, setCanReviewSent] = useState(false)
  const [nextBatchHref, setNextBatchHref] = useState('/brokers?returnTo=%2Fhome')
  const [remainingLabel, setRemainingLabel] = useState<'left-in-round' | 'available-next-round'>(
    'left-in-round',
  )

  async function refreshHome() {
    const [gmailStatus, profile, flowStarted, lastFlowStep, selectedIds, brokers, queue, totalSent] = await Promise.all([
      getGmailStatus(),
      getUserProfile(),
      hasStartedFlow(),
      getSavedFlowStep(),
      getSelectedBrokerIds(),
      loadBrokers(),
      getQueue(),
      getTotalSentCount(),
    ])

    const nextSummary = summarizeQueue(queue)
    const sentItems = buildSentReviewItems(queue, brokers)
    const selectableBrokers = filterSelectableBrokers(brokers, queue)
    const selectableBrokerIds = new Set(selectableBrokers.map((broker) => broker.id))
    const filteredSelectedIds = selectedIds.filter((id) => selectableBrokerIds.has(id))

    if (filteredSelectedIds.length !== selectedIds.length) {
      await setSelectedBrokerIds(filteredSelectedIds)
    }

    const nextState = deriveHomeState({
      gmailConnected: gmailStatus.connected,
      hasProfile: Boolean(profile),
      selectedBrokerIds: filteredSelectedIds,
      brokers: selectableBrokers,
      queueSummary: nextSummary,
      totalSentCount: totalSent,
      sentReviewItemCount: sentItems.length,
    }, lastFlowStep, flowStarted)

    if (nextState.kind === 'redirect') {
      history.replace(nextState.target)
      return
    }

    setSummary(nextSummary)
    setTotalSentCount(totalSent)
    setRemainingCount(nextState.state.remainingCount)
    setCardMode(nextState.state.mode)
    setCanReviewSent(nextState.state.canReviewSent)
    setRemainingLabel(nextState.state.remainingLabel)
    setNextBatchHref(
      deriveNextBatchTaskTarget(
        {
          gmailConnected: gmailStatus.connected,
          hasProfile: Boolean(profile),
          selectedBrokerIds: filteredSelectedIds,
          brokers: selectableBrokers,
        },
        '/home',
      ),
    )
  }

  useIonViewWillEnter(() => {
    void refreshHome()
  })

  const hasActionableWork = cardMode === 'next-up'

  return (
    <IonPage>
      <IonContent className="page-content">
        <div className="app-screen-shell">
          <AppTopNav action={<SettingsShortcut />} />
          <section className="home-hero">
            <AppHeading intent="hero">{totalSentCount}</AppHeading>
            <AppText intent="body" emphasis>
              Opt-out emails sent
            </AppText>
          </section>

          {cardMode ? (
            <AppCard title={hasActionableWork ? 'Next up' : 'All done for now'}>
              <div className="app-meta-stack">
                {summary.failed > 0 ? (
                  <AppText intent="body">{summary.failed} emails need retry</AppText>
                ) : null}
                {remainingCount > 0 ? (
                  <AppText intent="body">
                    {remainingLabel === 'available-next-round'
                      ? `${remainingCount} brokers available for your next round`
                      : `${remainingCount} brokers left in this round`}
                  </AppText>
                ) : null}
                {!hasActionableWork ? (
                  <AppText intent="body">
                    Check back in June for your next cleanup round.
                  </AppText>
                ) : null}
              </div>

              {hasActionableWork ? (
                <div className="app-stack">
                  <AppButton fullWidth onClick={() => history.push(nextBatchHref)}>
                    REVIEW NEXT BATCH
                  </AppButton>
                  {canReviewSent ? (
                    <AppButton
                      variant="secondary"
                      fullWidth
                      onClick={() => history.push(buildTaskHref('review_sent', { returnTo: currentRoute }))}
                    >
                      REVIEW SENT
                    </AppButton>
                  ) : null}
                </div>
              ) : canReviewSent ? (
                <AppButton
                  variant="secondary"
                  fullWidth
                  onClick={() => history.push(buildTaskHref('review_sent', { returnTo: currentRoute }))}
                >
                  REVIEW SENT
                </AppButton>
              ) : null}
            </AppCard>
          ) : null}

        </div>
      </IonContent>
    </IonPage>
  )
}
