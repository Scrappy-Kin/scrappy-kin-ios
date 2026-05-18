import { App } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'

const DEV_APP_ID = 'com.scrappykin.ios.dev'
const EXECUTION_LANES = ['dev', 'production', 'qa-storekit'] as const
const NATIVE_INFO_TIMEOUT_MS = 1500

export type ExecutionLane = typeof EXECUTION_LANES[number]

export const BUILD_SHA = typeof __BUILD_SHA__ === 'string' ? __BUILD_SHA__ : 'unknown'
export const BUILD_TIME = typeof __BUILD_TIME__ === 'string' ? __BUILD_TIME__ : 'unknown'
export const BUILD_MODE = typeof __BUILD_MODE__ === 'string' ? __BUILD_MODE__ : 'unknown'
// Web-only fallback for browser preview/runtime checks. Native prod/dev authority comes from App.getInfo().
export const IS_DEV_BUILD = BUILD_MODE !== 'production'

export function getExecutionLane(): ExecutionLane {
  const configuredLane = import.meta.env.VITE_EXECUTION_LANE
  if (EXECUTION_LANES.includes(configuredLane as ExecutionLane)) {
    return configuredLane as ExecutionLane
  }

  return IS_DEV_BUILD ? 'dev' : 'production'
}

export function isQaStoreKitLane() {
  return getExecutionLane() === 'qa-storekit'
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      reject(new Error('Native app info timed out.'))
    }, timeoutMs)

    promise
      .then(resolve, reject)
      .finally(() => window.clearTimeout(timeout))
  })
}

export async function isDevAppLane() {
  if (!Capacitor.isNativePlatform()) {
    return getExecutionLane() === 'dev'
  }

  try {
    const { id } = await withTimeout(App.getInfo(), NATIVE_INFO_TIMEOUT_MS)
    return id === DEV_APP_ID
  } catch {
    return false
  }
}

export async function isVerboseDevLane() {
  return isDevAppLane()
}
