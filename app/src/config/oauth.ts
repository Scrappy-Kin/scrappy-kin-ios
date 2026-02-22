const PROD_CLIENT_ID = '304151210577-2hvg4113nd77cn8om3kppubqju7eu3sj.apps.googleusercontent.com'

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
const BUILD_MODE = import.meta.env.MODE
const IS_PROD_BUILD = BUILD_MODE === 'production'

if (!CLIENT_ID) {
  throw new Error('Missing VITE_GOOGLE_CLIENT_ID at build time.')
}

if (IS_PROD_BUILD && CLIENT_ID !== PROD_CLIENT_ID) {
  throw new Error('OAuth config mismatch: prod builds must use the production client ID.')
}

const CLIENT_ID_BASE = CLIENT_ID.replace('.apps.googleusercontent.com', '')

export const GOOGLE_CLIENT_ID = CLIENT_ID
export const GOOGLE_REDIRECT_SCHEME = `com.googleusercontent.apps.${CLIENT_ID_BASE}`
export const GOOGLE_REDIRECT_URI = `${GOOGLE_REDIRECT_SCHEME}:/oauthredirect`
export const PROD_GOOGLE_CLIENT_ID = PROD_CLIENT_ID
