import { IonContent, IonPage } from '@ionic/react'
import { useEffect, useState } from 'react'
import { useHistory } from 'react-router-dom'
import AppHeader from '../components/AppHeader'
import AppButton from '../ui/primitives/AppButton'
import AppCard from '../ui/primitives/AppCard'
import AppText from '../ui/primitives/AppText'
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
        <AppCard title="Phase A">
          <AppText intent="body">Send deletion requests to email-based brokers.</AppText>
          <AppButton variant="secondary" onClick={() => history.push('/flow')}>
            Start guided setup
          </AppButton>
          {!gmailConnected && (
            <AppButton onClick={handleConnectGmail}>Connect Gmail</AppButton>
          )}
          <AppButton onClick={handleSendAll} disabled={!gmailConnected || isSending}>
            {isSending ? 'Sending...' : 'Send all requests'}
          </AppButton>
          {summary.failed > 0 && (
            <AppButton
              variant="secondary"
              onClick={handleRetryFailed}
              disabled={!gmailConnected || isSending}
            >
              Retry failed
            </AppButton>
          )}
          <AppText intent="supporting">
            Gmail send-only. No inbox access. {gmailConnected ? 'Connected.' : 'Not connected.'}
          </AppText>
          <AppText intent="supporting">
            {profileReady ? 'Profile saved.' : 'Profile not set.'}
          </AppText>
          <AppText intent="supporting">
            Sent: {summary.sent} · Failed: {summary.failed} · Pending: {summary.pending}
          </AppText>
        </AppCard>

        <AppCard title="Privacy stance">
          <AppText intent="body">All data stays on your device or in your Gmail account.</AppText>
          <AppText intent="body">No analytics or tracking.</AppText>
          <AppText intent="body">Logs are {logOptIn ? 'on' : 'off'} and stored locally only.</AppText>
        </AppCard>
      </IonContent>
    </IonPage>
  )
}
