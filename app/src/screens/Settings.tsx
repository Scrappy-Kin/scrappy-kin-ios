import { IonContent, IonPage, useIonViewWillEnter } from '@ionic/react'
import { Browser } from '@capacitor/browser'
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Redirect, useHistory, useLocation } from 'react-router-dom'
import { BUILD_MODE, BUILD_SHA, BUILD_TIME, IS_DEV_BUILD } from '../config/buildInfo'
import {
  buildSettingsHref,
  buildTemplateHref,
  readReturnTo,
} from '../services/navigation'
import { buildTaskHref } from '../services/taskRoutes'
import {
  exportLogsAsText,
  getDevLogOptIn,
  getLogOptInStatus,
  setDevLogOptIn,
  setLogOptIn,
  wipeLogs,
} from '../services/logStore'
import { getGmailStatus } from '../services/googleAuth'
import { wipeAllLocalData } from '../services/secureStore'
import {
  clearUserProfileDraft,
  getUserProfile,
  getUserProfileValidationErrors,
  setUserProfile,
  type UserProfile,
  type UserProfileErrors,
  type UserProfileField,
} from '../services/userProfile'
import AppButton from '../ui/primitives/AppButton'
import AppHeading from '../ui/primitives/AppHeading'
import AppInput from '../ui/primitives/AppInput'
import AppList from '../ui/primitives/AppList'
import AppListRow from '../ui/primitives/AppListRow'
import AppText from '../ui/primitives/AppText'
import AppToggle from '../ui/primitives/AppToggle'
import AppTopNav from '../ui/patterns/AppTopNav'
import './settings.css'

type SettingsView =
  | 'home'
  | 'profile'
  | 'gmail'
  | 'privacy'
  | 'diagnostics'
  | 'about'

type SettingsContentView = Exclude<SettingsView, 'gmail'>

const emptyProfile: UserProfile = {
  fullName: '',
  email: '',
  city: '',
  state: '',
  partialZip: '',
}

const GMAIL_PERMISSION_HELP_URL = 'https://scrappykin.com/help/gmail-permission/'

function getSettingsView(search: string): SettingsView {
  const view = new URLSearchParams(search).get('view')
  if (
    view === 'profile' ||
    view === 'gmail' ||
    view === 'privacy' ||
    view === 'diagnostics' ||
    view === 'about'
  ) {
    return view
  }
  return 'home'
}

export default function Settings() {
  const history = useHistory()
  const location = useLocation()
  const view = getSettingsView(location.search)
  const returnTo = readReturnTo(location.search)
  const settingsHomeHref = buildSettingsHref(undefined, returnTo)
  const settingsExitHref = returnTo ?? '/home'
  const [logOptIn, setOptIn] = useState(false)
  const [logOptInExpiresAt, setLogOptInExpiresAt] = useState('')
  const [nowTs, setNowTs] = useState(() => Date.now())
  const [devLogOptIn, setDevLogOptInState] = useState(false)
  const [gmailConnected, setGmailConnected] = useState(false)
  const [profileDraft, setProfileDraft] = useState<UserProfile>(emptyProfile)
  const [profileSaved, setProfileSaved] = useState(false)
  const [profileErrors, setProfileErrors] = useState<UserProfileErrors>({})

  async function refreshLogOptIn() {
    const status = await getLogOptInStatus()
    setOptIn(status.enabled)
    setLogOptInExpiresAt(status.expiresAt)
  }

  async function refreshState() {
    await refreshLogOptIn()
    const gmail = await getGmailStatus()
    setGmailConnected(gmail.connected)
    if (IS_DEV_BUILD) {
      setDevLogOptInState(await getDevLogOptIn())
    }
    const profile = await getUserProfile()
    if (profile) {
      setProfileDraft(profile)
      setProfileSaved(true)
    } else {
      setProfileDraft(emptyProfile)
      setProfileSaved(false)
    }
    setProfileErrors({})
  }

  useIonViewWillEnter(() => {
    void refreshState()
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

  function openView(nextView: Exclude<SettingsView, 'home'>) {
    history.push(buildSettingsHref(nextView, returnTo))
  }

  function updateProfile(next: Partial<UserProfile>) {
    setProfileDraft((current) => {
      const updated = { ...current, ...next }
      setProfileErrors((existing) => {
        const nextErrors = { ...existing }
        for (const field of Object.keys(next) as UserProfileField[]) {
          const fieldError = getUserProfileValidationErrors(updated)[field]
          if (fieldError) {
            nextErrors[field] = fieldError
          } else {
            delete nextErrors[field]
          }
        }
        return nextErrors
      })
      return updated
    })
    setProfileSaved(false)
  }

  function normalizeZipInput(value: string) {
    return value.replace(/\D/g, '').slice(0, 4)
  }

  function validateProfile(profile: UserProfile) {
    const errors = getUserProfileValidationErrors(profile)
    setProfileErrors(errors)
    return errors
  }

  function validateProfileField(field: UserProfileField) {
    const nextError = getUserProfileValidationErrors(profileDraft)[field]
    setProfileErrors((existing) => {
      if (!nextError && !existing[field]) return existing
      const next = { ...existing }
      if (nextError) {
        next[field] = nextError
      } else {
        delete next[field]
      }
      return next
    })
  }

  function focusFirstInvalidProfileField(errors: UserProfileErrors) {
    const order: UserProfileField[] = ['fullName', 'email', 'city', 'state', 'partialZip']
    const firstInvalid = order.find((field) => errors[field])
    if (!firstInvalid) return

    const wrapper = document.querySelector(`[data-field-id="${firstInvalid}"]`) as HTMLElement | null
    wrapper?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    const input = wrapper?.querySelector('input, textarea') as HTMLInputElement | HTMLTextAreaElement | null
    input?.focus()
  }

  async function handleSaveProfile() {
    const errors = validateProfile(profileDraft)
    if (Object.keys(errors).length > 0) {
      focusFirstInvalidProfileField(errors)
      return
    }
    await setUserProfile(profileDraft)
    await clearUserProfileDraft()
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

  async function handleWipeAll() {
    const confirmed = confirm('Delete all local data? This cannot be undone.')
    if (!confirmed) return
    await wipeAllLocalData()
    setGmailConnected(false)
    setProfileDraft(emptyProfile)
    setProfileSaved(false)
    alert('All local data deleted.')
  }

  function renderHome() {
    return (
      <section className="app-section-shell settings-home">
        <AppText intent="supporting">
          Adjust your opt-out email details, Gmail connection, privacy controls, and support tools.
        </AppText>

        <AppList header="Request setup">
          <AppListRow
            title="Profile"
            description="Edit the personal information brokers use to find and opt you out of their databases."
            onClick={() => openView('profile')}
          />
          <AppListRow
            title="Email wording"
            description="Change the wording of the email template you will send to brokers."
            onClick={() => history.push(buildTemplateHref(settingsHomeHref))}
          />
        </AppList>

        <AppList header="Gmail">
          <AppListRow
            title="Gmail connection"
            description={
              gmailConnected
                ? 'Connected with send-only access.'
                : 'Connect or disconnect the Gmail account used for sending.'
            }
            onClick={() =>
              history.push(
                buildTaskHref('repair_gmail', {
                  returnTo: settingsHomeHref,
                  successTo: settingsHomeHref,
                }),
              )
            }
          />
        </AppList>

        <AppList header="Privacy & local data">
          <AppListRow
            title="On-device data and deletion"
            description="Review what stays on-device and delete local app data."
            onClick={() => openView('privacy')}
          />
        </AppList>

        <AppList header="Support">
          <AppListRow
            title="Diagnostics"
            description="Export plain-text diagnostics if you want troubleshooting help."
            onClick={() => openView('diagnostics')}
          />
          <AppListRow
            title="Support contact and build info"
            description="Support contact and build information."
            onClick={() => openView('about')}
          />
        </AppList>
      </section>
    )
  }

  function renderProfile() {
    return (
      <section className="app-section-shell">
        <AppText intent="supporting">
          Edit the details used to match your records in the opt-out emails.
        </AppText>
        <AppText intent="caption">* Required</AppText>
        <AppText intent="supporting">{profileSaved ? 'Saved.' : 'Not saved yet.'}</AppText>
        <AppInput
          label="Full name"
          fieldId="fullName"
          required
          value={profileDraft.fullName}
          onChange={(value) => updateProfile({ fullName: value })}
          onBlur={() => validateProfileField('fullName')}
          error={profileErrors.fullName}
        />
        <AppInput
          label="Email"
          fieldId="email"
          required
          value={profileDraft.email}
          onChange={(value) => updateProfile({ email: value })}
          type="email"
          inputMode="email"
          autoCapitalize="none"
          autoCorrect="off"
          autoComplete="email"
          spellCheck={false}
          onBlur={() => validateProfileField('email')}
          error={profileErrors.email}
        />
        <AppInput
          label="City"
          fieldId="city"
          required
          value={profileDraft.city}
          onChange={(value) => updateProfile({ city: value })}
          onBlur={() => validateProfileField('city')}
          error={profileErrors.city}
        />
        <AppInput
          label="State"
          fieldId="state"
          value={profileDraft.state}
          onChange={(value) => updateProfile({ state: value })}
          placeholder="CA"
        />
        <AppInput
          label="Zip Code (first 4 digits)"
          fieldId="partialZip"
          value={profileDraft.partialZip}
          onChange={(value) => updateProfile({ partialZip: normalizeZipInput(value) })}
          inputMode="numeric"
          maxLength={4}
          placeholder="1234"
        />
        <AppButton onClick={handleSaveProfile}>Save profile</AppButton>
      </section>
    )
  }

  function renderPrivacy() {
    return (
      <section className="app-section-shell">
        <AppText intent="supporting">
          Scrappy Kin keeps your profile, Gmail connection, and send queue on this device.
        </AppText>
        <AppList header="Local data controls">
          <AppListRow
            title="Delete all local data"
            description="Remove your saved profile, Gmail connection, diagnostics, and send queue from this device."
            onClick={handleWipeAll}
            tone="danger"
          />
        </AppList>
      </section>
    )
  }

  function renderDiagnostics() {
    return (
      <section className="app-section-shell">
        <AppText intent="supporting">
          Diagnostics are optional and stay local until you choose to export them.
        </AppText>

        <section className="app-section-shell app-section-shell--compact">
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
          These notes never send automatically. Share them only if you want troubleshooting help.
        </AppText>

        {IS_DEV_BUILD ? (
          <section className="internal-tools-panel">
            <AppHeading intent="section">Internal only</AppHeading>
            <AppText intent="supporting">
              Debug-only controls for local testing. Not part of the user-facing product.
            </AppText>
            <AppToggle
              label="Enable dev diagnostics"
              description="Only available in Debug builds. Data stays on-device."
              checked={devLogOptIn}
              onChange={handleToggleDevLogs}
            />
          </section>
        ) : null}
      </section>
    )
  }

  function renderAbout() {
    return (
      <section className="app-section-shell">
        <AppList header="Support">
          <AppListRow
            title="How Scrappy Kin uses Gmail permission"
            description="Open the plain-language help article."
            onClick={() => Browser.open({ url: GMAIL_PERMISSION_HELP_URL })}
          />
          <AppListRow
            title="Support email"
            right={<AppText intent="caption">support@scrappykin.com</AppText>}
            emphasis={false}
          />
        </AppList>

        <AppList header="Build">
          <AppListRow title="Build ID" right={<AppText intent="caption">{BUILD_SHA}</AppText>} />
          <AppListRow
            title="Build time (UTC)"
            right={<AppText intent="caption">{BUILD_TIME}</AppText>}
          />
          <AppListRow
            title="Build mode"
            right={<AppText intent="caption">{BUILD_MODE}</AppText>}
          />
        </AppList>
      </section>
    )
  }

  if (view === 'gmail') {
    return (
      <Redirect
        to={buildTaskHref('repair_gmail', {
          returnTo: settingsHomeHref,
          successTo: settingsHomeHref,
        })}
      />
    )
  }

  const viewMap: Record<SettingsContentView, { title: string; body: ReactNode }> = {
    home: { title: 'Settings', body: renderHome() },
    profile: { title: 'Profile', body: renderProfile() },
    privacy: { title: 'Privacy & local data', body: renderPrivacy() },
    diagnostics: { title: 'Diagnostics', body: renderDiagnostics() },
    about: { title: 'Support contact and build info', body: renderAbout() },
  }

  const screen = viewMap[view as SettingsContentView]

  return (
    <IonPage>
      <IonContent className="page-content">
        <div className="app-screen-shell">
          <AppTopNav backHref={view === 'home' ? settingsExitHref : settingsHomeHref} />
          <AppHeading intent="section">{screen.title}</AppHeading>
          {screen.body}
        </div>
      </IonContent>
    </IonPage>
  )
}
