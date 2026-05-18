import { IonContent, IonPage, useIonViewWillEnter } from '@ionic/react'
import { useState } from 'react'
import { useHistory, useLocation } from 'react-router-dom'
import { SUBSCRIPTION_PRICE_BUTTON_LABEL } from '../config/subscription'
import AppButton from '../ui/primitives/AppButton'
import AppCard from '../ui/primitives/AppCard'
import AppHeading from '../ui/primitives/AppHeading'
import AppNotice from '../ui/primitives/AppNotice'
import AppText from '../ui/primitives/AppText'
import { getCurrentRoute } from '../services/navigation'
import { getGmailStatus } from '../services/googleAuth'
import {
  filterSelectableBrokers,
  getSelectedBrokerIds,
  loadBrokers,
  loadBrokerCatalogSummary,
  setSelectedBrokerIds,
} from '../services/brokerStore'
import { getOnboardingSentCount, getSavedFlowStep, hasStartedFlow } from '../services/flowProgress'
import { buildSentReviewItems, deriveHomeState } from '../services/homeState'
import { getTotalSentCount } from '../services/metricsStore'
import { getQueue } from '../services/queueStore'
import {
  buildTaskHref,
  deriveNextBatchTaskTarget,
} from '../services/taskRoutes'
import { getSubscriptionSnapshot, purchaseSubscription } from '../services/subscription'
import type { SubscriptionSnapshot } from '../services/subscription'
import { getUserProfile } from '../services/userProfile'
import AppTopNav from '../ui/patterns/AppTopNav'
import SettingsShortcut from '../ui/patterns/SettingsShortcut'
import SubscriptionBillingClaim from '../ui/patterns/SubscriptionBillingClaim'
import SubscriptionDiagnosticsNotice from '../ui/patterns/SubscriptionDiagnosticsNotice'

type HomeCardMode = 'subscribed' | 'unsubscribed' | null

export default function Home() {
  const history = useHistory()
  const location = useLocation()
  const currentRoute = getCurrentRoute(location)
  const [gmailConnected, setGmailConnected] = useState(false)
  const [totalSentCount, setTotalSentCount] = useState<number | null>(null)
  const [remainingCount, setRemainingCount] = useState(0)
  const [cardMode, setCardMode] = useState<HomeCardMode>(null)
  const [canReviewSent, setCanReviewSent] = useState(false)
  const [nextBatchHref, setNextBatchHref] = useState('/review-batch?returnTo=%2Fhome')
  const [purchaseInFlight, setPurchaseInFlight] = useState(false)
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null)
  const [subscriptionUnavailable, setSubscriptionUnavailable] = useState<string | null>(null)
  const [subscriptionSnapshot, setSubscriptionSnapshot] = useState<SubscriptionSnapshot | null>(null)

  async function refreshHome() {
    try {
      const [
        gmailStatus,
        profile,
        flowStarted,
        lastFlowStep,
        onboardingSentCount,
        selectedIds,
        brokers,
        brokerSummary,
        queue,
        lifetimeSentCount,
        subscriptionSnapshot,
      ] = await Promise.all([
        getGmailStatus(),
        getUserProfile(),
        hasStartedFlow(),
        getSavedFlowStep(),
        getOnboardingSentCount(),
        getSelectedBrokerIds(),
        loadBrokers(),
        loadBrokerCatalogSummary(),
        getQueue(),
        getTotalSentCount(),
        getSubscriptionSnapshot(),
      ])

      const sentItems = buildSentReviewItems(queue, brokers)
      const selectableBrokers = filterSelectableBrokers(brokers, queue)
      const selectableBrokerIds = new Set(selectableBrokers.map((broker) => broker.id))
      const filteredSelectedIds = selectedIds.filter((id) => selectableBrokerIds.has(id))

      if (filteredSelectedIds.length !== selectedIds.length) {
        await setSelectedBrokerIds(filteredSelectedIds)
      }

      const nextState = deriveHomeState(
        {
          gmailConnected: gmailStatus.connected,
          hasProfile: Boolean(profile),
          onboardingSentCount,
          totalSentCount: lifetimeSentCount,
          sentReviewItemCount: sentItems.length,
          subscriptionActive: subscriptionSnapshot.active,
          brokerSummary,
        },
        lastFlowStep,
        flowStarted,
      )

      if (nextState.kind === 'redirect') {
        history.replace(nextState.target)
        return
      }

      const nextTotalSentCount = Math.max(
        lifetimeSentCount,
        onboardingSentCount,
        sentItems.length,
      )

      setTotalSentCount(nextTotalSentCount)
      setGmailConnected(gmailStatus.connected)
      setRemainingCount(nextState.state.remainingCount)
      setCardMode(nextState.state.mode)
      setCanReviewSent(nextState.state.canReviewSent)
      setSubscriptionUnavailable(subscriptionSnapshot.loadError)
      setSubscriptionSnapshot(subscriptionSnapshot)
      setNextBatchHref(
        deriveNextBatchTaskTarget(
          {
            gmailConnected: gmailStatus.connected,
            hasProfile: Boolean(profile),
          },
          '/home',
        ),
      )
    } catch (error) {
      console.error('Failed to refresh home state', error)
      setTotalSentCount(0)
      setGmailConnected(false)
      setRemainingCount(0)
      setCardMode('unsubscribed')
      setCanReviewSent(false)
      setSubscriptionUnavailable('Local app state could not be loaded.')
      setSubscriptionSnapshot(null)
      setNextBatchHref('/onboarding/intro')
    }
  }

  useIonViewWillEnter(() => {
    void refreshHome()
  })

  async function handleSubscribe() {
    setSubscriptionError(null)
    setPurchaseInFlight(true)
    const result = await purchaseSubscription()
    setPurchaseInFlight(false)

    if (result.status === 'cancelled') {
      return
    }

    if (result.status === 'error') {
      setSubscriptionError(result.message)
      setSubscriptionUnavailable(result.snapshot.loadError)
      return
    }

    await refreshHome()
  }

  const subscribeButtonLabel =
    subscriptionSnapshot?.product.buttonPriceLabel ?? SUBSCRIPTION_PRICE_BUTTON_LABEL

  return (
    <IonPage>
      <IonContent className="page-content">
        <div className="app-screen-shell">
          <AppTopNav action={<SettingsShortcut />} />
          <section className="home-hero">
            <AppHeading intent="hero">{totalSentCount ?? '\u00A0'}</AppHeading>
            <AppText intent="body" emphasis>
              Opt-out emails sent
            </AppText>
          </section>

          {cardMode ? (
            <AppCard title="Next up">
              <AppText intent="body">
                {!gmailConnected
                  ? 'Reconnect Gmail before you send your next round.'
                  : cardMode === 'subscribed'
                    ? `${remainingCount} brokers available for your next round.`
                    : `${remainingCount} more brokers available. Subscribe to send to the full list.`}
              </AppText>

              {subscriptionUnavailable && cardMode === 'unsubscribed' ? (
                <AppNotice variant="error" title="Subscription unavailable">
                  {subscriptionUnavailable}
                </AppNotice>
              ) : null}
              {cardMode === 'unsubscribed' ? <SubscriptionBillingClaim /> : null}
              {!gmailConnected ? (
                <AppNotice variant="warning" title="Gmail disconnected">
                  Reconnect Gmail to keep sending from your own account.
                </AppNotice>
              ) : null}
              <SubscriptionDiagnosticsNotice snapshot={subscriptionSnapshot} />

              {subscriptionError ? (
                <AppNotice variant="error" title="Subscription didn’t start">
                  {subscriptionError}
                </AppNotice>
              ) : null}

              <div className="app-stack">
                {!gmailConnected ? (
                  <AppButton fullWidth onClick={() => history.push(nextBatchHref)}>
                    Reconnect Gmail
                  </AppButton>
                ) : cardMode === 'subscribed' ? (
                  <AppButton fullWidth onClick={() => history.push(nextBatchHref)}>
                    Review next round
                  </AppButton>
                ) : (
                  <AppButton
                    fullWidth
                    onClick={() => void handleSubscribe()}
                    loading={purchaseInFlight}
                    disabled={purchaseInFlight || Boolean(subscriptionUnavailable)}
                  >
                    Subscribe — {subscribeButtonLabel}
                  </AppButton>
                )}
                {canReviewSent ? (
                  <AppButton
                    variant="secondary"
                    fullWidth
                    onClick={() => history.push(buildTaskHref('review_sent', { returnTo: currentRoute }))}
                  >
                    Review sent
                  </AppButton>
                ) : null}
              </div>
            </AppCard>
          ) : null}
        </div>
      </IonContent>
    </IonPage>
  )
}
