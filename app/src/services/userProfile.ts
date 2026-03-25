import { getEncrypted, setEncrypted } from './secureStore'

export type UserProfile = {
  fullName: string
  email: string
  city: string
  state: string
  partialZip: string
}

const PROFILE_KEY = 'user_profile'

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
