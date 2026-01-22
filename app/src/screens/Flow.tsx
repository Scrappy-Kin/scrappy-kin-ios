import { IonContent, IonPage, useIonViewWillEnter } from '@ionic/react'
import { useState } from 'react'
import { useHistory } from 'react-router-dom'
import { getSelectedBrokerIds, loadBrokers, type Broker } from '../services/brokerStore'
import { connectGmail, getGmailStatus } from '../services/googleAuth'
import { buildDeletionBody, buildDeletionSubject } from '../services/emailTemplate'
import { getUserProfile, setUserProfile, type UserProfile } from '../services/userProfile'
import auditManifest from '../assets/audit-manifest.json'
import AppButton from '../ui/primitives/AppButton'
import AppCard from '../ui/primitives/AppCard'
import AppHeading from '../ui/primitives/AppHeading'
import AppInput from '../ui/primitives/AppInput'
import AppList from '../ui/primitives/AppList'
import AppListRow from '../ui/primitives/AppListRow'
import AppSurface from '../ui/primitives/AppSurface'
import AppText from '../ui/primitives/AppText'
import AppToast from '../ui/primitives/AppToast'
import FlowStepHeader from '../ui/patterns/FlowStepHeader'
import InlineTrustClaim from '../ui/patterns/InlineTrustClaim'
import ReadMoreSheetLink from '../ui/patterns/ReadMoreSheetLink'
import AppIcon from '../ui/primitives/AppIcon'
import AppStickyAction from '../ui/primitives/AppStickyAction'
import { checkmarkCircle, closeCircle, copyOutline, openOutline } from 'ionicons/icons'

type AuditManifest = {
  repo: string
  sha: string
  prompt_text?: string
  audit_links?: {
    must?: { path: string; url: string }[]
    great?: { path: string; url: string }[]
    nice?: { path: string; url: string }[]
  }
  raw_urls: { path: string; url: string }[]
  coverage?: { note?: string }
}

const buildAuditPrompt = (manifest: AuditManifest) => {
  const tiers = [
    { key: 'must', label: 'Must see' },
    { key: 'great', label: 'Great to see' },
    { key: 'nice', label: 'Nice to see' },
  ] as const

  const tierLines = tiers
    .map(({ key, label }) => {
      const entries = manifest.audit_links?.[key]
      if (!entries?.length) return null
      return [label + ':', ...entries.map((entry) => `- ${entry.url}`)].join('\n')
    })
    .filter(Boolean)
    .join('\n\n')

  const keyFileLines = tierLines || manifest.raw_urls.map((entry) => `- ${entry.url}`).join('\n')
  const coverageNote = manifest.coverage?.note ? `\n\nScope: ${manifest.coverage.note}` : ''

  return [
    '# Scrappy Kin — Independent Consumer-Side Code Audit (AI Prompt)',
    '',
    'You are an **independent, user-side technical auditor**. Your job is to determine what this app can do with user data, using **only verifiable code evidence you can directly fetch**.',
    '',
    '## Quick navigation (for humans)',
    '- If you are not technical: **scroll to SECTION 6 (Plain-Language Summary + “Can it do this?” table)**.',
    '- The earlier sections are a **technical receipt** that makes the summary trustworthy.',
    '',
    '---',
    '',
    '## Rules (non-negotiable)',
    '1) **Evidence only.** Use only code you can fetch in this run. Do not use README/marketing text as evidence.',
    '2) **No guessing.** No “probably/likely/appears”. If not provable from fetched code, mark **Unknown**.',
    '3) **No invisible negatives.** You cannot claim “it does NOT do X” unless you can justify it via **explicit evidence** (e.g., missing scopes + no relevant API usage in audited files) and you must phrase it as:',
    '   - “No evidence of X in the code we audited” (not “impossible”).',
    '4) **Hard scope.** Audit ONLY:',
    '   - the repo tree **if you can browse it**, and',
    '   - the raw URLs listed below (authoritative file contents).',
    '   If tree browsing fails, treat the tree as **unavailable** and do not speculate about other files.',
    '5) **Every claim needs proof.** Any factual statement must cite:',
    '   - file path + function (or top-level const), and',
    '   - a direct code quote (≤2 lines).',
    '6) **Plain-language sections must be derived from the Evidence Ledger only.** No new facts.',
    '',
    '---',
    '',
    '## SECTION 0 — Access & Fetch Log (Required)',
    'State exactly what you could access:',
    '- Repo tree browsing: Success/Failure (and what you saw, if anything)',
    '- For each raw URL below: Success/Failure',
    '',
    'If any raw file fails to fetch, continue auditing the rest, but mark impacted areas **Unknown**.',
    '',
    '---',
    '',
    '## SECTION 1 — Evidence Ledger (Source of truth)',
    'Produce a numbered list of facts. Each item MUST include:',
    '- **Claim** (one sentence, factual)',
    '- **Location** (file path + function/const)',
    '- **Evidence** (≤2 lines quoted)',
    '',
    'No interpretation here.',
    '',
    '---',
    '',
    '## SECTION 2 — Access (What the app can access)',
    'Derived from ledger only. Cover:',
    '- Permissions/scopes (e.g., Gmail scope)',
    '- Device/platform capabilities used (if visible)',
    '- What user data fields are referenced for composing messages',
    '',
    'Each bullet must cite ledger item numbers.',
    '',
    '---',
    '',
    '## SECTION 3 — Storage (On-device)',
    'Derived from ledger only.',
    'List every storage mechanism + exact keys/prefixes/paths and what is stored.',
    'If encryption is used, name the algorithm ONLY if explicitly shown.',
    '',
    '---',
    '',
    '## SECTION 4 — Network Transmission Inventory (Table)',
    'Derived from ledger only.',
    'One row per network call (including wrapper + call sites if present):',
    '',
    '| File | Function | Destination host | Full URL | Method | Auth mechanism | Headers (keys only) | Body/query fields (keys only) | What user data is included | Proof (ledger #) |',
    '',
    'Rules:',
    '- If URL is constructed dynamically, show the base + how it’s constructed (ledger-backed).',
    '- If payload content can’t be determined, write **Unknown**.',
    '',
    '---',
    '',
    '## SECTION 5 — Gmail Authorization (only if present)',
    'Derived from ledger only. Explain in plain language later, but here capture facts:',
    '- OAuth flow (as implemented)',
    '- Scopes',
    '- Token storage/refresh/revoke',
    '- Redirect handling',
    '',
    'Ledger-backed.',
    '',
    '---',
    '',
    '## SECTION 6 — Plain-Language Summary (for non-technical humans)',
    'Use very plain words. Avoid jargon like “OAuth”, “PKCE”, “Bearer token”. If unavoidable, explain in one short parenthetical.',
    '',
    '### 6.1 TL;DR (8 bullets max)',
    'Write as “This app CAN…” / “This app DOESN’T appear to…” / “Unknown because we couldn’t see…”',
    'Every bullet must reference ledger item numbers in brackets like [L3, L7].',
    '',
    '### 6.2 “Can it do this?” table (keep it simple)',
    '| Question | Answer (✅ Yes / ❌ No evidence / ⚠️ Unknown) | What it means (one sentence) | Proof |',
    'Include at least these questions:',
    '- Can it read my emails?',
    '- Can it send emails for me?',
    '- Can it upload my data to Scrappy Kin servers?',
    '- Can it share data with third parties (analytics/crash tools)?',
    '- Can it track me across apps/websites?',
    '- Can it store my personal info on my phone?',
    '- Can it store my Gmail permission tokens on my phone?',
    '',
    '**Important phrasing rule for negatives:** prefer “❌ No evidence in audited code” over absolute “No”.',
    '',
    '### 6.3 Two examples of good plain language (follow this style)',
    '- ✅ Good: “It can send emails for you, because it calls Gmail’s ‘send message’ address.”',
    '- ❌ Bad: “It uses OAuth2 with PKCE and a Bearer token to access the Gmail API.”',
    '',
    '---',
    '',
    '## SECTION 7 — Gaps, limits, and confidence (non-scary)',
    'Write:',
    '- What you audited (tree? which raw files?)',
    '- What you could NOT access',
    '- What that means in plain language: “We can’t rule out X elsewhere because we did not see the full code.”',
    '- If repo tree browsing succeeded: briefly explain whether the provided raw links seem to cover the major risk surfaces (auth, networking, storage, logging), WITHOUT claiming full coverage.',
    '',
    '---',
    '',
    '## Audit target',
    `Repository: ${manifest.repo}`,
    `Pinned commit (SHA): ${manifest.sha}`,
    '',
    '### Raw files to audit (authoritative)',
    keyFileLines,
    coverageNote.trim().length ? coverageNote.trimStart() : '',
  ]
    .filter((line) => line !== '')
    .join('\n')
}

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
  showNext?: boolean
}

export default function Flow() {
  const history = useHistory()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [gmailConnected, setGmailConnected] = useState(false)
  const [profileDraft, setProfileDraft] = useState<UserProfile>(emptyProfile)
  const [profileSaved, setProfileSaved] = useState(false)
  const [brokersCount, setBrokersCount] = useState(0)
  const [selectedCount, setSelectedCount] = useState(0)
  const [previewBroker, setPreviewBroker] = useState<Broker | null>(null)
  const [toastOpen, setToastOpen] = useState(false)
  const auditPromptText =
    (auditManifest as AuditManifest).prompt_text ?? buildAuditPrompt(auditManifest as AuditManifest)

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
    setPreviewBroker(brokers[0] ?? null)
    const ids = await getSelectedBrokerIds()
    setSelectedCount(ids.length)
  }

  useIonViewWillEnter(() => {
    refreshState()
  })

  function renderStepContext(summary: string, sheetTitle?: string, sheetBody?: JSX.Element) {
    return (
      <div className="flow-context">
        <AppText intent="supporting">{summary}</AppText>
        {sheetTitle && sheetBody ? (
          <ReadMoreSheetLink label="Why this matters" sheetTitle={sheetTitle} sheetBody={sheetBody} />
        ) : null}
      </div>
    )
  }

  const steps: Step[] = [
    {
      id: 'welcome',
      title: 'Your data, your choice.',
      render: () => (
        <div className="flow-stack">
          <AppText intent="body" emphasis>
            Your personal information shouldn&apos;t be public knowledge. Brokers never asked for your permission. Take your data back.
          </AppText>
          <InlineTrustClaim
            claim="We keep the broker list small and verified."
            details={
              <AppText intent="supporting">
                We focus on brokers that matter most and confirm the email path works.
              </AppText>
            }
            linkLabel="How we pick brokers"
          />
          <InlineTrustClaim
            claim="Your data stays on your device or in Gmail."
            details={
              <AppText intent="supporting">
                No PII touches our servers. You can inspect every email before sending.
              </AppText>
            }
            linkLabel="Privacy stance"
          />
        </div>
      ),
      canContinue: true,
    },
    {
      id: 'email-preview',
      title: 'Review the opt-out email template',
      render: () => (
        <div className="flow-stack">
          <AppText intent="body" emphasis>
            Short and sweet but packs all the legal backing you need to exercise your rights.
          </AppText>
          <AppCard>
            <div className="flow-template">
              <AppText intent="body">
                {`Subject: ${buildDeletionSubject()}\n\n${buildDeletionBody(
                  previewBroker ?? { id: 'preview', name: 'Broker', contactEmail: '' },
                  profileDraft,
                )}`}
              </AppText>
            </div>
          </AppCard>
        </div>
      ),
      canContinue: true,
    },
    {
      id: 'gmail-login',
      title: 'Connect your Gmail account',
      render: () => (
        <div className="flow-stack">
          <AppText intent="body" emphasis>
            We use Gmail only to send opt‑out requests that you approve.
          </AppText>
          <AppText intent="body">
            Next, you&apos;ll see Google&apos;s consent screen.
          </AppText>
          <AppText intent="label">This access will</AppText>
          <AppList>
            <AppListRow
              title="Allow us to send opt‑out emails from your Gmail account"
              left={<AppIcon icon={checkmarkCircle} size="sm" tone="primary" ariaLabel="Allowed" />}
              emphasis={false}
            />
            <AppListRow
              title="Allow us to keep a copy in Sent for your records"
              left={<AppIcon icon={checkmarkCircle} size="sm" tone="primary" ariaLabel="Allowed" />}
              emphasis={false}
            />
            <AppListRow
              title={
                <>
                  <strong>Not</strong> allow us to read, edit, delete, or export emails from your account
                </>
              }
              left={<AppIcon icon={closeCircle} size="sm" tone="danger" ariaLabel="Not allowed" />}
              emphasis={false}
            />
          </AppList>
          <AppText intent="supporting">
            You can revoke access any time in Settings or on{' '}
            <a
              className="app-link app-link--external"
              href="https://myaccount.google.com/permissions"
              target="_blank"
              rel="noreferrer"
            >
              Google’s permissions page
              <span className="app-link__icon">
                <AppIcon icon={openOutline} size="sm" tone="primary" ariaLabel="External link" />
              </span>
            </a>
            .
          </AppText>
          <InlineTrustClaim
            linkLabel="All our code is public"
            claim="See how to audit it yourself"
            details={
              <div className="flow-stack">
                <AppText intent="body">
                  View our open source code:{' '}
                  <br />
                  <a
                    className="app-link app-link--external"
                    href="https://github.com/Scrappy-Kin/scrappy-kin-ios"
                    target="_blank"
                    rel="noreferrer"
                  >
                    github.com/Scrappy-Kin/scrappy-kin-ios
                    <span className="app-link__icon">
                      <AppIcon icon={openOutline} size="sm" tone="primary" ariaLabel="External link" />
                    </span>
                  </a>
                </AppText>
                <AppText intent="body">
                  <strong>Or, use AI to audit this app&apos;s code</strong>
                </AppText>
                <AppText intent="body">
                  Use an AI (like{' '}
                  <a
                    className="app-link app-link--external"
                    href="https://chat.openai.com/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    ChatGPT
                    <span className="app-link__icon">
                      <AppIcon icon={openOutline} size="sm" tone="primary" ariaLabel="External link" />
                    </span>
                  </a>
                  ) to audit this code and translate that audit into non-technical language for you.
                </AppText>
                <AppSurface padding="compact">
                  <div className="flow-prompt">
                    <AppStickyAction>
                      <AppButton
                        size="xs"
                        variant="secondary"
                        onClick={handleCopyAuditPrompt}
                        iconStart={<AppIcon icon={copyOutline} size="sm" ariaLabel="Copy" />}
                      >
                        Copy prompt
                      </AppButton>
                    </AppStickyAction>
                    <div className="flow-prompt__body">
                      <AppText intent="body">{auditPromptText}</AppText>
                    </div>
                  </div>
                </AppSurface>
              </div>
            }
          />
          <AppButton onClick={handleConnectGmail}>Connect your Gmail account</AppButton>
          <AppText intent="supporting">
            {gmailConnected ? 'Connected.' : 'Not connected yet.'}
          </AppText>
        </div>
      ),
      canContinue: gmailConnected,
      showNext: gmailConnected,
    },
    {
      id: 'gmail-auth',
      title: 'Gmail permissions',
      render: () => (
        <AppCard>
          {renderStepContext(
            'You approve exactly what the app can do.',
            'What permissions are requested?',
            <AppText intent="body">Send‑only access. No inbox access, no reading messages.</AppText>,
          )}
          <AppText intent="body">Google will ask for permission to send email on your behalf.</AppText>
          <AppText intent="supporting">We only request send-only access. No inbox access.</AppText>
          {!gmailConnected && (
            <AppButton variant="secondary" onClick={handleConnectGmail}>
              Re-open Google approval
            </AppButton>
          )}
          <AppText intent="supporting">
            {gmailConnected ? 'Connected.' : 'Not connected yet.'}
          </AppText>
        </AppCard>
      ),
      canContinue: gmailConnected,
    },
    {
      id: 'profile',
      title: 'Your info',
      render: () => (
        <AppCard>
          {renderStepContext(
            'Brokers need a minimum set of details to locate you.',
            'Why this info?',
            <AppText intent="body">
              We only ask for the fields that appear in broker lookup forms.
            </AppText>,
          )}
          <AppText intent="body">This is the minimum info brokers require.</AppText>
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
          <AppButton onClick={handleSaveProfile}>Save</AppButton>
        </AppCard>
      ),
      canContinue: profileSaved && isProfileValid(profileDraft),
    },
    {
      id: 'brokers',
      title: 'Pick brokers',
      render: () => (
        <AppCard>
          {renderStepContext(
            'Start with a single broker to test the waters.',
            'How do we choose brokers?',
            <AppText intent="body">
              We surface the highest‑impact brokers first so you can build momentum.
            </AppText>,
          )}
          <AppSurface padding="compact">
            <AppText intent="label">Suggested first broker</AppText>
            <div className="flow-metrics">
              <AppText intent="supporting">🔍 Search visibility: 78/100</AppText>
              <AppText intent="supporting">📄 Indexed pages: ~124,000</AppText>
            </div>
          </AppSurface>
          <AppText intent="body">{brokersCount} brokers available.</AppText>
          <AppText intent="supporting">
            {selectedCount > 0 ? `${selectedCount} selected.` : 'None selected yet.'}
          </AppText>
          <AppButton variant="secondary" onClick={() => history.push('/brokers')}>
            Open broker list
          </AppButton>
        </AppCard>
      ),
      canContinue: true,
    },
    {
      id: 'ready',
      title: 'Test the waters',
      render: () => (
        <AppCard>
          {renderStepContext(
            'Send a single email first, then expand to the full list.',
            'Why start small?',
            <AppText intent="body">
              A small win builds trust and confirms everything works before you scale up.
            </AppText>,
          )}
          <AppText intent="body">Great — you’re ready to start emailing brokers.</AppText>
          <AppButton onClick={() => history.push('/home')}>Send now</AppButton>
        </AppCard>
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

  async function handleCopyAuditPrompt() {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(auditPromptText)
        setToastOpen(true)
        return
      }
    } catch {
      // fall through to legacy path
    }
    const textarea = document.createElement('textarea')
    textarea.value = auditPromptText
    textarea.setAttribute('readonly', 'true')
    textarea.style.position = 'absolute'
    textarea.style.left = '-9999px'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    setToastOpen(true)
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
      <IonContent className="page-content">
        <div className="flow-stack">
          <FlowStepHeader
            current={currentIndex + 1}
            total={steps.length}
            label={`Step ${currentIndex + 1} of ${steps.length}`}
            onBack={currentIndex === 0 ? undefined : goBack}
            backDisabled={currentIndex === 0}
          />
          <AppHeading intent="section">{step.title}</AppHeading>
          {step.render()}
          <div className="flow-actions">
            {step.showNext === false ? null : (
              <AppButton onClick={goNext} disabled={step.canContinue === false} fullWidth>
                Next
              </AppButton>
            )}
          </div>
        </div>
        <AppToast
          open={toastOpen}
          onDismiss={() => setToastOpen(false)}
          variant="success"
          message="Prompt copied."
        />
      </IonContent>
    </IonPage>
  )
}
