import { IonAlert, IonContent, IonPage, useIonViewWillEnter } from '@ionic/react'
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import { lazy, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Redirect, useHistory, useLocation } from 'react-router-dom'
import { BUILD_SHA, BUILD_TIME, getExecutionLane, isDevAppLane } from '../config/buildInfo'
import {
  SETTINGS_DESTINATIONS,
  SETTINGS_HOME_ROWS,
} from '../content/settingsCopy'
import {
  buildSettingsHref,
  type SettingsView as SettingsRouteView,
  buildBatchSizeHref,
  buildTemplateHref,
  buildOnboardingHref,
  readReturnTo,
  readSettingsNotice,
} from '../services/navigation'
import { buildTaskHref } from '../services/taskRoutes'
import { openExternalUrl } from '../services/externalBrowser'
import { formatExecutionLane, formatVersionCreatedAt } from '../services/buildDisplay'
import {
  exportLogsAsText,
  getDevLogOptIn,
  getLogOptInStatus,
  setDevLogOptIn,
  setLogOptIn,
  wipeLogs,
} from '../services/logStore'
import { getDiagnosticCaptureDescriptions } from '../services/logSchema'
import { disconnectGmail, getGmailStatus } from '../services/googleAuth'
import { wipeAllLocalData } from '../services/secureStore'
import {
  buildRestoreSubscriptionNotice,
  buildSubscriptionButtonAccessibilityLabel,
  buildSubscriptionButtonLabel,
  getSubscriptionSnapshot,
  isSubscriptionPurchaseReady,
  manageSubscriptionSettings,
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
import AppActionNotice from '../ui/primitives/AppActionNotice'
import AppBulletRow from '../ui/primitives/AppBulletRow'
import AppForm from '../ui/primitives/AppForm'
import AppHeading from '../ui/primitives/AppHeading'
import AppList from '../ui/primitives/AppList'
import AppListRow from '../ui/primitives/AppListRow'
import AppNotice from '../ui/primitives/AppNotice'
import AppSectionLabel from '../ui/primitives/AppSectionLabel'
import AppText from '../ui/primitives/AppText'
import AppToggle from '../ui/primitives/AppToggle'
import AppTopNav from '../ui/patterns/AppTopNav'
import SubscriptionDiagnosticsNotice from '../ui/patterns/SubscriptionDiagnosticsNotice'
import SubscriptionOfferCard from '../ui/patterns/SubscriptionOfferCard'
import ProfileFields from '../ui/patterns/ProfileFields'
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
const DIAGNOSTIC_CAPTURE_DESCRIPTIONS = getDiagnosticCaptureDescriptions()
const DEV_BUNDLE_ENABLED = import.meta.env.DEV
const settingsNoticeCopy = {
  'profile-saved': {
    title: 'Saved',
    body: 'Profile updated.',
  },
  'wording-saved': {
    title: 'Saved',
    body: 'Email wording updated.',
  },
  'round-size-saved': {
    title: 'Saved',
    body: 'Round size updated.',
  },
} as const
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
  const settingsNotice = readSettingsNotice(location.search)
  const settingsHomeHref = buildSettingsHref(undefined, returnTo)
  const settingsExitHref = returnTo ?? '/home'
  const headingRef = useRef<HTMLHeadingElement | null>(null)
  const contentRef = useRef<HTMLIonContentElement | null>(null)
  const [logOptIn, setOptIn] = useState(false)
  const [logOptInExpiresAt, setLogOptInExpiresAt] = useState('')
  const [nowTs, setNowTs] = useState(() => Date.now())
  const [devLogOptIn, setDevLogOptInState] = useState(false)
  const [showInternalTools, setShowInternalTools] = useState(false)
  const [gmailConnected, setGmailConnected] = useState(false)
  const [profileDraft, setProfileDraft] = useState<UserProfile>(emptyProfile)
  const [profileErrors, setProfileErrors] = useState<UserProfileErrors>({})
  const [subscriptionSnapshot, setSubscriptionSnapshot] = useState<SubscriptionSnapshot | null>(null)
  const [subscriptionBusy, setSubscriptionBusy] = useState<'purchase' | 'restore' | 'manage' | null>(null)
  const [subscriptionNotice, setSubscriptionNotice] = useState<{
    variant: 'error' | 'success' | 'info'
    title: string
    body: string
  } | null>(null)
  const [diagnosticsNotice, setDiagnosticsNotice] = useState<{
    variant: 'error' | 'success' | 'info'
    title: string
    body: string
  } | null>(null)
  const [localDataDeleted, setLocalDataDeleted] = useState(false)
  const [showDeleteAllAlert, setShowDeleteAllAlert] = useState(false)
  const shouldContinueAfterProfileSave = returnTo?.startsWith('/review-batch') ?? false
  const subscribeButtonLabel =
    buildSubscriptionButtonLabel(subscriptionSnapshot)
  const versionCreatedAt = formatVersionCreatedAt(BUILD_TIME)
  const appLaneLabel = formatExecutionLane(getExecutionLane())

  async function refreshLogOptIn() {
    const status = await getLogOptInStatus()
    setNowTs(Date.now())
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
    } else {
      setProfileDraft(emptyProfile)
    }
    setProfileErrors({})
    const nextSubscriptionSnapshot = await getSubscriptionSnapshot()
    setSubscriptionSnapshot(nextSubscriptionSnapshot)
  }

  useIonViewWillEnter(() => {
    void refreshState()
  })

  useEffect(() => {
    void contentRef.current?.scrollToTop(0)
  }, [view])

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
    setDiagnosticsNotice(
      enabled
        ? null
        : {
            variant: 'info',
            title: 'Diagnostics off',
            body: 'Diagnostics capture disabled.',
          },
    )
  }

  async function handleToggleDevLogs(enabled: boolean) {
    await setDevLogOptIn(enabled)
    setDevLogOptInState(enabled)
  }

  function openView(nextView: Exclude<SettingsView, 'home'>) {
    if (nextView === 'diagnostics') {
      void refreshLogOptIn()
    }
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
    if (shouldContinueAfterProfileSave && returnTo) {
      history.replace(returnTo)
      return
    }
    history.replace(buildSettingsHref(undefined, returnTo, 'profile-saved'))
  }

  const logOptInRemaining = useMemo(() => {
    if (!logOptIn || !logOptInExpiresAt) return ''
    const remainingMs = Date.parse(logOptInExpiresAt) - nowTs
    if (!Number.isFinite(remainingMs) || remainingMs <= 0) return 'Expired'
    const minutes = Math.max(1, Math.ceil(remainingMs / 60000))
    return `${minutes} min remaining`
  }, [logOptIn, logOptInExpiresAt, nowTs])

  const emptyDiagnosticsExportCopy = logOptIn
    ? 'No diagnostic events have been captured yet. Try again after using Gmail connection, subscription, or send flows.'
    : 'Turn on diagnostics first, then try again after logs have been captured.'

  async function handleExportLogs() {
    const text = await exportLogsAsText()
    if (!text) {
      setDiagnosticsNotice({
        variant: 'info',
        title: 'No diagnostics to export',
        body: emptyDiagnosticsExportCopy,
      })
      return
    }

    await navigator.clipboard.writeText(text)
    setDiagnosticsNotice({
      variant: 'success',
      title: 'Diagnostics copied',
      body: 'Paste them into a plain text file if you want to share them.',
    })
  }

  async function handleDownloadLogs() {
    const text = await exportLogsAsText()
    if (!text) {
      setDiagnosticsNotice({
        variant: 'info',
        title: 'No diagnostics to download',
        body: emptyDiagnosticsExportCopy,
      })
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
    setDiagnosticsNotice({
      variant: 'success',
      title: 'Diagnostics wiped',
      body: 'Local diagnostic logs were deleted from this device.',
    })
  }

  async function handleWipeAll() {
    await disconnectGmail()
    await wipeAllLocalData()
    setGmailConnected(false)
    setProfileDraft(emptyProfile)
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
    return openExternalUrl(url)
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

  async function handleManageSubscription() {
    setSubscriptionNotice(null)
    setSubscriptionBusy('manage')
    const result = await manageSubscriptionSettings()
    setSubscriptionBusy(null)
    setSubscriptionSnapshot(result.snapshot)

    if (result.status === 'error') {
      setSubscriptionNotice({
        variant: 'error',
        title: 'Subscription settings didn’t open',
        body: result.message,
      })
    }
  }

  function renderHome() {
    const gmailRow = gmailConnected
      ? SETTINGS_HOME_ROWS.gmailConnected
      : SETTINGS_HOME_ROWS.gmailDisconnected
    const subscriptionDescription = subscriptionSnapshot?.active
      ? 'Active on this device. Apple handles billing and renewals.'
      : SETTINGS_DESTINATIONS.subscription.description

    return (
      <section className="app-section-shell settings-home">
        <AppText intent="supporting">
          Adjust your opt-out email details, Gmail connection, privacy controls, and support tools.
        </AppText>
        {settingsNotice ? (
          <AppActionNotice
            variant="success"
            title={settingsNoticeCopy[settingsNotice].title}
          >
            {settingsNoticeCopy[settingsNotice].body}
          </AppActionNotice>
        ) : null}

        <AppList header="Your opt-out request">
          <AppListRow
            title={SETTINGS_DESTINATIONS.profile.title}
            description={SETTINGS_DESTINATIONS.profile.description}
            onClick={() => openView('profile')}
          />
          <AppListRow
            title={SETTINGS_HOME_ROWS.emailWording.title}
            description={SETTINGS_HOME_ROWS.emailWording.description}
            onClick={() => history.push(buildTemplateHref(settingsHomeHref))}
          />
          <AppListRow
            title={SETTINGS_HOME_ROWS.roundSize.title}
            description={SETTINGS_HOME_ROWS.roundSize.description}
            onClick={() => history.push(buildBatchSizeHref(settingsHomeHref))}
          />
        </AppList>

        <AppList header="Gmail">
          <AppListRow
            title={gmailRow.title}
            description={gmailRow.description}
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
            title={SETTINGS_DESTINATIONS.support.title}
            description={SETTINGS_DESTINATIONS.support.description}
            onClick={() => openView('support')}
          />
          <AppListRow
            title={SETTINGS_DESTINATIONS.diagnostics.title}
            description={SETTINGS_DESTINATIONS.diagnostics.description}
            onClick={() => openView('diagnostics')}
          />
        </AppList>

        <AppList header="Subscription">
          <AppListRow
            title={SETTINGS_DESTINATIONS.subscription.title}
            description={subscriptionDescription}
            onClick={() => openView('subscription')}
          />
        </AppList>

        <AppList header="Privacy & local data">
          <AppListRow
            title={SETTINGS_DESTINATIONS.privacy.title}
            description={SETTINGS_DESTINATIONS.privacy.description}
            onClick={() => openView('privacy')}
          />
        </AppList>
      </section>
    )
  }

  function renderSubscription() {
    return (
      <section className="app-section-shell">
        <AppList header="Status">
          <AppListRow
            title="Subscription access"
            description={
              subscriptionSnapshot?.active
                ? 'Active on this device.'
                : 'Not active on this device.'
            }
            right={
              <span aria-hidden="true">
                <AppText intent="caption">
                  {subscriptionSnapshot?.active ? 'Active' : 'Inactive'}
                </AppText>
              </span>
            }
            emphasis={false}
          />
        </AppList>

        <AppSectionLabel>Included with your subscription</AppSectionLabel>

        <SubscriptionOfferCard
          product={subscriptionSnapshot?.product}
          loading={subscriptionSnapshot == null}
        />

        {subscriptionSnapshot?.loadError ? (
          <AppNotice variant="error" title="Subscription unavailable">
            {subscriptionSnapshot.loadError}
          </AppNotice>
        ) : null}

        {subscriptionNotice ? (
          <AppActionNotice variant={subscriptionNotice.variant} title={subscriptionNotice.title}>
            {subscriptionNotice.body}
          </AppActionNotice>
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
              disabled={subscriptionBusy !== null || !isSubscriptionPurchaseReady(subscriptionSnapshot)}
              accessibilityLabel={buildSubscriptionButtonAccessibilityLabel(subscriptionSnapshot)}
            >
              {subscribeButtonLabel ? `Subscribe — ${subscribeButtonLabel}` : 'Loading subscription'}
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
          {subscriptionSnapshot?.active ? (
            <AppButton
              variant="secondary"
              onClick={() => void handleManageSubscription()}
              loading={subscriptionBusy === 'manage'}
              disabled={subscriptionBusy !== null}
            >
              Manage Subscription
            </AppButton>
          ) : null}
        </div>

        <AppList header="Policies">
          <AppListRow
            title="Privacy Policy"
            accessibilityLabel="Open Privacy Policy"
            onClick={() => void openUrl(PRIVACY_POLICY_URL)}
          />
          <AppListRow
            title="Terms of Service"
            accessibilityLabel="Open Terms of Service"
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
        <AppForm className="app-section-shell app-section-shell--compact" onSubmit={handleSaveProfile}>
          <ProfileFields
            profile={profileDraft}
            errors={profileErrors}
            onChange={updateProfile}
            onBlurField={validateProfileField}
          />
          <AppButton onClick={handleSaveProfile}>
            {shouldContinueAfterProfileSave ? 'Save and continue' : 'Save profile'}
          </AppButton>
        </AppForm>
      </section>
    )
  }

  function renderPrivacy() {
    return (
      <section className="app-section-shell">
        <AppText intent="supporting">
          Your profile, Gmail connection, send queue, and diagnostics stay on this device.
        </AppText>
        <AppText intent="supporting">
          Deleting local data also removes your sent history. If you start again, Scrappy Kin will not know which brokers you already contacted.
        </AppText>
        {localDataDeleted ? (
          <AppActionNotice
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
          </AppActionNotice>
        ) : null}
        <AppList header="Local data controls">
          <AppListRow
            title="Delete all local data"
            description="Delete saved app data and sent history from this device."
            onClick={() => setShowDeleteAllAlert(true)}
            tone="danger"
          />
        </AppList>
        <IonAlert
          isOpen={showDeleteAllAlert}
          header="Confirm deletion"
          message="Delete your saved profile, Gmail connection, diagnostics, send queue, and sent history from this device. If you start again, Scrappy Kin will not know which brokers you already contacted."
          buttons={[
            {
              text: 'Cancel',
              role: 'cancel',
            },
            {
              text: 'Confirm',
              role: 'destructive',
              handler: () => {
                void handleWipeAll()
              },
            },
          ]}
          onDidDismiss={() => setShowDeleteAllAlert(false)}
        />
      </section>
    )
  }

  function renderDiagnostics() {
    return (
      <section className="app-section-shell">
        <AppText intent="supporting">
          Diagnostics stay on this device. If you turn them on, Scrappy Kin captures a small local troubleshooting log for 15 minutes. Even then, nothing is sent to us automatically. You must export it and email it to <a href={SUPPORT_EMAIL_URL}>{SUPPORT_EMAIL}</a>. The logs do not collect personally identifiable information.
        </AppText>

        <AppSectionLabel>Diagnostics</AppSectionLabel>

        <section className="app-section-shell app-section-shell--compact">
          <AppToggle
            label="Temporary diagnostics"
            checked={logOptIn}
            onChange={handleToggleLogs}
          />
        </section>

        {logOptIn && logOptInRemaining ? (
          <AppActionNotice variant="success" title="Temporary diagnostics enabled">
            <div className="diagnostics-capture-summary">
              <AppText intent="body">Capturing local logs for:</AppText>
              <div className="diagnostics-capture-list">
                {DIAGNOSTIC_CAPTURE_DESCRIPTIONS.map((description) => (
                  <AppBulletRow key={description} label={description} />
                ))}
              </div>
              <AppText intent="body">
                {logOptInRemaining}. Diagnostics turn off automatically.
              </AppText>
            </div>
          </AppActionNotice>
        ) : null}

        {diagnosticsNotice ? (
          <AppActionNotice variant={diagnosticsNotice.variant} title={diagnosticsNotice.title}>
            {diagnosticsNotice.body}
          </AppActionNotice>
        ) : null}

        <AppList>
          <AppListRow title="Export diagnostics (plain text)" onClick={handleExportLogs} />
          <AppListRow title="Download diagnostics file" onClick={handleDownloadLogs} />
          <AppListRow title="Wipe diagnostics" onClick={handleWipeLogs} tone="danger" />
        </AppList>

        <AppList header="Version">
          <AppListRow title="Version ID" right={<AppText intent="caption">{BUILD_SHA}</AppText>} />
          <AppListRow
            title="Created"
            right={<AppText intent="caption">{versionCreatedAt}</AppText>}
          />
          <AppListRow
            title="App lane"
            right={<AppText intent="caption">{appLaneLabel}</AppText>}
          />
        </AppList>

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
            accessibilityLabel={`Contact ${SUPPORT_EMAIL} for help`}
            right={<AppText intent="caption">{SUPPORT_EMAIL}</AppText>}
            onClick={openSupportEmail}
          />
          <AppListRow
            title="Help"
            accessibilityLabel="Open Help"
            onClick={() => void openUrl(SUPPORT_HELP_URL)}
          />
          <AppListRow
            title="How Scrappy Kin uses Gmail permission"
            accessibilityLabel="Open Gmail permission help"
            onClick={() => void openUrl(GMAIL_PERMISSION_HELP_URL)}
          />
        </AppList>

        <AppList header="Policies">
          <AppListRow
            title="Privacy Policy"
            accessibilityLabel="Open Privacy Policy"
            onClick={() => void openUrl(PRIVACY_POLICY_URL)}
          />
          <AppListRow
            title="Terms of Service"
            accessibilityLabel="Open Terms of Service"
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
    profile: { title: SETTINGS_DESTINATIONS.profile.screenTitle, body: renderProfile() },
    subscription: { title: SETTINGS_DESTINATIONS.subscription.screenTitle, body: renderSubscription() },
    privacy: { title: SETTINGS_DESTINATIONS.privacy.screenTitle, body: renderPrivacy() },
    diagnostics: { title: SETTINGS_DESTINATIONS.diagnostics.screenTitle, body: renderDiagnostics() },
    support: { title: SETTINGS_DESTINATIONS.support.screenTitle, body: renderSupport() },
  }

  const screen = viewMap[view as SettingsContentView]

  return (
    <IonPage>
      <IonContent ref={contentRef} className="page-content">
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
