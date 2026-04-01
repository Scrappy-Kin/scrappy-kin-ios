import { App } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'

const PROD_CLIENT_ID = '304151210577-2hvg4113nd77cn8om3kppubqju7eu3sj.apps.googleusercontent.com'
const DEV_CLIENT_ID = '914858229260-ns59pecm40udl9fi18ugrb1njlqie0m1.apps.googleusercontent.com'
const PROD_APP_ID = 'com.scrappykin.ios'
const DEV_APP_ID = 'com.scrappykin.ios.dev'

const WEB_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
const BUILD_MODE = import.meta.env.MODE
const IS_PROD_BUILD = BUILD_MODE === 'production'

if (!WEB_CLIENT_ID) {
  throw new Error('Missing VITE_GOOGLE_CLIENT_ID at build time.')
}

if (IS_PROD_BUILD && WEB_CLIENT_ID !== PROD_CLIENT_ID) {
  throw new Error('OAuth config mismatch: prod builds must use the production client ID.')
}

function toConfig(clientId: string) {
  const clientIdBase = clientId.replace('.apps.googleusercontent.com', '')
  const redirectScheme = `com.googleusercontent.apps.${clientIdBase}`

  return {
    clientId,
    redirectScheme,
    redirectUri: `${redirectScheme}:/oauthredirect`,
  }
}

export async function getGoogleOAuthConfig() {
  if (!Capacitor.isNativePlatform()) {
    return toConfig(WEB_CLIENT_ID)
  }

  const { id } = await App.getInfo()

  if (id === PROD_APP_ID) {
    return toConfig(PROD_CLIENT_ID)
  }

  if (id === DEV_APP_ID) {
    return toConfig(DEV_CLIENT_ID)
  }

  throw new Error(`Unsupported native app ID for OAuth: ${id}`)
}

export const PROD_GOOGLE_CLIENT_ID = PROD_CLIENT_ID
