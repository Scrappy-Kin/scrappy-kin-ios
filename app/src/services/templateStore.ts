import {
  buildDefaultDeletionRequestBlock,
  buildDeletionIntro,
  type DeletionTemplateContent,
} from './emailTemplate'
import { getEncrypted, removeEncrypted, setEncrypted } from './secureStore'
import type { UserProfile } from './userProfile'

export type DeletionTemplateDraft = {
  intro?: string | null
  requestBlock?: string | null
  signOff?: string | null
}

const TEMPLATE_KEY = 'deletion_template_draft'

function normalizePlainText(value: string) {
  return value
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function toOptionalOverride(value: string, defaultValue: string) {
  const normalized = normalizePlainText(value)
  if (!normalized || normalized === normalizePlainText(defaultValue)) {
    return null
  }
  return normalized
}

export function getDefaultDeletionTemplate(profile: UserProfile): DeletionTemplateContent {
  return {
    intro: buildDeletionIntro(),
    requestBlock: buildDefaultDeletionRequestBlock(),
    signOff: profile.fullName || '',
  }
}

export function resolveDeletionTemplate(
  profile: UserProfile,
  draft: DeletionTemplateDraft | null,
): DeletionTemplateContent {
  const defaults = getDefaultDeletionTemplate(profile)
  return {
    intro: draft?.intro ?? defaults.intro,
    requestBlock: draft?.requestBlock ?? defaults.requestBlock,
    signOff: draft?.signOff ?? defaults.signOff,
  }
}

export async function getDeletionTemplateDraft() {
  return (await getEncrypted<DeletionTemplateDraft>(TEMPLATE_KEY)) ?? null
}

export async function saveDeletionTemplateDraft(
  profile: UserProfile,
  content: DeletionTemplateContent,
) {
  const defaults = getDefaultDeletionTemplate(profile)
  const draft: DeletionTemplateDraft = {
    intro: toOptionalOverride(content.intro, defaults.intro),
    requestBlock: toOptionalOverride(content.requestBlock, defaults.requestBlock),
    signOff: toOptionalOverride(content.signOff, defaults.signOff),
  }

  if (!draft.intro && !draft.requestBlock && !draft.signOff) {
    await removeEncrypted(TEMPLATE_KEY)
    return
  }

  await setEncrypted(TEMPLATE_KEY, draft)
}

export { normalizePlainText }
