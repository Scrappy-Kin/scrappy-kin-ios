import { App } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'

const DEV_APP_ID = 'com.scrappykin.ios.dev'

export const BUILD_SHA = typeof __BUILD_SHA__ === 'string' ? __BUILD_SHA__ : 'unknown'
export const BUILD_TIME = typeof __BUILD_TIME__ === 'string' ? __BUILD_TIME__ : 'unknown'
export const BUILD_MODE = typeof __BUILD_MODE__ === 'string' ? __BUILD_MODE__ : 'unknown'
export const IS_DEV_BUILD = BUILD_MODE !== 'production'

export async function isDevAppLane() {
  if (!Capacitor.isNativePlatform()) {
    return IS_DEV_BUILD
  }

  try {
    const { id } = await App.getInfo()
    return id === DEV_APP_ID
  } catch {
    return IS_DEV_BUILD
  }
}

export async function isVerboseDevLane() {
  return isDevAppLane()
}
