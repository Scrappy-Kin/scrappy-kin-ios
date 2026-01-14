import {
  IonButton,
  IonCard,
  IonCardContent,
  IonContent,
  IonItem,
  IonInput,
  IonLabel,
  IonPage,
  IonText,
  useIonViewWillEnter,
} from '@ionic/react'
import { useState } from 'react'
import { useHistory } from 'react-router-dom'
import AppHeader from '../components/AppHeader'
import { phaseAInfoSteps } from '../content/infoSteps'
import { getSelectedBrokerIds, loadBrokers } from '../services/brokerStore'
import { connectGmail, getGmailStatus } from '../services/googleAuth'
import { buildDeletionBody, buildDeletionSubject } from '../services/emailTemplate'
import { getUserProfile, setUserProfile, type UserProfile } from '../services/userProfile'

const emptyProfile: UserProfile = {
  fullName: '',
  email: '',
  city: '',
  country: '',
  partialPostcode: '',
}

type Step = {
  id: string
  title: string
  render: () => JSX.Element
  canContinue?: boolean
}

export default function Flow() {
  const history = useHistory()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [gmailConnected, setGmailConnected] = useState(false)
  const [profileDraft, setProfileDraft] = useState<UserProfile>(emptyProfile)
  const [profileSaved, setProfileSaved] = useState(false)
  const [brokersCount, setBrokersCount] = useState(0)
  const [selectedCount, setSelectedCount] = useState(0)

  async function refreshState() {
    const status = await getGmailStatus()
    setGmailConnected(status.connected)
    const profile = await getUserProfile()
    if (profile) {
      setProfileDraft(profile)
      setProfileSaved(true)
    } else {
      setProfileDraft(emptyProfile)
      setProfileSaved(false)
    }
    const brokers = await loadBrokers()
    setBrokersCount(brokers.length)
    const ids = await getSelectedBrokerIds()
    setSelectedCount(ids.length)
  }

  useIonViewWillEnter(() => {
    refreshState()
  })

  const infoSteps: Step[] = phaseAInfoSteps.map((step) => ({
    id: step.id,
    title: step.title,
    render: () => (
      <IonCard className="section-card">
        <IonCardContent>
          {step.body.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </IonCardContent>
      </IonCard>
    ),
    canContinue: true,
  }))

  const steps: Step[] = [
    ...infoSteps,
    {
      id: 'gmail-login',
      title: 'Gmail login',
      render: () => (
        <IonCard className="section-card">
          <IonCardContent>
            <p>We will open a secure Google login screen in your browser.</p>
            <IonButton expand="block" onClick={handleConnectGmail}>
              Open Google login
            </IonButton>
            <IonText color="medium">
              <p>{gmailConnected ? 'Connected.' : 'Not connected yet.'}</p>
            </IonText>
          </IonCardContent>
        </IonCard>
      ),
      canContinue: gmailConnected,
    },
    {
      id: 'gmail-auth',
      title: 'Gmail permissions',
      render: () => (
        <IonCard className="section-card">
          <IonCardContent>
            <p>Google will ask for permission to send email on your behalf.</p>
            <p>We only request send-only access. No inbox access.</p>
            {!gmailConnected && (
              <IonButton expand="block" fill="outline" onClick={handleConnectGmail}>
                Re-open Google approval
              </IonButton>
            )}
            <IonText color="medium">
              <p>{gmailConnected ? 'Connected.' : 'Not connected yet.'}</p>
            </IonText>
          </IonCardContent>
        </IonCard>
      ),
      canContinue: gmailConnected,
    },
    {
      id: 'gmail-success',
      title: 'Success',
      render: () => (
        <IonCard className="section-card">
          <IonCardContent>
            <p>{gmailConnected ? 'Success! Gmail is connected.' : 'Connect Gmail to continue.'}</p>
          </IonCardContent>
        </IonCard>
      ),
      canContinue: gmailConnected,
    },
    {
      id: 'profile',
      title: 'Your info',
      render: () => (
        <IonCard className="section-card">
          <IonCardContent>
            <p>This is the minimum info brokers require.</p>
            <div className="form-stack">
              <IonItem>
                <IonLabel position="stacked">Full name</IonLabel>
                <IonInput
                  value={profileDraft.fullName}
                  onIonChange={(event) => updateProfile({ fullName: event.detail.value ?? '' })}
                />
              </IonItem>
              <IonItem>
                <IonLabel position="stacked">Email</IonLabel>
                <IonInput
                  type="email"
                  value={profileDraft.email}
                  onIonChange={(event) => updateProfile({ email: event.detail.value ?? '' })}
                />
              </IonItem>
              <IonItem>
                <IonLabel position="stacked">City</IonLabel>
                <IonInput
                  value={profileDraft.city}
                  onIonChange={(event) => updateProfile({ city: event.detail.value ?? '' })}
                />
              </IonItem>
              <IonItem>
                <IonLabel position="stacked">Country</IonLabel>
                <IonInput
                  value={profileDraft.country}
                  onIonChange={(event) => updateProfile({ country: event.detail.value ?? '' })}
                />
              </IonItem>
              <IonItem>
                <IonLabel position="stacked">Partial postcode</IonLabel>
                <IonInput
                  value={profileDraft.partialPostcode}
                  onIonChange={(event) =>
                    updateProfile({ partialPostcode: event.detail.value ?? '' })
                  }
                />
              </IonItem>
            </div>
            <IonButton expand="block" onClick={handleSaveProfile}>
              Save
            </IonButton>
          </IonCardContent>
        </IonCard>
      ),
      canContinue: profileSaved && isProfileValid(profileDraft),
    },
    {
      id: 'email-preview',
      title: 'Email preview',
      render: () => (
        <IonCard className="section-card">
          <IonCardContent>
            <p>Subject:</p>
            <pre className="email-preview">{buildDeletionSubject()}</pre>
            <p>Body:</p>
            <pre className="email-preview">
              {buildDeletionBody({ name: 'Broker', contactEmail: '' }, profileDraft)}
            </pre>
          </IonCardContent>
        </IonCard>
      ),
      canContinue: true,
    },
    {
      id: 'brokers',
      title: 'Pick brokers',
      render: () => (
        <IonCard className="section-card">
          <IonCardContent>
            <p>{brokersCount} brokers available.</p>
            <p>{selectedCount > 0 ? `${selectedCount} selected.` : 'None selected yet.'}</p>
            <IonButton expand="block" fill="outline" onClick={() => history.push('/brokers')}>
              Open broker list
            </IonButton>
          </IonCardContent>
        </IonCard>
      ),
      canContinue: true,
    },
    {
      id: 'ready',
      title: 'Ready to send',
      render: () => (
        <IonCard className="section-card">
          <IonCardContent>
            <p>When you are ready, send the requests.</p>
            <IonButton expand="block" onClick={() => history.push('/home')}>
              Send now
            </IonButton>
          </IonCardContent>
        </IonCard>
      ),
      canContinue: true,
    },
  ]

  const step = steps[currentIndex]

  function updateProfile(next: Partial<UserProfile>) {
    setProfileDraft((current) => ({ ...current, ...next }))
    setProfileSaved(false)
  }

  function isProfileValid(profile: UserProfile) {
    return Boolean(
      profile.fullName &&
        profile.email &&
        profile.city &&
        profile.country &&
        profile.partialPostcode,
    )
  }

  async function handleConnectGmail() {
    try {
      await connectGmail()
      const status = await getGmailStatus()
      setGmailConnected(status.connected)
    } catch (error) {
      alert((error as Error).message ?? 'Gmail connection failed.')
    }
  }

  async function handleSaveProfile() {
    if (!isProfileValid(profileDraft)) {
      alert('Please fill in all fields.')
      return
    }
    await setUserProfile(profileDraft)
    setProfileSaved(true)
  }

  function goNext() {
    if (currentIndex < steps.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  function goBack() {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  return (
    <IonPage>
      <AppHeader title={step.title} />
      <IonContent className="page-content">
        {step.render()}
        <div className="flow-actions">
          <IonButton fill="outline" onClick={goBack} disabled={currentIndex === 0}>
            Back
          </IonButton>
          <IonButton onClick={goNext} disabled={step.canContinue === false}>
            Next
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  )
}
