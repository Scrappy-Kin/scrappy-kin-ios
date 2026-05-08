import { IonContent, IonPage, useIonViewWillEnter } from '@ionic/react'
import { useMemo, useRef, useState } from 'react'
import { useHistory, useLocation } from 'react-router-dom'
import { buildSettingsHref, getCurrentRoute, readReturnTo } from '../services/navigation'
import {
  getDefaultDeletionTemplate,
  getDeletionTemplateDraft,
  resolveDeletionTemplate,
  saveDeletionTemplateDraft,
  type DeletionTemplateDraft,
} from '../services/templateStore'
import { getActiveUserProfile, type UserProfile } from '../services/userProfile'
import AppButton from '../ui/primitives/AppButton'
import AppHeading from '../ui/primitives/AppHeading'
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

function getTextareaRows(value: string, minRows: number, maxRows: number) {
  const estimatedRows = value.split('\n').reduce((total, line) => {
    return total + Math.max(1, Math.ceil(line.length / 42))
  }, 0)
  return Math.min(maxRows, Math.max(minRows, estimatedRows))
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
  const [saveMessage, setSaveMessage] = useState('')

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
    setSaveMessage('')
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
      history.replace(fallbackHref)
      return
    }
    setSaveMessage('Saved locally.')
  }

  function restoreDefaults() {
    setSaveMessage('')
    setIntro(defaults.intro)
    setRequestBlock(defaults.requestBlock)
    setSignOff(defaults.signOff)
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
          {saveMessage ? <AppText intent="supporting">{saveMessage}</AppText> : null}
          {hasCustomWording ? (
            <AppText intent="supporting">Custom wording is active.</AppText>
          ) : null}

          <div className="template-editor__block">
            <AppTextarea
              label="Opening paragraph"
              value={intro}
              onChange={(value) => {
                setSaveMessage('')
                setIntro(value)
              }}
              rows={getTextareaRows(intro, 3, 7)}
            />
          </div>

          <div className="template-editor__block">
            <AppTextarea
              label="What I’m Requesting"
              value={requestBlock}
              onChange={(value) => {
                setSaveMessage('')
                setRequestBlock(value)
              }}
              rows={getTextareaRows(requestBlock, 8, 16)}
            />
          </div>

          <div className="template-editor__block">
            <AppTextarea
              label="Sign-off"
              value={signOff}
              onChange={(value) => {
                setSaveMessage('')
                setSignOff(value)
              }}
              rows={getTextareaRows(signOff, 2, 4)}
            />
          </div>

          <AppButton
            variant="secondary"
            onClick={restoreDefaults}
            disabled={!canRestoreDefaults}
          >
            Restore default wording
          </AppButton>
          <AppButton onClick={handleSave}>Save wording</AppButton>
        </section>
      </IonContent>
    </IonPage>
  )
}
