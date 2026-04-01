import {
  IonApp,
  IonContent,
  IonPage,
  IonRouterOutlet,
} from '@ionic/react'
import { IonReactRouter } from '@ionic/react-router'
import { Redirect, Route } from 'react-router-dom'
import Brokers from './screens/Brokers'
import Flow from './screens/Flow'
import Gmail from './screens/Gmail'
import Home from './screens/Home'
import ReviewBatch from './screens/ReviewBatch'
import SentEmails from './screens/SentEmails'
import Settings from './screens/Settings'
import TemplateEditor from './screens/TemplateEditor'
import { useOnlineStatus } from './state/useOnlineStatus'
import { useEffect, useState } from 'react'
import { clearStaleOAuthState, getGmailStatus } from './services/googleAuth'
import HarnessHome from './ui/harness/HarnessHome'
import ReviewBoard from './ui/harness/ReviewBoard'
import Patterns from './ui/harness/Patterns'
import Primitives from './ui/harness/Primitives'
import Tokens from './ui/harness/Tokens'
import { IS_DEV_BUILD, isDevAppLane } from './config/buildInfo'
import AppUrlBridge from './dev/AppUrlBridge'
import CaptureScenarioRoute from './dev/CaptureScenarioRoute'
import {
  FLOW_STEP_IDS,
  getSavedFlowStep,
  hasStartedFlow,
  isFlowStepId,
} from './services/flowProgress'
import { filterSelectableBrokers, getSelectedBrokerIds, loadBrokers } from './services/brokerStore'
import { deriveEntryTarget } from './services/homeState'
import { getTotalSentCount } from './services/metricsStore'
import { getQueue, summarizeQueue } from './services/queueStore'
import { getUserProfile } from './services/userProfile'
import { buildOnboardingHref, readSuccessTo } from './services/navigation'

function OfflineShell() {
  return (
    <IonPage>
      <IonContent className="page-content">
        <div className="offline-shell">
          <h1>Offline</h1>
          <p>This app requires an internet connection to send opt-out emails.</p>
          <p>
            Connect to the internet and try again. Settings are still available for
            disconnecting Gmail or deleting local data.
          </p>
        </div>
      </IonContent>
    </IonPage>
  )
}

function RoutedHome() {
  const isOnline = useOnlineStatus()
  return isOnline ? <Home /> : <OfflineShell />
}

function EntryGate() {
  const isOnline = useOnlineStatus()
  const [target, setTarget] = useState<string | null>(null)

  useEffect(() => {
    if (!isOnline) return

    let cancelled = false

    Promise.all([
      getGmailStatus(),
      getUserProfile(),
      hasStartedFlow(),
      getSavedFlowStep(),
      getSelectedBrokerIds(),
      loadBrokers(),
      getQueue(),
      getTotalSentCount(),
    ]).then(([gmailStatus, profile, flowStarted, lastFlowStep, selectedIds, brokers, queue, totalSent]) => {
      if (cancelled) return
      const selectableBrokers = filterSelectableBrokers(brokers, queue)
      const selectableBrokerIds = new Set(selectableBrokers.map((broker) => broker.id))
      const filteredSelectedIds = selectedIds.filter((id) => selectableBrokerIds.has(id))
      const nextTarget =
        deriveEntryTarget({
          gmailConnected: gmailStatus.connected,
          hasProfile: Boolean(profile),
          selectedBrokerIds: filteredSelectedIds,
          brokers: selectableBrokers,
          queueSummary: summarizeQueue(queue),
          totalSentCount: totalSent,
          sentReviewItemCount: queue.filter((item) => item.status === 'sent').length,
        }, lastFlowStep, flowStarted) ?? '/home'
      setTarget(nextTarget)
    })

    return () => {
      cancelled = true
    }
  }, [isOnline])

  if (!isOnline) {
    return <OfflineShell />
  }

  if (!target) {
    return null
  }

  return <Redirect to={target} />
}

function LegacyFlowRedirect() {
  const search = window.location.search
  const params = new URLSearchParams(search)
  const requestedStep = params.get('step')
  const successTo = readSuccessTo(search)
  const target = isFlowStepId(requestedStep)
    ? buildOnboardingHref(requestedStep, successTo)
    : buildOnboardingHref('intro')
  return <Redirect to={target} />
}

function LegacyFlowPathRedirect({ stepId }: { stepId: string }) {
  const successTo = readSuccessTo(window.location.search)
  const target = isFlowStepId(stepId) ? buildOnboardingHref(stepId, successTo) : buildOnboardingHref('intro')
  return <Redirect to={target} />
}

function RoutedBrokers() {
  const isOnline = useOnlineStatus()
  return isOnline ? <Brokers /> : <OfflineShell />
}

function FallbackRedirect() {
  return <Redirect to="/home" />
}

export default function App() {
  return (
    <IonApp>
      <IonReactRouter>
        <AppShell />
      </IonReactRouter>
    </IonApp>
  )
}

function AppShell() {
  const [showDevBadge, setShowDevBadge] = useState(false)

  useEffect(() => {
    clearStaleOAuthState().catch(() => undefined)
  }, [])

  useEffect(() => {
    let cancelled = false

    isDevAppLane().then((visible) => {
      if (!cancelled) {
        setShowDevBadge(visible)
      }
    })

    return () => {
      cancelled = true
    }
  }, [])

  const isOnline = useOnlineStatus()

  const devRoutes = IS_DEV_BUILD
    ? [
        <Route exact path="/ui-harness" component={HarnessHome} key="ui-harness" />,
        <Route
          exact
          path="/ui-harness/review-board"
          component={ReviewBoard}
          key="ui-harness-review-board"
        />,
        <Route exact path="/ui-harness/tokens" component={Tokens} key="ui-harness-tokens" />,
        <Route
          exact
          path="/ui-harness/primitives"
          component={Primitives}
          key="ui-harness-primitives"
        />,
        <Route
          exact
          path="/ui-harness/patterns"
          component={Patterns}
          key="ui-harness-patterns"
        />,
        <Route
          exact
          path="/capture/:scenario"
          component={CaptureScenarioRoute}
          key="capture-scenario"
        />,
      ]
    : []

  return (
    <>
      {showDevBadge ? (
        <div className="dev-lane-badge" aria-hidden="true">
          <span className="dev-lane-badge__dot" />
          <span className="dev-lane-badge__label">DEV</span>
        </div>
      ) : null}
      {IS_DEV_BUILD ? <AppUrlBridge /> : null}
      <IonRouterOutlet>
        <Route exact path="/" component={EntryGate} />
        <Route exact path="/home" component={RoutedHome} />
        <Route exact path="/gmail" component={Gmail} />
        <Route exact path="/review-batch" component={ReviewBatch} />
        <Route exact path="/flow" component={LegacyFlowRedirect} />
        <Route
          exact
          path="/flow/:step"
          render={({ match }) => <LegacyFlowPathRedirect stepId={match.params.step} />}
        />
        {FLOW_STEP_IDS.map((stepId) => (
          <Route
            exact
            path={`/onboarding/${stepId}`}
            key={`flow-${stepId}`}
            render={() => (isOnline ? <Flow stepId={stepId} /> : <OfflineShell />)}
          />
        ))}
        <Route exact path="/brokers" component={RoutedBrokers} />
        <Route exact path="/sent-emails" component={SentEmails} />
        <Route exact path="/settings" component={Settings} />
        <Route exact path="/template" component={TemplateEditor} />
        {devRoutes}
        <Route component={FallbackRedirect} />
      </IonRouterOutlet>
    </>
  )
}
