import {
  IonButton,
  IonContent,
  IonItem,
  IonInput,
  IonLabel,
  IonList,
  IonNote,
  IonPage,
  IonToggle,
} from '@ionic/react'
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import { useEffect, useState } from 'react'
import AppHeader from '../components/AppHeader'
import { BUILD_MODE, BUILD_SHA, BUILD_TIME, IS_DEV_BUILD } from '../config/buildInfo'
import {
  exportLogsAsText,
  getDevLogOptIn,
  getLogOptIn,
  setDevLogOptIn,
  setLogOptIn,
  wipeLogs,
} from '../services/logStore'
import { disconnectGmail } from '../services/googleAuth'
import { wipeAllLocalData } from '../services/secureStore'
import { getUserProfile, setUserProfile, type UserProfile } from '../services/userProfile'

export default function Settings() {
  const [logOptIn, setOptIn] = useState(false)
  const [devLogOptIn, setDevLogOptInState] = useState(false)
  const [profileDraft, setProfileDraft] = useState<UserProfile>({
    fullName: '',
    email: '',
    city: '',
    country: '',
    partialPostcode: '',
  })
  const [profileSaved, setProfileSaved] = useState(false)

  useEffect(() => {
    getLogOptIn().then(setOptIn)
    if (IS_DEV_BUILD) {
      getDevLogOptIn().then(setDevLogOptInState)
    }
    getUserProfile().then((profile) => {
      if (profile) {
        setProfileDraft(profile)
        setProfileSaved(true)
      }
    })
  }, [])

  async function handleToggleLogs(enabled: boolean) {
    await setLogOptIn(enabled)
    setOptIn(enabled)
  }

  async function handleToggleDevLogs(enabled: boolean) {
    await setDevLogOptIn(enabled)
    setDevLogOptInState(enabled)
  }

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

  async function handleSaveProfile() {
    if (!isProfileValid(profileDraft)) {
      alert('Please fill in all fields.')
      return
    }
    await setUserProfile(profileDraft)
    setProfileSaved(true)
  }

  async function handleExportLogs() {
    const text = await exportLogsAsText()
    if (!text) {
      alert('No logs to export.')
      return
    }

    await navigator.clipboard.writeText(text)
    alert('Diagnostics copied to clipboard. Paste into a plain text file to share.')
  }

  async function handleDownloadLogs() {
    const text = await exportLogsAsText()
    if (!text) {
      alert('No logs to export.')
      return
    }

    const filename = `scrappy-kin-diagnostics-${new Date().toISOString()}.txt`
    const result = await Filesystem.writeFile({
      path: filename,
      data: text,
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
    })

    await Share.share({
      title: 'Scrappy Kin diagnostics',
      text: 'Plain text diagnostics export.',
      url: result.uri,
      dialogTitle: 'Share diagnostics',
    })
  }

  async function handleWipeLogs() {
    await wipeLogs()
    alert('Logs wiped locally.')
  }

  async function handleDisconnect() {
    await disconnectGmail()
    alert('Gmail disconnected.')
  }

  async function handleWipeAll() {
    const confirmed = confirm('Delete all local data? This cannot be undone.')
    if (!confirmed) return
    await wipeAllLocalData()
    alert('All local data deleted.')
  }

  return (
    <IonPage>
      <AppHeader title="Settings" />
      <IonContent className="page-content">
        <IonList>
          <IonItem>
            <IonLabel>
              <h2>Profile</h2>
              <p>Edit the info used for broker requests.</p>
              <p>{profileSaved ? 'Saved.' : 'Not saved yet.'}</p>
            </IonLabel>
          </IonItem>
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
          <IonItem lines="none">
            <IonButton expand="block" onClick={handleSaveProfile}>
              Save profile
            </IonButton>
          </IonItem>
        </IonList>

        <IonList>
          <IonItem>
            <IonLabel>
              <h2>Diagnostics</h2>
              <p>
                Diagnostics are short, local logs that help us troubleshoot bugs. They never
                include your personal info and never leave your device automatically.
              </p>
              <p>
                If you choose to export them, you can review the plain-text file and email it to
                support@scrappykin.com.
              </p>
            </IonLabel>
            <IonToggle
              checked={logOptIn}
              onIonChange={(event) => handleToggleLogs(event.detail.checked)}
            />
          </IonItem>
          <IonItem button onClick={handleExportLogs}>
            <IonLabel>Export diagnostics (plain text)</IonLabel>
          </IonItem>
          <IonItem button onClick={handleDownloadLogs}>
            <IonLabel>Download diagnostics file</IonLabel>
          </IonItem>
          <IonItem button onClick={handleWipeLogs}>
            <IonLabel>Wipe diagnostics</IonLabel>
          </IonItem>
          <IonItem lines="none">
            <IonNote>
              Diagnostics never send automatically. Copy or download and email manually if needed.
            </IonNote>
          </IonItem>
        </IonList>

        {IS_DEV_BUILD && (
          <IonList>
            <IonItem>
              <IonLabel>
                <h2>Dev diagnostics</h2>
                <p>Debug-only toggle for richer local diagnostics.</p>
              </IonLabel>
              <IonToggle
                checked={devLogOptIn}
                onIonChange={(event) => handleToggleDevLogs(event.detail.checked)}
              />
            </IonItem>
            <IonItem lines="none">
              <IonNote>Only available in Debug builds. Data stays on-device.</IonNote>
            </IonItem>
          </IonList>
        )}

        <IonList>
          <IonItem>
            <IonLabel>
              <h2>Build</h2>
              <p>Use this when reporting issues.</p>
            </IonLabel>
          </IonItem>
          <IonItem>
            <IonLabel>Build ID</IonLabel>
            <IonNote slot="end">{BUILD_SHA}</IonNote>
          </IonItem>
          <IonItem>
            <IonLabel>Build time (UTC)</IonLabel>
            <IonNote slot="end">{BUILD_TIME}</IonNote>
          </IonItem>
          <IonItem lines="none">
            <IonLabel>Build mode</IonLabel>
            <IonNote slot="end">{BUILD_MODE}</IonNote>
          </IonItem>
        </IonList>

        <IonList>
          <IonItem button onClick={handleDisconnect}>
            <IonLabel>Disconnect Gmail</IonLabel>
          </IonItem>
          <IonItem button onClick={handleWipeAll}>
            <IonLabel>Delete all local data</IonLabel>
          </IonItem>
        </IonList>
      </IonContent>
    </IonPage>
  )
}
