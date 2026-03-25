import {
  IonApp,
  IonContent,
  IonIcon,
  IonLabel,
  IonPage,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
} from '@ionic/react'
import { IonReactRouter } from '@ionic/react-router'
import { home, people, settings } from 'ionicons/icons'
import { Redirect, Route, useLocation } from 'react-router-dom'
import Brokers from './screens/Brokers'
import Flow from './screens/Flow'
import Home from './screens/Home'
import Settings from './screens/Settings'
import { useOnlineStatus } from './state/useOnlineStatus'
import { useEffect } from 'react'
import { clearStaleOAuthState } from './services/googleAuth'
import HarnessHome from './ui/harness/HarnessHome'
import ReviewBoard from './ui/harness/ReviewBoard'
import Patterns from './ui/harness/Patterns'
import Primitives from './ui/harness/Primitives'
import Tokens from './ui/harness/Tokens'
import { IS_DEV_BUILD } from './config/buildInfo'
import AppUrlBridge from './dev/AppUrlBridge'
import CaptureScenarioRoute from './dev/CaptureScenarioRoute'

function OfflineShell() {
  return (
    <IonPage>
      <IonContent className="page-content">
        <div className="offline-shell">
          <h1>Offline</h1>
          <p>This app requires an internet connection to send requests.</p>
          <p>
            Connect to the internet and try again. Settings are still available for
            disconnecting Gmail or deleting local data.
          </p>
        </div>
      </IonContent>
    </IonPage>
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
  const isOnline = useOnlineStatus()
  const location = useLocation()
  const hideOuterTabBar =
    location.pathname.startsWith('/ui-harness') || location.pathname.startsWith('/capture')

  useEffect(() => {
    clearStaleOAuthState().catch(() => undefined)
  }, [])

  return (
    <>
      {IS_DEV_BUILD ? <AppUrlBridge /> : null}
      <IonTabs>
        <IonRouterOutlet>
          <Route exact path="/">
            <Redirect to="/home" />
          </Route>
          <Route exact path="/home">
            {isOnline ? <Home /> : <OfflineShell />}
          </Route>
          <Route exact path="/flow">
            {isOnline ? <Flow /> : <OfflineShell />}
          </Route>
          <Route exact path="/brokers">
            {isOnline ? <Brokers /> : <OfflineShell />}
          </Route>
          <Route exact path="/settings">
            <Settings />
          </Route>
          {IS_DEV_BUILD ? (
            <>
              <Route exact path="/ui-harness">
                <HarnessHome />
              </Route>
              <Route exact path="/ui-harness/review-board">
                <ReviewBoard />
              </Route>
              <Route exact path="/ui-harness/tokens">
                <Tokens />
              </Route>
              <Route exact path="/ui-harness/primitives">
                <Primitives />
              </Route>
              <Route exact path="/ui-harness/patterns">
                <Patterns />
              </Route>
              <Route exact path="/capture/:scenario">
                <CaptureScenarioRoute />
              </Route>
            </>
          ) : null}
        </IonRouterOutlet>
        {hideOuterTabBar ? null : (
          <IonTabBar slot="bottom">
            <IonTabButton tab="home" href="/home">
              <IonIcon aria-hidden="true" icon={home} />
              <IonLabel>Home</IonLabel>
            </IonTabButton>
            <IonTabButton tab="brokers" href="/brokers">
              <IonIcon aria-hidden="true" icon={people} />
              <IonLabel>Brokers</IonLabel>
            </IonTabButton>
            <IonTabButton tab="settings" href="/settings">
              <IonIcon aria-hidden="true" icon={settings} />
              <IonLabel>Settings</IonLabel>
            </IonTabButton>
          </IonTabBar>
        )}
      </IonTabs>
    </>
  )
}
