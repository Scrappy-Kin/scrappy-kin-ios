import { getEncrypted, removeEncrypted, setEncrypted } from './secureStore'

export type UserProfile = {
  fullName: string
  email: string
  city: string
  state: string
  partialZip: string
}

export type UserProfileField = keyof UserProfile

export const REQUIRED_USER_PROFILE_FIELDS: UserProfileField[] = ['fullName', 'email', 'city']

export type UserProfileErrors = Partial<Record<UserProfileField, string>>

const PROFILE_KEY = 'user_profile'
const PROFILE_DRAFT_KEY = 'user_profile_draft'

type LegacyUserProfile = {
  fullName?: string
  email?: string
  city?: string
  country?: string
  partialPostcode?: string
  state?: string
  partialZip?: string
}

function normalizeProfile(profile: LegacyUserProfile | null): UserProfile | null {
  if (!profile) return null
  return {
    fullName: profile.fullName ?? '',
    email: profile.email ?? '',
    city: profile.city ?? '',
    state: profile.state ?? profile.country ?? '',
    partialZip: profile.partialZip ?? profile.partialPostcode ?? '',
  }
}

export async function getUserProfile() {
  const stored = await getEncrypted<LegacyUserProfile>(PROFILE_KEY)
  return normalizeProfile(stored)
}

export async function setUserProfile(profile: UserProfile) {
  await setEncrypted(PROFILE_KEY, profile)
}

export async function getUserProfileDraft() {
  const stored = await getEncrypted<LegacyUserProfile>(PROFILE_DRAFT_KEY)
  return normalizeProfile(stored)
}

export async function setUserProfileDraft(profile: UserProfile) {
  await setEncrypted(PROFILE_DRAFT_KEY, profile)
}

export async function clearUserProfileDraft() {
  await removeEncrypted(PROFILE_DRAFT_KEY)
}

export async function getActiveUserProfile() {
  return (await getUserProfileDraft()) ?? (await getUserProfile())
}

export function isRequiredUserProfileField(field: UserProfileField) {
  return REQUIRED_USER_PROFILE_FIELDS.includes(field)
}

export function getUserProfileValidationErrors(profile: UserProfile): UserProfileErrors {
  const errors: UserProfileErrors = {}

  if (!profile.fullName.trim()) {
    errors.fullName = 'Enter your full name.'
  }

  if (!profile.email.trim()) {
    errors.email = 'Enter your email address.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email.trim())) {
    errors.email = 'Enter a valid email address.'
  }

  if (!profile.city.trim()) {
    errors.city = 'Enter your city.'
  }

  return errors
}
