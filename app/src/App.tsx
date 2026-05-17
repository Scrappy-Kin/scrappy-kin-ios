import {
  IonApp,
  IonContent,
  IonPage,
  IonRouterOutlet,
} from '@ionic/react'
import { Capacitor } from '@capacitor/core'
import { IonReactRouter } from '@ionic/react-router'
import { Redirect, Route, useParams } from 'react-router-dom'
import { lazy, Suspense, useEffect, useState, useSyncExternalStore, type ComponentType } from 'react'
import Flow from './screens/Flow'
import Gmail from './screens/Gmail'
import Home from './screens/Home'
import ReviewBatch from './screens/ReviewBatch'
import SentEmails from './screens/SentEmails'
import Settings from './screens/Settings'
import TemplateEditor from './screens/TemplateEditor'
import { useOnlineStatus } from './state/useOnlineStatus'
import {
  clearStaleOAuthState,
  getGmailStatus,
  getOAuthBrowserOpenSnapshot,
  subscribeOAuthBrowserOpen,
} from './services/googleAuth'
import { isDevAppLane, isQaStoreKitLane } from './config/buildInfo'
import {
  getOnboardingSentCount,
  getSavedFlowStep,
  hasStartedFlow,
  isFlowStepId,
} from './services/flowProgress'
import { deriveEntryTarget } from './services/homeState'
import { getTotalSentCount } from './services/metricsStore'
import { getQueue } from './services/queueStore'
import { getUserProfile } from './services/userProfile'
import { buildOnboardingHref } from './services/navigation'

const DEV_SURFACES_ENABLED =
  import.meta.env.VITE_EXECUTION_LANE === 'dev' ||
  (!import.meta.env.VITE_EXECUTION_LANE && import.meta.env.DEV)
const DevHarnessHome = DEV_SURFACES_ENABLED ? lazy(() => import('./ui/harness/HarnessHome')) : null
const DevScreenshotGallery = DEV_SURFACES_ENABLED ? lazy(() => import('./ui/harness/ScreenshotGallery')) : null
const DevReviewBoard = DEV_SURFACES_ENABLED ? lazy(() => import('./ui/harness/ReviewBoard')) : null
const DevPatterns = DEV_SURFACES_ENABLED ? lazy(() => import('./ui/harness/Patterns')) : null
const DevPrimitives = DEV_SURFACES_ENABLED ? lazy(() => import('./ui/harness/Primitives')) : null
const DevTokens = DEV_SURFACES_ENABLED ? lazy(() => import('./ui/harness/Tokens')) : null
const DevAppUrlBridge = DEV_SURFACES_ENABLED ? lazy(() => import('./dev/AppUrlBridge')) : null
const DevCaptureScenarioRoute = DEV_SURFACES_ENABLED
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
      getOnboardingSentCount(),
      getQueue(),
      getTotalSentCount(),
    ]).then(([gmailStatus, profile, flowStarted, lastFlowStep, onboardingSentCount, queue, totalSent]) => {
      if (cancelled) return
      const nextTarget =
        deriveEntryTarget({
          gmailConnected: gmailStatus.connected,
          hasProfile: Boolean(profile),
          onboardingSentCount,
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

function OnboardingRoute() {
  const isOnline = useOnlineStatus()
  const { stepId } = useParams<{ stepId: string }>()

  if (!isFlowStepId(stepId)) {
    return <Redirect to={buildOnboardingHref('intro')} />
  }

  return isOnline ? <Flow stepId={stepId} /> : <OfflineShell />
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
  const [showDevLaneUi, setShowDevLaneUi] = useState(
    () => DEV_SURFACES_ENABLED && !Capacitor.isNativePlatform(),
  )

  useEffect(() => {
    clearStaleOAuthState().catch(() => undefined)
  }, [])

  useEffect(() => {
    if (!DEV_SURFACES_ENABLED) {
      return
    }

    if (!Capacitor.isNativePlatform()) {
      return
    }

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

  const oauthBrowserOpen = useSyncExternalStore(
    subscribeOAuthBrowserOpen,
    getOAuthBrowserOpenSnapshot,
    getOAuthBrowserOpenSnapshot,
  )
  const showDevTools = DEV_SURFACES_ENABLED && showDevLaneUi
  const showQaStoreKitUi = isQaStoreKitLane()

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
          path="/ui-harness/screenshots"
          render={() => renderLazyDevComponent(DevScreenshotGallery)}
          key="ui-harness-screenshots"
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
      {showDevTools || showQaStoreKitUi ? (
        <div
          className={`execution-lane-badge${showQaStoreKitUi ? ' execution-lane-badge--qa' : ''}`}
          aria-hidden="true"
        >
          <span className="execution-lane-badge__dot" />
          <span className="execution-lane-badge__label">
            {showQaStoreKitUi ? 'QA' : 'DEV'}
          </span>
        </div>
      ) : null}
      {showDevTools ? renderLazyDevComponent(DevAppUrlBridge) : null}
      <div
        aria-hidden={oauthBrowserOpen || undefined}
        inert={oauthBrowserOpen || undefined}
      >
        <IonRouterOutlet>
          <Route exact path="/" component={EntryGate} />
          <Route exact path="/home" component={RoutedHome} />
          <Route exact path="/gmail" component={Gmail} />
          <Route exact path="/review-batch" component={ReviewBatch} />
          <Route exact path="/onboarding/:stepId" component={OnboardingRoute} />
          <Route exact path="/sent-emails" component={SentEmails} />
          <Route exact path="/settings" component={Settings} />
          <Route exact path="/template" component={TemplateEditor} />
          {devRoutes}
          <Route component={FallbackRedirect} />
        </IonRouterOutlet>
      </div>
    </>
  )
}
