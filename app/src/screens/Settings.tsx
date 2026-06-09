import { IonContent, IonPage, useIonViewWillEnter } from '@ionic/react'
import { Browser } from '@capacitor/browser'
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import { lazy, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Redirect, useHistory, useLocation } from 'react-router-dom'
import { BUILD_MODE, BUILD_SHA, BUILD_TIME, isDevAppLane } from '../config/buildInfo'
import { SUBSCRIPTION_PRICE_BUTTON_LABEL } from '../config/subscription'
import {
  buildSettingsHref,
  type SettingsView as SettingsRouteView,
  buildBatchSizeHref,
  buildTemplateHref,
  buildOnboardingHref,
  readReturnTo,
} from '../services/navigation'
import { DEFAULT_ROUND_SIZE, getSelectedRoundSize } from '../services/brokerStore'
import { buildTaskHref } from '../services/taskRoutes'
import {
  exportLogsAsText,
  getDevLogOptIn,
  getLogOptInStatus,
  setDevLogOptIn,
  setLogOptIn,
  wipeLogs,
} from '../services/logStore'
import { disconnectGmail, getGmailStatus } from '../services/googleAuth'
import { wipeAllLocalData } from '../services/secureStore'
import {
  buildRestoreSubscriptionNotice,
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
import SubscriptionBillingClaim from '../ui/patterns/SubscriptionBillingClaim'
import SubscriptionDiagnosticsNotice from '../ui/patterns/SubscriptionDiagnosticsNotice'
import SubscriptionOfferCard from '../ui/patterns/SubscriptionOfferCard'
import { useRouteFocus } from '../ui/patterns/useRouteFocus'
import './settings.css'

type SettingsView = 'home' | SettingsRouteView
type SettingsContentView = Exclude<SettingsView, 'gmail'>
type SettingsDestinationView = Exclude<SettingsRouteView, 'gmail'>

const emptyProfile: UserProfile = {
  fullName: '',
  email: '',
  city: '',
  state: '',
  partialZip: '',
}

const GMAIL_PERMISSION_HELP_URL = 'https://scrappykin.com/help/gmail-permission/'
const SUPPORT_HELP_URL = 'https://scrappykin.com/help/'
const PRIVACY_POLICY_URL = 'https://scrappykin.com/privacy.html'
const TERMS_URL = 'https://scrappykin.com/tos.html'
const SUPPORT_EMAIL = 'support@scrappykin.com'
const SUPPORT_EMAIL_URL = `mailto:${SUPPORT_EMAIL}`
const DEV_BUNDLE_ENABLED = import.meta.env.DEV
const SETTINGS_DESTINATIONS = {
  profile: {
    title: 'Profile',
    rowTitle: 'Profile',
    rowDescription: 'Your name and location used in opt-out emails.',
  },
  subscription: {
    title: 'Subscription',
    rowTitle: 'Subscription',
    rowDescription: 'Manage your subscription or restore purchases. Apple handles billing.',
  },
  privacy: {
    title: 'Privacy & local data',
    rowTitle: 'On-device data and deletion',
    rowDescription: 'See what stays on this device and delete it.',
  },
  diagnostics: {
    title: 'Diagnostics & build info',
    rowTitle: 'Diagnostics & build info',
    rowDescription: 'Export local diagnostics and check the build you are running.',
  },
  support: {
    title: 'Support & policies',
    rowTitle: 'Support & policies',
    rowDescription: 'Help, support email, privacy policy, and terms.',
  },
} as const satisfies Record<
  SettingsDestinationView,
  { title: string; rowTitle: string; rowDescription: string }
>
const DevDiagnosticsPanel = DEV_BUNDLE_ENABLED
  ? lazy(() => import('../dev/DevDiagnosticsPanel'))
  : null

function getSettingsView(search: string): SettingsView {
  const view = new URLSearchParams(search).get('view')

  if (view === 'gmail') {
    return view
  }
  if (view && view in SETTINGS_DESTINATIONS) {
    return view as SettingsDestinationView
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
  const headingRef = useRef<HTMLHeadingElement | null>(null)
  const [logOptIn, setOptIn] = useState(false)
  const [logOptInExpiresAt, setLogOptInExpiresAt] = useState('')
  const [nowTs, setNowTs] = useState(() => Date.now())
  const [devLogOptIn, setDevLogOptInState] = useState(false)
  const [showInternalTools, setShowInternalTools] = useState(false)
  const [gmailConnected, setGmailConnected] = useState(false)
  const [profileDraft, setProfileDraft] = useState<UserProfile>(emptyProfile)
  const [selectedRoundSize, setSelectedRoundSizeState] = useState(DEFAULT_ROUND_SIZE)
  const [profileSaved, setProfileSaved] = useState(false)
  const [profileErrors, setProfileErrors] = useState<UserProfileErrors>({})
  const [subscriptionSnapshot, setSubscriptionSnapshot] = useState<SubscriptionSnapshot | null>(null)
  const [subscriptionBusy, setSubscriptionBusy] = useState<'purchase' | 'restore' | null>(null)
  const [subscriptionNotice, setSubscriptionNotice] = useState<{
    variant: 'error' | 'success' | 'info'
    title: string
    body: string
  } | null>(null)
  const [localDataDeleted, setLocalDataDeleted] = useState(false)
  const subscribeButtonLabel =
    subscriptionSnapshot?.product.buttonPriceLabel ?? SUBSCRIPTION_PRICE_BUTTON_LABEL

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
    setSelectedRoundSizeState(await getSelectedRoundSize())
    const nextSubscriptionSnapshot = await getSubscriptionSnapshot()
    setSubscriptionSnapshot(nextSubscriptionSnapshot)
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
    if (returnTo) {
      history.replace(returnTo)
    }
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
    await disconnectGmail()
    await wipeAllLocalData()
    setGmailConnected(false)
    setProfileDraft(emptyProfile)
    setProfileSaved(false)
    setLocalDataDeleted(true)
    history.replace(buildSettingsHref('privacy', buildOnboardingHref('intro')))
  }

  function handlePostDeleteBack() {
    if (view === 'home') {
      history.replace(buildOnboardingHref('intro'))
      return
    }

    history.replace(buildSettingsHref(undefined, buildOnboardingHref('intro')))
  }

  function openUrl(url: string) {
    return Browser.open({ url })
  }

  function openSupportEmail() {
    window.location.href = SUPPORT_EMAIL_URL
  }

  async function handlePurchaseSubscription() {
    setSubscriptionNotice(null)
    setSubscriptionBusy('purchase')
    const result = await purchaseSubscription()
    setSubscriptionBusy(null)
    setSubscriptionSnapshot(result.snapshot)

    if (result.status === 'cancelled') {
      setSubscriptionNotice({
        variant: 'info',
        title: 'Purchase didn’t finish',
        body: result.message,
      })
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
      title: "You're subscribed.",
      body: 'Your yearly subscription is now active.',
    })
  }

  async function handleRestorePurchases() {
    setSubscriptionNotice(null)
    setSubscriptionBusy('restore')
    const result = await restoreSubscriptionPurchases()
    setSubscriptionBusy(null)
    setSubscriptionSnapshot(result.snapshot)
    setSubscriptionNotice(buildRestoreSubscriptionNotice(result))
  }

  function renderHome() {
    return (
      <section className="app-section-shell settings-home">
        <AppText intent="supporting">
          Adjust your opt-out email details, Gmail connection, privacy controls, and support tools.
        </AppText>

        <AppList header="Your opt-out request">
          <AppListRow
            title={SETTINGS_DESTINATIONS.profile.rowTitle}
            description={SETTINGS_DESTINATIONS.profile.rowDescription}
            onClick={() => openView('profile')}
          />
          <AppListRow
            title="Email wording"
            description="Review the message you send to brokers."
            onClick={() => history.push(buildTemplateHref(settingsHomeHref))}
          />
          <AppListRow
            title="Emails at a time"
            description="Choose how many opt-out emails Scrappy Kin sends in each round."
            right={<AppText intent="caption">{selectedRoundSize}</AppText>}
            onClick={() => history.push(buildBatchSizeHref(settingsHomeHref))}
          />
        </AppList>

        <AppList header="Gmail">
          <AppListRow
            title="Gmail connection"
            description={
              gmailConnected
                ? 'Connected with send-only access.'
                : 'Connect the Gmail account Scrappy Kin uses to send emails.'
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

        <AppList header="Support">
          <AppListRow
            title={SETTINGS_DESTINATIONS.support.rowTitle}
            description={SETTINGS_DESTINATIONS.support.rowDescription}
            onClick={() => openView('support')}
          />
          <AppListRow
            title={SETTINGS_DESTINATIONS.diagnostics.rowTitle}
            description={SETTINGS_DESTINATIONS.diagnostics.rowDescription}
            onClick={() => openView('diagnostics')}
          />
        </AppList>

        <AppList header="Subscription">
          <AppListRow
            title={SETTINGS_DESTINATIONS.subscription.rowTitle}
            description={
              subscriptionSnapshot?.active
                ? 'Active on this device. Apple handles billing and renewals.'
                : SETTINGS_DESTINATIONS.subscription.rowDescription
            }
            onClick={() => openView('subscription')}
          />
        </AppList>

        <AppList header="Privacy & local data">
          <AppListRow
            title={SETTINGS_DESTINATIONS.privacy.rowTitle}
            description={SETTINGS_DESTINATIONS.privacy.rowDescription}
            onClick={() => openView('privacy')}
          />
        </AppList>
      </section>
    )
  }

  function renderSubscription() {
    return (
      <section className="app-section-shell">
        <SubscriptionBillingClaim />

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

        <SubscriptionOfferCard
          product={subscriptionSnapshot?.product}
        />

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
              Subscribe — {subscribeButtonLabel}
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

        <AppList header="Policies">
          <AppListRow
            title="Privacy Policy"
            accessibilityHint="Opens web page."
            onClick={() => void openUrl(PRIVACY_POLICY_URL)}
          />
          <AppListRow
            title="Terms of Service"
            accessibilityHint="Opens web page."
            onClick={() => void openUrl(TERMS_URL)}
          />
        </AppList>

        <SubscriptionDiagnosticsNotice snapshot={subscriptionSnapshot} />
      </section>
    )
  }

  function renderProfile() {
    return (
      <section className="app-section-shell">
        <AppText intent="supporting">
          Edit the details used to match your records in the opt-out emails.
        </AppText>
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
        <AppButton onClick={handleSaveProfile}>
          {returnTo ? 'Save and continue' : 'Save profile'}
        </AppButton>
      </section>
    )
  }

  function renderPrivacy() {
    return (
      <section className="app-section-shell">
        <AppText intent="supporting">
          Your profile, Gmail connection, send queue, and diagnostics stay on this device.
        </AppText>
        {localDataDeleted ? (
          <AppNotice
            variant="success"
            title="Local data deleted"
            actions={
              <AppButton
                variant="secondary"
                size="sm"
                onClick={() => history.replace(buildOnboardingHref('intro'))}
              >
                Start over
              </AppButton>
            }
          >
            This device is reset. Scrappy Kin will start fresh the next time you begin setup.
          </AppNotice>
        ) : null}
        <AppList header="Local data controls">
          <AppListRow
            title="Delete all local data"
            description="Delete your saved profile, Gmail connection, diagnostics, and send queue from this device."
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
          Diagnostics stay on this device unless you choose to export them.
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

        <AppList header="Diagnostics">
          <AppListRow title="Export diagnostics (plain text)" onClick={handleExportLogs} />
          <AppListRow title="Download diagnostics file" onClick={handleDownloadLogs} />
          <AppListRow title="Wipe diagnostics" onClick={handleWipeLogs} tone="danger" />
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

        <AppText intent="supporting">
          These notes never send automatically. Share them only if you want troubleshooting help.
        </AppText>

        {showInternalTools ? renderDevDiagnosticsPanel() : null}
      </section>
    )
  }

  function renderSupport() {
    return (
      <section className="app-section-shell">
        <AppList header="Support">
          <AppListRow
            title="Support email"
            accessibilityHint="Opens Mail."
            right={<AppText intent="caption">{SUPPORT_EMAIL}</AppText>}
            onClick={openSupportEmail}
          />
          <AppListRow
            title="Help"
            accessibilityHint="Opens web page."
            onClick={() => void openUrl(SUPPORT_HELP_URL)}
          />
          <AppListRow
            title="How Scrappy Kin uses Gmail permission"
            accessibilityHint="Opens web page."
            onClick={() => void openUrl(GMAIL_PERMISSION_HELP_URL)}
          />
        </AppList>

        <AppList header="Policies">
          <AppListRow
            title="Privacy Policy"
            accessibilityHint="Opens web page."
            onClick={() => void openUrl(PRIVACY_POLICY_URL)}
          />
          <AppListRow
            title="Terms of Service"
            accessibilityHint="Opens web page."
            onClick={() => void openUrl(TERMS_URL)}
          />
        </AppList>
      </section>
    )
  }

  useRouteFocus(view, view !== 'gmail', headingRef)

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
    profile: { title: SETTINGS_DESTINATIONS.profile.title, body: renderProfile() },
    subscription: { title: SETTINGS_DESTINATIONS.subscription.title, body: renderSubscription() },
    privacy: { title: SETTINGS_DESTINATIONS.privacy.title, body: renderPrivacy() },
    diagnostics: { title: SETTINGS_DESTINATIONS.diagnostics.title, body: renderDiagnostics() },
    support: { title: SETTINGS_DESTINATIONS.support.title, body: renderSupport() },
  }

  const screen = viewMap[view as SettingsContentView]

  return (
    <IonPage>
      <IonContent className="page-content">
        <div className="app-screen-shell">
          <AppTopNav
            backHref={view === 'home' ? settingsExitHref : settingsHomeHref}
            onBack={localDataDeleted ? handlePostDeleteBack : undefined}
          />
          <AppHeading intent="section" level={1} ref={headingRef} tabIndex={-1}>
            {screen.title}
          </AppHeading>
          {screen.body}
        </div>
      </IonContent>
    </IonPage>
  )
}
