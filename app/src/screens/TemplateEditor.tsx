import { IonContent, IonPage, useIonViewWillEnter } from '@ionic/react'
import { useMemo, useRef, useState } from 'react'
import { useHistory, useLocation } from 'react-router-dom'
import {
  buildSettingsHref,
  getCurrentRoute,
  readReturnTo,
  withSettingsNotice,
} from '../services/navigation'
import {
  getDefaultDeletionTemplate,
  getDeletionTemplateDraft,
  resolveDeletionTemplate,
  saveDeletionTemplateDraft,
  type DeletionTemplateDraft,
} from '../services/templateStore'
import { getActiveUserProfile, type UserProfile } from '../services/userProfile'
import AppButton from '../ui/primitives/AppButton'
import AppActionNotice from '../ui/primitives/AppActionNotice'
import AppForm from '../ui/primitives/AppForm'
import AppHeading from '../ui/primitives/AppHeading'
import AppNotice from '../ui/primitives/AppNotice'
import AppText from '../ui/primitives/AppText'
import AppTextarea from '../ui/primitives/AppTextarea'
import AppTopNav from '../ui/patterns/AppTopNav'
import { useRouteFocus } from '../ui/patterns/useRouteFocus'
import './template-editor.css'

const emptyProfile: UserProfile = {
  fullName: '',
  email: '',
  city: '',
  state: '',
  partialZip: '',
}

export default function TemplateEditor() {
  const history = useHistory()
  const location = useLocation()
  const currentRoute = getCurrentRoute(location)
  const returnTo = readReturnTo(location.search)
  const fallbackHref = returnTo ?? buildSettingsHref()
  const headingRef = useRef<HTMLHeadingElement | null>(null)
  const [profile, setProfile] = useState<UserProfile>(emptyProfile)
  const [draft, setDraft] = useState<DeletionTemplateDraft | null>(null)
  const [intro, setIntro] = useState('')
  const [requestBlock, setRequestBlock] = useState('')
  const [signOff, setSignOff] = useState('')
  const [statusNotice, setStatusNotice] = useState<{
    kind: 'saved' | 'restored'
    variant: 'info' | 'success'
    title: string
    body: string
  } | null>(null)

  const defaults = useMemo(() => getDefaultDeletionTemplate(profile), [profile])

  async function refreshState() {
    const nextProfile = (await getActiveUserProfile()) ?? emptyProfile
    const nextDraft = await getDeletionTemplateDraft()
    const resolved = resolveDeletionTemplate(nextProfile, nextDraft)
    setProfile(nextProfile)
    setDraft(nextDraft)
    setIntro(resolved.intro)
    setRequestBlock(resolved.requestBlock)
    setSignOff(resolved.signOff)
    setStatusNotice(null)
  }

  useIonViewWillEnter(() => {
    void refreshState()
  })

  useRouteFocus(currentRoute, true, headingRef)

  async function handleSave() {
    await saveDeletionTemplateDraft(profile, {
      intro,
      requestBlock,
      signOff,
    })
    const nextDraft = await getDeletionTemplateDraft()
    setDraft(nextDraft)
    if (returnTo) {
      history.replace(withSettingsNotice(fallbackHref, 'wording-saved'))
      return
    }
    setStatusNotice({
      kind: 'saved',
      variant: 'success',
      title: 'Wording saved',
      body: 'This wording is saved on this device.',
    })
  }

  function restoreDefaults() {
    setIntro(defaults.intro)
    setRequestBlock(defaults.requestBlock)
    setSignOff(defaults.signOff)
    setStatusNotice({
      kind: 'restored',
      variant: 'info',
      title: 'Default wording restored',
      body: 'Save wording to keep it.',
    })
  }

  const hasCustomWording = Boolean(draft?.intro || draft?.requestBlock || draft?.signOff)
  const canRestoreDefaults =
    intro !== defaults.intro ||
    requestBlock !== defaults.requestBlock ||
    signOff !== defaults.signOff

  return (
    <IonPage>
      <IonContent className="page-content">
        <section className="app-screen-shell template-editor">
          <AppTopNav backHref={fallbackHref} />
          <AppHeading intent="section" level={1} ref={headingRef} tabIndex={-1}>
            Edit email wording
          </AppHeading>
          {statusNotice ? (
            statusNotice.kind === 'saved' ? (
              <AppActionNotice variant={statusNotice.variant} title={statusNotice.title}>
                {statusNotice.body}
              </AppActionNotice>
            ) : (
              <AppNotice
                variant={statusNotice.variant}
                title={statusNotice.title}
                live={false}
              >
                {statusNotice.body}
              </AppNotice>
            )
          ) : null}
          {hasCustomWording && !statusNotice ? (
            <AppText intent="supporting">Custom wording is active.</AppText>
          ) : null}

          <AppForm className="template-editor__form">
            <div className="template-editor__block">
              <AppTextarea
                label="Opening paragraph"
                fieldId="templateOpening"
                value={intro}
                onChange={(value) => {
                  setStatusNotice(null)
                  setIntro(value)
                }}
                rows={3}
                enterKeyHint="next"
              />
            </div>

            <div className="template-editor__block">
              <AppTextarea
                label="What I’m Requesting"
                fieldId="templateRequest"
                value={requestBlock}
                onChange={(value) => {
                  setStatusNotice(null)
                  setRequestBlock(value)
                }}
                rows={5}
                enterKeyHint="next"
              />
            </div>

            <div className="template-editor__block">
              <AppTextarea
                label="Sign-off"
                fieldId="templateSignOff"
                value={signOff}
                onChange={(value) => {
                  setStatusNotice(null)
                  setSignOff(value)
                }}
                rows={2}
                enterKeyHint="done"
              />
            </div>

            <AppButton
              variant="secondary"
              onClick={restoreDefaults}
              disabled={!canRestoreDefaults}
            >
              {statusNotice?.kind === 'restored' && !canRestoreDefaults
                ? 'Default wording restored'
                : 'Restore default wording'}
            </AppButton>
            <AppButton onClick={handleSave}>Save wording</AppButton>
          </AppForm>
        </section>
      </IonContent>
    </IonPage>
  )
}
