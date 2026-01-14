import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonPage,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/react'
import { useEffect, useState } from 'react'
import { connectGmail, getGmailStatus } from '../services/googleAuth'
import { getSelectedBrokerIds, loadBrokers } from '../services/brokerStore'
import { getLogOptIn, logEvent } from '../services/logStore'
import { getQueue, summarizeQueue } from '../services/queueStore'
import { retryFailed, sendAll } from '../services/sendQueue'

export default function Home() {
  const [logOptIn, setLogOptIn] = useState(false)
  const [gmailConnected, setGmailConnected] = useState(false)
  const [summary, setSummary] = useState({ sent: 0, failed: 0, pending: 0, total: 0 })
  const [isSending, setIsSending] = useState(false)

  useEffect(() => {
    getLogOptIn().then(setLogOptIn)
    getGmailStatus().then((status) => setGmailConnected(status.connected))
    getQueue().then((queue) => setSummary(summarizeQueue(queue)))
  }, [])

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
      <IonHeader>
        <IonToolbar>
          <IonTitle>Scrappy Kin</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="page-content">
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Phase A</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <p>Send deletion requests to email-based brokers.</p>
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
