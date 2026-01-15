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
import { Redirect, Route } from 'react-router-dom'
import Brokers from './screens/Brokers'
import Flow from './screens/Flow'
import Home from './screens/Home'
import Settings from './screens/Settings'
import { useOnlineStatus } from './state/useOnlineStatus'
import HarnessHome from './ui/harness/HarnessHome'
import Surfaces from './ui/harness/Surfaces'
import Typography from './ui/harness/Typography'

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
  const isOnline = useOnlineStatus()

  return (
    <IonApp>
      <IonReactRouter>
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
            <Route exact path="/ui-harness">
              <HarnessHome />
            </Route>
            <Route exact path="/ui-harness/typography">
              <Typography />
            </Route>
            <Route exact path="/ui-harness/surfaces">
              <Surfaces />
            </Route>
          </IonRouterOutlet>
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
        </IonTabs>
      </IonReactRouter>
    </IonApp>
  )
}
