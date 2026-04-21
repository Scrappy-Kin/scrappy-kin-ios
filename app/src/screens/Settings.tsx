import { IonContent, IonPage, useIonViewWillEnter } from '@ionic/react'
import { Browser } from '@capacitor/browser'
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import { lazy, Suspense, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Redirect, useHistory, useLocation } from 'react-router-dom'
import { BUILD_MODE, BUILD_SHA, BUILD_TIME, isDevAppLane } from '../config/buildInfo'
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
  loadBrokerCatalogSummary,
  type BrokerCatalogSummary,
} from '../services/brokerStore'
import {
  getSubscriptionSnapshot,
  purchaseSubscription,
  restoreSubscriptionPurchases,
  type SubscriptionSnapshot,
} from '../services/subscription'
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
import AppNotice from '../ui/primitives/AppNotice'
import AppText from '../ui/primitives/AppText'
import AppToggle from '../ui/primitives/AppToggle'
import AppTopNav from '../ui/patterns/AppTopNav'
import SubscriptionOfferCard from '../ui/patterns/SubscriptionOfferCard'
import './settings.css'

type SettingsView =
  | 'home'
  | 'profile'
  | 'gmail'
  | 'subscription'
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
const DEV_BUNDLE_ENABLED = import.meta.env.DEV
const DevDiagnosticsPanel = DEV_BUNDLE_ENABLED
  ? lazy(() => import('../dev/DevDiagnosticsPanel'))
  : null

function getSettingsView(search: string): SettingsView {
  const view = new URLSearchParams(search).get('view')
  if (
    view === 'profile' ||
    view === 'gmail' ||
    view === 'subscription' ||
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
  const [showInternalTools, setShowInternalTools] = useState(false)
  const [gmailConnected, setGmailConnected] = useState(false)
  const [profileDraft, setProfileDraft] = useState<UserProfile>(emptyProfile)
  const [profileSaved, setProfileSaved] = useState(false)
  const [profileErrors, setProfileErrors] = useState<UserProfileErrors>({})
  const [subscriptionSnapshot, setSubscriptionSnapshot] = useState<SubscriptionSnapshot | null>(null)
  const [brokerSummary, setBrokerSummary] = useState<BrokerCatalogSummary>({
    starterCount: 0,
    totalBrokerCount: 0,
    remainingBrokerCount: 0,
  })
  const [subscriptionBusy, setSubscriptionBusy] = useState<'purchase' | 'restore' | null>(null)
  const [subscriptionNotice, setSubscriptionNotice] = useState<{
    variant: 'error' | 'success'
    title: string
    body: string
  } | null>(null)

  async function refreshLogOptIn() {
    const status = await getLogOptInStatus()
    setOptIn(status.enabled)
    setLogOptInExpiresAt(status.expiresAt)
  }

  function renderDevDiagnosticsPanel() {
    if (!DevDiagnosticsPanel) return null
    return (
      <Suspense fallback={null}>
        <DevDiagnosticsPanel
          devLogOptIn={devLogOptIn}
          onChange={handleToggleDevLogs}
        />
      </Suspense>
    )
  }

  async function refreshState() {
    await refreshLogOptIn()
    const gmail = await getGmailStatus()
    setGmailConnected(gmail.connected)
    const devLane = await isDevAppLane()
    setShowInternalTools(devLane)
    if (devLane) {
      setDevLogOptInState(await getDevLogOptIn())
    } else {
      setDevLogOptInState(false)
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
    const [nextSubscriptionSnapshot, nextBrokerSummary] = await Promise.all([
      getSubscriptionSnapshot(),
      loadBrokerCatalogSummary(),
    ])
    setSubscriptionSnapshot(nextSubscriptionSnapshot)
    setBrokerSummary(nextBrokerSummary)
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

  async function handlePurchaseSubscription() {
    setSubscriptionNotice(null)
    setSubscriptionBusy('purchase')
    const result = await purchaseSubscription()
    setSubscriptionBusy(null)
    setSubscriptionSnapshot(result.snapshot)

    if (result.status === 'cancelled') {
      return
    }

    if (result.status === 'error') {
      setSubscriptionNotice({
        variant: 'error',
        title: 'Subscription didn’t start',
        body: result.message,
      })
      return
    }

    setSubscriptionNotice({
      variant: 'success',
      title: 'Subscription active',
      body: 'Your paid access is active on this device.',
    })
  }

  async function handleRestorePurchases() {
    setSubscriptionNotice(null)
    setSubscriptionBusy('restore')
    const result = await restoreSubscriptionPurchases()
    setSubscriptionBusy(null)
    setSubscriptionSnapshot(result.snapshot)
    setSubscriptionNotice({
      variant: result.status === 'restored' ? 'success' : 'error',
      title: result.status === 'restored' ? 'Purchases restored' : 'Restore didn’t complete',
      body: result.message,
    })
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

        <AppList header="Subscription">
          <AppListRow
            title="Subscription"
            description={
              subscriptionSnapshot?.active
                ? 'Active on this device. Apple manages billing and renewals.'
                : 'Subscribe or restore purchases. Apple manages billing.'
            }
            onClick={() => openView('subscription')}
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
            description="Get support contact details and inspect the current build."
            onClick={() => openView('about')}
          />
        </AppList>
      </section>
    )
  }

  function renderSubscription() {
    return (
      <section className="app-section-shell">
        <AppText intent="supporting">
          Apple manages billing and renewals. Scrappy Kin does not store your card details, billing address, or a separate account profile for subscription access.
        </AppText>

        <AppList header="Status">
          <AppListRow
            title="Subscription access"
            description={
              subscriptionSnapshot?.active
                ? 'Active on this device.'
                : 'Not active on this device.'
            }
            right={
              <AppText intent="caption">
                {subscriptionSnapshot?.active ? 'Active' : 'Inactive'}
              </AppText>
            }
            emphasis={false}
          />
        </AppList>

        <SubscriptionOfferCard brokerSummary={brokerSummary} />

        {subscriptionSnapshot?.loadError ? (
          <AppNotice variant="error" title="Subscription unavailable">
            {subscriptionSnapshot.loadError}
          </AppNotice>
        ) : null}

        {subscriptionNotice ? (
          <AppNotice variant={subscriptionNotice.variant} title={subscriptionNotice.title}>
            {subscriptionNotice.body}
          </AppNotice>
        ) : null}

        <div className="app-action-stack">
          {subscriptionSnapshot?.active ? (
            <AppButton fullWidth disabled>
              Subscribed
            </AppButton>
          ) : (
            <AppButton
              fullWidth
              onClick={() => void handlePurchaseSubscription()}
              loading={subscriptionBusy === 'purchase'}
              disabled={subscriptionBusy !== null || subscriptionSnapshot?.isAvailable === false}
            >
              Subscribe — $5/year
            </AppButton>
          )}
          <AppButton
            variant="secondary"
            onClick={() => void handleRestorePurchases()}
            loading={subscriptionBusy === 'restore'}
            disabled={subscriptionBusy !== null}
          >
            Restore Purchases
          </AppButton>
        </div>
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

        {showInternalTools ? renderDevDiagnosticsPanel() : null}
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
    subscription: { title: 'Subscription', body: renderSubscription() },
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
