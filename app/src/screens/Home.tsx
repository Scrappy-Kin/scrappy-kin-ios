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
import { getLogOptIn, logEvent } from '../services/logStore'

export default function Home() {
  const [logOptIn, setLogOptIn] = useState(false)

  useEffect(() => {
    getLogOptIn().then(setLogOptIn)
  }, [])

  async function handleSendAll() {
    await logEvent('send_all_requested', { status: 'pending' })
    alert('Send-all flow will be wired next.')
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
            <IonButton expand="block" onClick={handleSendAll}>
              Send all requests
            </IonButton>
            <IonText color="medium">
              <p>Gmail send-only. No inbox access.</p>
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
