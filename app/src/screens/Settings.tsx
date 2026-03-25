import { IonContent, IonPage, useIonViewWillEnter } from '@ionic/react'
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import { useEffect, useMemo, useState } from 'react'
import AppHeader from '../components/AppHeader'
import { BUILD_MODE, BUILD_SHA, BUILD_TIME, IS_DEV_BUILD } from '../config/buildInfo'
import {
  exportLogsAsText,
  getDevLogOptIn,
  getLogOptInStatus,
  setDevLogOptIn,
  setLogOptIn,
  wipeLogs,
} from '../services/logStore'
import { disconnectGmail } from '../services/googleAuth'
import { wipeAllLocalData } from '../services/secureStore'
import { getUserProfile, setUserProfile, type UserProfile } from '../services/userProfile'
import AppButton from '../ui/primitives/AppButton'
import AppHeading from '../ui/primitives/AppHeading'
import AppInput from '../ui/primitives/AppInput'
import AppList from '../ui/primitives/AppList'
import AppListRow from '../ui/primitives/AppListRow'
import AppText from '../ui/primitives/AppText'
import AppToggle from '../ui/primitives/AppToggle'
import ServerBoundaryClaim from '../ui/patterns/ServerBoundaryClaim'

export default function Settings() {
  const [logOptIn, setOptIn] = useState(false)
  const [logOptInExpiresAt, setLogOptInExpiresAt] = useState('')
  const [nowTs, setNowTs] = useState(() => Date.now())
  const [devLogOptIn, setDevLogOptInState] = useState(false)
  const [profileDraft, setProfileDraft] = useState<UserProfile>({
    fullName: '',
    email: '',
    city: '',
    state: '',
    partialZip: '',
  })
  const [profileSaved, setProfileSaved] = useState(false)

  async function refreshLogOptIn() {
    const status = await getLogOptInStatus()
    setOptIn(status.enabled)
    setLogOptInExpiresAt(status.expiresAt)
  }

  useIonViewWillEnter(() => {
    void refreshLogOptIn()
    if (IS_DEV_BUILD) {
      void getDevLogOptIn().then(setDevLogOptInState)
    }
    void getUserProfile().then((profile) => {
      if (profile) {
        setProfileDraft(profile)
        setProfileSaved(true)
      }
    })
  })

  useEffect(() => {
    if (!logOptIn || !logOptInExpiresAt) return
    const interval = window.setInterval(() => {
      setNowTs(Date.now())
      refreshLogOptIn()
    }, 30000)
    return () => window.clearInterval(interval)
  }, [logOptIn, logOptInExpiresAt])

  async function handleToggleLogs(enabled: boolean) {
    await setLogOptIn(enabled)
    await refreshLogOptIn()
  }

  async function handleToggleDevLogs(enabled: boolean) {
    await setDevLogOptIn(enabled)
    setDevLogOptInState(enabled)
  }

  function updateProfile(next: Partial<UserProfile>) {
    setProfileDraft((current) => ({ ...current, ...next }))
    setProfileSaved(false)
  }

  function normalizeZipInput(value: string) {
    return value.replace(/\D/g, '').slice(0, 4)
  }

  function isProfileValid(profile: UserProfile) {
    return Boolean(
      profile.fullName &&
        profile.email &&
        profile.city &&
        profile.state &&
        profile.partialZip,
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

  const logOptInRemaining = useMemo(() => {
    if (!logOptIn || !logOptInExpiresAt) return ''
    const remainingMs = Date.parse(logOptInExpiresAt) - nowTs
    if (!Number.isFinite(remainingMs) || remainingMs <= 0) return 'Expired'
    const minutes = Math.max(1, Math.ceil(remainingMs / 60000))
    return `${minutes} min remaining`
  }, [logOptIn, logOptInExpiresAt, nowTs])

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
        <section className="app-section-shell">
          <AppHeading intent="section">Profile</AppHeading>
          <AppText intent="supporting">Edit the details used in your request.</AppText>
          <AppText intent="supporting">{profileSaved ? 'Saved.' : 'Not saved yet.'}</AppText>
          <AppInput
            label="Full name"
            value={profileDraft.fullName}
            onChange={(value) => updateProfile({ fullName: value })}
          />
          <AppInput
            label="Email"
            value={profileDraft.email}
            onChange={(value) => updateProfile({ email: value })}
            inputMode="email"
          />
          <AppInput
            label="City"
            value={profileDraft.city}
            onChange={(value) => updateProfile({ city: value })}
          />
          <AppInput
            label="State"
            value={profileDraft.state}
            onChange={(value) => updateProfile({ state: value })}
            placeholder="CA"
          />
          <AppInput
            label="First Four Digits of ZIP Code"
            value={profileDraft.partialZip}
            onChange={(value) => updateProfile({ partialZip: normalizeZipInput(value) })}
            inputMode="numeric"
            maxLength={4}
            placeholder="1234"
          />
          <AppButton onClick={handleSaveProfile}>Save profile</AppButton>
          <ServerBoundaryClaim />
        </section>

        <section className="app-section-shell app-section-shell--compact">
          <AppHeading intent="section">Diagnostics</AppHeading>
          <AppText intent="body">
            These are short troubleshooting notes that can help us fix bugs. They do not include
            your message content and do not leave your device on their own.
          </AppText>
          <AppText intent="supporting">
            When turned on, Scrappy Kin keeps these notes for 15 minutes. If you want help, you
            can review them first and then choose whether to email them to support@scrappykin.com.
          </AppText>
          <AppToggle
            label="Enable diagnostics"
            description="Capture local logs for 15 minutes."
            checked={logOptIn}
            onChange={handleToggleLogs}
          />
          {logOptIn && logOptInRemaining ? (
            <AppText intent="supporting">Diagnostics capture: {logOptInRemaining}.</AppText>
          ) : null}
        </section>

        <AppList header="Diagnostics actions">
          <AppListRow title="Export diagnostics (plain text)" onClick={handleExportLogs} />
          <AppListRow title="Download diagnostics file" onClick={handleDownloadLogs} />
          <AppListRow title="Wipe diagnostics" onClick={handleWipeLogs} tone="danger" />
        </AppList>
        <AppText intent="supporting">
          These notes never send automatically. Share them only if you want help.
        </AppText>
        <AppText intent="supporting">
          If you contact support (support@scrappykin.com), we receive only what you choose to send us.
        </AppText>

        {IS_DEV_BUILD && (
          <section className="app-section-shell app-section-shell--compact">
            <AppHeading intent="section">Dev diagnostics</AppHeading>
            <AppText intent="supporting">Debug-only toggle for richer local diagnostics.</AppText>
            <AppToggle
              label="Enable dev diagnostics"
              description="Only available in Debug builds. Data stays on-device."
              checked={devLogOptIn}
              onChange={handleToggleDevLogs}
            />
          </section>
        )}

        <AppList header="Build">
          <AppListRow
            title="Build ID"
            right={<AppText intent="caption">{BUILD_SHA}</AppText>}
          />
          <AppListRow
            title="Build time (UTC)"
            right={<AppText intent="caption">{BUILD_TIME}</AppText>}
          />
          <AppListRow
            title="Build mode"
            right={<AppText intent="caption">{BUILD_MODE}</AppText>}
          />
        </AppList>

        <AppList header="Gmail & local data">
          <AppListRow title="Disconnect Gmail" onClick={handleDisconnect} />
          <AppListRow
            title="Delete all local data"
            onClick={handleWipeAll}
            tone="danger"
          />
        </AppList>
      </IonContent>
    </IonPage>
  )
}
