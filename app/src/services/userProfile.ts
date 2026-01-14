import { getEncrypted, setEncrypted } from './secureStore'

export type UserProfile = {
  fullName: string
  email: string
  city: string
  country: string
  partialPostcode: string
}

const PROFILE_KEY = 'user_profile'

export async function getUserProfile() {
  return await getEncrypted<UserProfile>(PROFILE_KEY)
}

export async function setUserProfile(profile: UserProfile) {
  await setEncrypted(PROFILE_KEY, profile)
}
