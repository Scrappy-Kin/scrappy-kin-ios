import {
  IonApp,
  IonContent,
  IonPage,
  IonRouterOutlet,
} from '@ionic/react'
import { IonReactRouter } from '@ionic/react-router'
import { Redirect, Route } from 'react-router-dom'
import { lazy, Suspense, useEffect, useState, type ComponentType } from 'react'
import Brokers from './screens/Brokers'
import Flow from './screens/Flow'
import Gmail from './screens/Gmail'
import Home from './screens/Home'
import ReviewBatch from './screens/ReviewBatch'
import SentEmails from './screens/SentEmails'
import Settings from './screens/Settings'
import TemplateEditor from './screens/TemplateEditor'
import { useOnlineStatus } from './state/useOnlineStatus'
import { clearStaleOAuthState, getGmailStatus } from './services/googleAuth'
import { isDevAppLane } from './config/buildInfo'
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

const DEV_BUNDLE_ENABLED = import.meta.env.DEV
const DevHarnessHome = DEV_BUNDLE_ENABLED ? lazy(() => import('./ui/harness/HarnessHome')) : null
const DevReviewBoard = DEV_BUNDLE_ENABLED ? lazy(() => import('./ui/harness/ReviewBoard')) : null
const DevPatterns = DEV_BUNDLE_ENABLED ? lazy(() => import('./ui/harness/Patterns')) : null
const DevPrimitives = DEV_BUNDLE_ENABLED ? lazy(() => import('./ui/harness/Primitives')) : null
const DevTokens = DEV_BUNDLE_ENABLED ? lazy(() => import('./ui/harness/Tokens')) : null
const DevAppUrlBridge = DEV_BUNDLE_ENABLED ? lazy(() => import('./dev/AppUrlBridge')) : null
const DevCaptureScenarioRoute = DEV_BUNDLE_ENABLED
  ? lazy(() => import('./dev/CaptureScenarioRoute'))
  : null

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

function renderLazyDevComponent<T extends Record<string, unknown>>(
  Component: ComponentType<T> | null,
  props?: T,
) {
  if (!Component) return null
  return (
    <Suspense fallback={null}>
      <Component {...(props ?? ({} as T))} />
    </Suspense>
  )
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
  const [showDevLaneUi, setShowDevLaneUi] = useState(false)

  useEffect(() => {
    clearStaleOAuthState().catch(() => undefined)
  }, [])

  useEffect(() => {
    let cancelled = false

    isDevAppLane().then((visible) => {
      if (!cancelled) {
        setShowDevLaneUi(visible)
      }
    })

    return () => {
      cancelled = true
    }
  }, [])

  const isOnline = useOnlineStatus()
  const showDevTools = DEV_BUNDLE_ENABLED && showDevLaneUi

  const devRoutes = showDevTools
    ? [
        <Route
          exact
          path="/ui-harness"
          render={() => renderLazyDevComponent(DevHarnessHome)}
          key="ui-harness"
        />,
        <Route
          exact
          path="/ui-harness/review-board"
          render={() => renderLazyDevComponent(DevReviewBoard)}
          key="ui-harness-review-board"
        />,
        <Route
          exact
          path="/ui-harness/tokens"
          render={() => renderLazyDevComponent(DevTokens)}
          key="ui-harness-tokens"
        />,
        <Route
          exact
          path="/ui-harness/primitives"
          render={() => renderLazyDevComponent(DevPrimitives)}
          key="ui-harness-primitives"
        />,
        <Route
          exact
          path="/ui-harness/patterns"
          render={() => renderLazyDevComponent(DevPatterns)}
          key="ui-harness-patterns"
        />,
        <Route
          exact
          path="/capture/:scenario"
          render={() => renderLazyDevComponent(DevCaptureScenarioRoute)}
          key="capture-scenario"
        />,
      ]
    : []

  return (
    <>
      {showDevTools ? (
        <div className="dev-lane-badge" aria-hidden="true">
          <span className="dev-lane-badge__dot" />
          <span className="dev-lane-badge__label">DEV</span>
        </div>
      ) : null}
      {showDevTools ? renderLazyDevComponent(DevAppUrlBridge) : null}
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
