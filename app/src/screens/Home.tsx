import { IonContent, IonPage, useIonViewWillEnter } from '@ionic/react'
import { useEffect, useState } from 'react'
import { useHistory, useLocation } from 'react-router-dom'
import { SUBSCRIPTION_PRICE_BUTTON_LABEL } from '../config/subscription'
import AppButton from '../ui/primitives/AppButton'
import AppCard from '../ui/primitives/AppCard'
import AppHeading from '../ui/primitives/AppHeading'
import AppNotice from '../ui/primitives/AppNotice'
import AppText from '../ui/primitives/AppText'
import { getCurrentRoute } from '../services/navigation'
import { getGmailStatus } from '../services/googleAuth'
import { loadBrokers } from '../services/brokerStore'
import { getOnboardingSentCount, getSavedFlowStep, hasStartedFlow } from '../services/flowProgress'
import { deriveEntryTarget } from '../services/homeState'
import { getTotalSentCount } from '../services/metricsStore'
import { getMergedSentLog } from '../services/sentLog'
import { deriveRoundState, type DashboardCopy } from '../services/roundState'
import { getQaOverride, subscribeQaOverride } from '../services/qaOverrideStore'
import { isQaStoreKitLane, IS_DEV_BUILD } from '../config/buildInfo'
import { buildTaskHref, deriveNextBatchTaskTarget } from '../services/taskRoutes'
import { getSubscriptionSnapshot, purchaseSubscription } from '../services/subscription'
import type { SubscriptionSnapshot } from '../services/subscription'
import { getUserProfile } from '../services/userProfile'
import AppTopNav from '../ui/patterns/AppTopNav'
import SettingsShortcut from '../ui/patterns/SettingsShortcut'
import SubscriptionBillingClaim from '../ui/patterns/SubscriptionBillingClaim'
import SubscriptionDiagnosticsNotice from '../ui/patterns/SubscriptionDiagnosticsNotice'

const IS_QA_LANE = isQaStoreKitLane() || IS_DEV_BUILD

export default function Home() {
  const history = useHistory()
  const location = useLocation()
  const currentRoute = getCurrentRoute(location)
  const [dashboardCopy, setDashboardCopy] = useState<DashboardCopy | null>(null)
  const [nextBatchHref, setNextBatchHref] = useState('/review-batch?returnTo=%2Fhome')
  const [purchaseInFlight, setPurchaseInFlight] = useState(false)
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null)
  const [subscriptionUnavailable, setSubscriptionUnavailable] = useState<string | null>(null)
  const [subscriptionSnapshot, setSubscriptionSnapshot] = useState<SubscriptionSnapshot | null>(null)

  async function refreshHome() {
    try {
      const brokers = await loadBrokers()
      const [
        gmailStatus,
        profile,
        flowStarted,
        lastFlowStep,
        onboardingSentCount,
        totalSentCount,
        sentLog,
        subscriptionSnapshotResult,
      ] = await Promise.all([
        getGmailStatus(),
        getUserProfile(),
        hasStartedFlow(),
        getSavedFlowStep(),
        getOnboardingSentCount(),
        getTotalSentCount(),
        getMergedSentLog(brokers),
        getSubscriptionSnapshot(),
      ])

      // Preserve redirect-to-onboarding logic
      const redirectTarget = deriveEntryTarget(
        {
          gmailConnected: gmailStatus.connected,
          hasProfile: Boolean(profile),
          onboardingSentCount,
          totalSentCount,
          sentReviewItemCount: sentLog.length,
        },
        lastFlowStep,
        flowStarted,
      )

      if (redirectTarget) {
        history.replace(redirectTarget)
        return
      }

      const qaOverride = IS_QA_LANE ? getQaOverride() : null

      const roundCopy = deriveRoundState({
        brokers,
        sentLog,
        subscriptionActive: subscriptionSnapshotResult.active,
        gmailConnected: gmailStatus.connected,
        totalSentCount,
        qaOverride,
      })

      setDashboardCopy(roundCopy)
      setSubscriptionUnavailable(subscriptionSnapshotResult.loadError)
      setSubscriptionSnapshot(subscriptionSnapshotResult)
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
      setDashboardCopy(null)
      setSubscriptionUnavailable('Local app state could not be loaded.')
      setSubscriptionSnapshot(null)
      setNextBatchHref('/onboarding/intro')
    }
  }

  useIonViewWillEnter(() => {
    void refreshHome()
  })

  // Re-derive when the QA override changes (only active in QA/dev lanes)
  useEffect(() => {
    if (!IS_QA_LANE) return
    return subscribeQaOverride(() => {
      void refreshHome()
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSubscribe() {
    setSubscriptionError(null)
    setPurchaseInFlight(true)
    const result = await purchaseSubscription()
    setPurchaseInFlight(false)
    setSubscriptionSnapshot(result.snapshot)

    if (result.status === 'cancelled') {
      setSubscriptionError(result.message)
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

  const copy = dashboardCopy

  return (
    <IonPage>
      <IonContent className="page-content">
        <div className="app-screen-shell">
          <AppTopNav action={<SettingsShortcut />} />
          <section className="home-hero">
            <AppHeading intent="hero">
              {copy != null ? copy.metricValue : '\u00A0'}
            </AppHeading>
            <AppText intent="body" emphasis>
              {copy != null ? copy.metricLabel : '\u00A0'}
            </AppText>
          </section>

          {copy != null ? (
            <AppCard title={copy.hero}>
              {copy.bodyText != null ? (
                <AppText intent="body">{copy.bodyText}</AppText>
              ) : null}

              {copy.nextRoundOpensLabel != null ? (
                <AppText intent="body">{copy.nextRoundOpensLabel}</AppText>
              ) : null}

              {subscriptionUnavailable != null && copy.primaryActionKind === 'subscribe' ? (
                <AppNotice variant="error" title="Subscription unavailable">
                  {subscriptionUnavailable}
                </AppNotice>
              ) : null}

              {copy.primaryActionKind === 'subscribe' ? <SubscriptionBillingClaim /> : null}

              {subscriptionError != null ? (
                <AppNotice variant="error" title="Subscription didn't start">
                  {subscriptionError}
                </AppNotice>
              ) : null}

              <div className="app-stack">
                {copy.primaryActionKind === 'start_round' ? (
                  <AppButton fullWidth onClick={() => history.push(nextBatchHref)}>
                    Start next round
                  </AppButton>
                ) : copy.primaryActionKind === 'subscribe' ? (
                  <AppButton
                    fullWidth
                    onClick={() => void handleSubscribe()}
                    loading={purchaseInFlight}
                    disabled={purchaseInFlight || Boolean(subscriptionUnavailable)}
                  >
                    Subscribe — {subscribeButtonLabel}
                  </AppButton>
                ) : copy.primaryActionKind === 'reconnect_gmail' ? (
                  <AppButton fullWidth onClick={() => history.push(nextBatchHref)}>
                    Reconnect Gmail
                  </AppButton>
                ) : null}

                {copy.secondaryActionKind === 'view_sent' ? (
                  <AppButton
                    variant="secondary"
                    fullWidth
                    onClick={() =>
                      history.push(buildTaskHref('review_sent', { returnTo: currentRoute }))
                    }
                  >
                    {copy.stateId === 'next_round_ready' ? 'View previous sends' : 'View sent emails'}
                  </AppButton>
                ) : null}
              </div>
            </AppCard>
          ) : null}

          <SubscriptionDiagnosticsNotice snapshot={subscriptionSnapshot} />
        </div>
      </IonContent>
    </IonPage>
  )
}
