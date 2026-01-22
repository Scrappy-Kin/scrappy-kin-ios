import { IonContent, IonPage } from '@ionic/react'
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
import AppCard from '../ui/primitives/AppCard'
import AppInput from '../ui/primitives/AppInput'
import AppList from '../ui/primitives/AppList'
import AppListRow from '../ui/primitives/AppListRow'
import AppText from '../ui/primitives/AppText'
import AppToggle from '../ui/primitives/AppToggle'

export default function Settings() {
  const [logOptIn, setOptIn] = useState(false)
  const [logOptInExpiresAt, setLogOptInExpiresAt] = useState('')
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
    refreshLogOptIn()
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

  useEffect(() => {
    if (!logOptIn || !logOptInExpiresAt) return
    const interval = window.setInterval(() => {
      refreshLogOptIn()
    }, 30000)
    return () => window.clearInterval(interval)
  }, [logOptIn, logOptInExpiresAt])

  async function handleToggleLogs(enabled: boolean) {
    await setLogOptIn(enabled)
    await refreshLogOptIn()
  }

  async function refreshLogOptIn() {
    const status = await getLogOptInStatus()
    setOptIn(status.enabled)
    setLogOptInExpiresAt(status.expiresAt)
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

  const logOptInRemaining = useMemo(() => {
    if (!logOptIn || !logOptInExpiresAt) return ''
    const remainingMs = Date.parse(logOptInExpiresAt) - Date.now()
    if (!Number.isFinite(remainingMs) || remainingMs <= 0) return 'Expired'
    const minutes = Math.max(1, Math.ceil(remainingMs / 60000))
    return `${minutes} min remaining`
  }, [logOptIn, logOptInExpiresAt])

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
        <AppCard title="Profile">
          <AppText intent="supporting">Edit the info used for broker requests.</AppText>
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
            label="Country"
            value={profileDraft.country}
            onChange={(value) => updateProfile({ country: value })}
          />
          <AppInput
            label="Partial postcode"
            value={profileDraft.partialPostcode}
            onChange={(value) => updateProfile({ partialPostcode: value })}
          />
          <AppButton onClick={handleSaveProfile}>Save profile</AppButton>
        </AppCard>

        <AppCard title="Diagnostics">
          <AppText intent="body">
            Diagnostics are short, local logs that help us troubleshoot bugs. They never include
            your personal info and never leave your device automatically.
          </AppText>
          <AppText intent="supporting">
            When enabled, diagnostics capture for 15 minutes. Export is manual: review the
            plain-text file and email it to support@scrappykin.com.
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
        </AppCard>

        <AppList header="Diagnostics actions">
          <AppListRow title="Export diagnostics (plain text)" onClick={handleExportLogs} />
          <AppListRow title="Download diagnostics file" onClick={handleDownloadLogs} />
          <AppListRow title="Wipe diagnostics" onClick={handleWipeLogs} tone="danger" />
        </AppList>
        <AppText intent="supporting">
          Diagnostics never send automatically. Export and send manually if needed.
        </AppText>

        {IS_DEV_BUILD && (
          <AppCard title="Dev diagnostics">
            <AppText intent="supporting">Debug-only toggle for richer local diagnostics.</AppText>
            <AppToggle
              label="Enable dev diagnostics"
              description="Only available in Debug builds. Data stays on-device."
              checked={devLogOptIn}
              onChange={handleToggleDevLogs}
            />
          </AppCard>
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

        <AppList header="Account">
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
