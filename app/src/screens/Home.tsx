import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonPage,
  IonText,
} from '@ionic/react'
import { useEffect, useState } from 'react'
import { useHistory } from 'react-router-dom'
import AppHeader from '../components/AppHeader'
import { connectGmail, getGmailStatus } from '../services/googleAuth'
import { getSelectedBrokerIds, loadBrokers } from '../services/brokerStore'
import { getLogOptIn, logEvent } from '../services/logStore'
import { getQueue, summarizeQueue } from '../services/queueStore'
import { retryFailed, sendAll } from '../services/sendQueue'
import { getUserProfile } from '../services/userProfile'
import { useIonViewWillEnter } from '@ionic/react'

export default function Home() {
  const history = useHistory()
  const [logOptIn, setLogOptIn] = useState(false)
  const [gmailConnected, setGmailConnected] = useState(false)
  const [summary, setSummary] = useState({ sent: 0, failed: 0, pending: 0, total: 0 })
  const [isSending, setIsSending] = useState(false)
  const [profileReady, setProfileReady] = useState(false)

  useEffect(() => {
    getLogOptIn().then(setLogOptIn)
    refreshStatus()
  }, [])

  async function refreshStatus() {
    const status = await getGmailStatus()
    setGmailConnected(status.connected)
    const queue = await getQueue()
    setSummary(summarizeQueue(queue))
    const profile = await getUserProfile()
    setProfileReady(Boolean(profile))
  }

  useIonViewWillEnter(() => {
    refreshStatus()
  })

  async function handleConnectGmail() {
    try {
      await connectGmail()
      const status = await getGmailStatus()
      setGmailConnected(status.connected)
    } catch (error) {
      alert((error as Error).message ?? 'Gmail connection failed.')
    }
  }

  async function handleSendAll() {
    setIsSending(true)
    try {
      await logEvent('send_all_requested', { status: 'pending' })
      const brokers = await loadBrokers()
      const selected = await getSelectedBrokerIds()
      const targetIds = selected.length > 0 ? selected : brokers.map((broker) => broker.id)
      const result = await sendAll(brokers, targetIds, setSummary)
      setSummary(result)
    } catch (error) {
      alert((error as Error).message ?? 'Send failed.')
    } finally {
      setIsSending(false)
    }
  }

  async function handleRetryFailed() {
    setIsSending(true)
    try {
      const brokers = await loadBrokers()
      const selected = await getSelectedBrokerIds()
      const targetIds = selected.length > 0 ? selected : brokers.map((broker) => broker.id)
      const result = await retryFailed(brokers, targetIds, setSummary)
      setSummary(result)
    } catch (error) {
      alert((error as Error).message ?? 'Retry failed.')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <IonPage>
      <AppHeader title="Scrappy Kin" />
      <IonContent className="page-content">
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Phase A</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <p>Send deletion requests to email-based brokers.</p>
            <IonButton expand="block" fill="outline" onClick={() => history.push('/flow')}>
              Start guided setup
            </IonButton>
            {!gmailConnected && (
              <IonButton expand="block" onClick={handleConnectGmail}>
                Connect Gmail
              </IonButton>
            )}
            <IonButton expand="block" onClick={handleSendAll} disabled={!gmailConnected || isSending}>
              {isSending ? 'Sending...' : 'Send all requests'}
            </IonButton>
            {summary.failed > 0 && (
              <IonButton
                expand="block"
                fill="outline"
                onClick={handleRetryFailed}
                disabled={!gmailConnected || isSending}
              >
                Retry failed
              </IonButton>
            )}
            <IonText color="medium">
              <p>
                Gmail send-only. No inbox access. {gmailConnected ? 'Connected.' : 'Not connected.'}
              </p>
              <p>{profileReady ? 'Profile saved.' : 'Profile not set.'}</p>
              <p>
                Sent: {summary.sent} · Failed: {summary.failed} · Pending: {summary.pending}
              </p>
            </IonText>
          </IonCardContent>
        </IonCard>

        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Privacy stance</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <ul>
              <li>All data stays on your device or in your Gmail account.</li>
              <li>No analytics or tracking.</li>
              <li>Logs are {logOptIn ? 'on' : 'off'} and stored locally only.</li>
            </ul>
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  )
}
