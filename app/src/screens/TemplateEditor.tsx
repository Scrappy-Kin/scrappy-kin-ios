import { IonContent, IonPage, useIonViewWillEnter } from '@ionic/react'
import { useMemo, useState } from 'react'
import { useHistory, useLocation } from 'react-router-dom'
import { buildSettingsHref, readReturnTo } from '../services/navigation'
import { getTaskEditBehavior } from '../services/taskRoutes'
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
  const returnTo = readReturnTo(location.search)
  const fallbackHref = returnTo ?? buildSettingsHref()
  const [profile, setProfile] = useState<UserProfile>(emptyProfile)
  const [draft, setDraft] = useState<DeletionTemplateDraft | null>(null)
  const [intro, setIntro] = useState('')
  const [requestBlock, setRequestBlock] = useState('')
  const [signOff, setSignOff] = useState('')
  const [saveMessage, setSaveMessage] = useState('')
  const editBehavior = getTaskEditBehavior('edit_template_for_batch')

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

  function restoreBlock(block: 'intro' | 'requestBlock' | 'signOff') {
    setSaveMessage('')
    if (block === 'intro') {
      setIntro(defaults.intro)
      return
    }
    if (block === 'requestBlock') {
      setRequestBlock(defaults.requestBlock)
      return
    }
    setSignOff(defaults.signOff)
  }

  const hasCustomWording = Boolean(draft?.intro || draft?.requestBlock || draft?.signOff)

  return (
    <IonPage>
      <IonContent className="page-content">
        <section className="app-screen-shell template-editor">
          <AppTopNav backHref={fallbackHref} />
          <AppHeading intent="section">Edit email wording</AppHeading>
          {saveMessage ? <AppText intent="supporting">{saveMessage}</AppText> : null}
          {hasCustomWording ? (
            <AppText intent="supporting">Custom wording is active.</AppText>
          ) : null}
          {returnTo && editBehavior === 'explicit_save' ? (
            <AppText intent="supporting">
              Save wording to return to your batch review.
            </AppText>
          ) : null}

          <div className="template-editor__block">
            <div className="template-editor__header">
              <AppHeading intent="section">Opening</AppHeading>
              <AppButton variant="secondary" size="xs" onClick={() => restoreBlock('intro')}>
                Restore default wording
              </AppButton>
            </div>
            <AppTextarea
              label="Opening paragraph"
              value={intro}
              onChange={(value) => {
                setSaveMessage('')
                setIntro(value)
              }}
              rows={5}
              helpText="Plain text only."
            />
          </div>

          <div className="template-editor__block">
            <div className="template-editor__header">
              <AppHeading intent="section">Request wording</AppHeading>
              <AppButton
                variant="secondary"
                size="xs"
                onClick={() => restoreBlock('requestBlock')}
              >
                Restore default wording
              </AppButton>
            </div>
            <AppTextarea
              label="Everything below “What I’m requesting”"
              value={requestBlock}
              onChange={(value) => {
                setSaveMessage('')
                setRequestBlock(value)
              }}
              rows={12}
              helpText="Plain text only. Extra blank lines are collapsed when you save."
            />
          </div>

          <div className="template-editor__block">
            <div className="template-editor__header">
              <AppHeading intent="section">Sign-off</AppHeading>
              <AppButton variant="secondary" size="xs" onClick={() => restoreBlock('signOff')}>
                Restore default wording
              </AppButton>
            </div>
            <AppTextarea
              label="Closing name or signature"
              value={signOff}
              onChange={(value) => {
                setSaveMessage('')
                setSignOff(value)
              }}
              rows={3}
              helpText="Defaults to your saved name."
            />
          </div>

          <AppButton onClick={handleSave}>Save wording</AppButton>
        </section>
      </IonContent>
    </IonPage>
  )
}
