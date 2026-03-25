import { IonContent, IonPage } from '@ionic/react'
import { useEffect, useState } from 'react'
import { useHistory } from 'react-router-dom'
import AppHeader from '../components/AppHeader'
import AppButton from '../ui/primitives/AppButton'
import AppCard from '../ui/primitives/AppCard'
import AppHeading from '../ui/primitives/AppHeading'
import AppText from '../ui/primitives/AppText'
import { connectGmail, getGmailStatus } from '../services/googleAuth'
import { getSelectedBrokerIds, loadBrokers } from '../services/brokerStore'
import { getLogOptIn, logEvent } from '../services/logStore'
import { getQueue, summarizeQueue } from '../services/queueStore'
import { retryFailed, sendAll } from '../services/sendQueue'
import { getUserProfile } from '../services/userProfile'
import { useIonViewWillEnter } from '@ionic/react'
import ServerBoundaryClaim from '../ui/patterns/ServerBoundaryClaim'

export default function Home() {
  const history = useHistory()
  const [logOptIn, setLogOptIn] = useState(false)
  const [gmailConnected, setGmailConnected] = useState(false)
  const [summary, setSummary] = useState({ sent: 0, failed: 0, pending: 0, total: 0 })
  const [isSending, setIsSending] = useState(false)
  const [profileReady, setProfileReady] = useState(false)
  const [selectedCount, setSelectedCount] = useState(0)

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
    const selected = await getSelectedBrokerIds()
    setSelectedCount(selected.length)
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
        <section className="app-section-shell">
          <AppHeading intent="section">Phase A</AppHeading>
          <AppText intent="body">Send deletion requests to email-based brokers.</AppText>
          <div className="app-action-stack">
            <AppButton
              variant="secondary"
              onClick={() =>
                history.push(
                  profileReady || selectedCount > 0 ? '/flow?step=request-review' : '/flow',
                )
              }
            >
              {profileReady || selectedCount > 0 ? 'Review request' : 'Start guided setup'}
            </AppButton>
            {!gmailConnected && (
              <AppButton onClick={handleConnectGmail}>Connect Gmail</AppButton>
            )}
            <AppButton onClick={handleSendAll} disabled={!gmailConnected || isSending}>
              {isSending ? 'Sending...' : 'Send selected requests'}
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
          </div>
          <ServerBoundaryClaim />
        </section>

        <AppCard title="Queue summary">
          <div className="app-meta-stack">
            <AppText intent="supporting">
              Gmail send-only. No inbox access. {gmailConnected ? 'Connected.' : 'Not connected.'}
            </AppText>
            <AppText intent="supporting">
              {profileReady ? 'Profile saved.' : 'Profile not set.'}
            </AppText>
            <AppText intent="supporting">
              {selectedCount > 0 ? `${selectedCount} brokers selected.` : 'No brokers selected yet.'}
            </AppText>
            <AppText intent="supporting">
              Sent: {summary.sent} · Failed: {summary.failed} · Pending: {summary.pending}
            </AppText>
          </div>
        </AppCard>

        <section className="app-section-shell app-section-shell--compact">
          <AppHeading intent="section">Privacy stance</AppHeading>
          <AppText intent="body">No analytics or tracking.</AppText>
          <AppText intent="body">
            Troubleshooting notes are {logOptIn ? 'on' : 'off'}. They stay on your device unless you choose to share them.
          </AppText>
          <AppText intent="body">
            If you contact support, we receive only what you choose to send us.
          </AppText>
        </section>
      </IonContent>
    </IonPage>
  )
}
