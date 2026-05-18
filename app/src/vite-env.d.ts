/// <reference types="vite/client" />

declare const __BUILD_SHA__: string
declare const __BUILD_TIME__: string
declare const __BUILD_MODE__: string
declare const __BOOT_DIAGNOSTICS_ENABLED__: boolean

interface ImportMetaEnv {
  readonly VITE_APPLE_SUBSCRIPTION_PRODUCT_ID?: string
  readonly VITE_EXECUTION_LANE?: string
}
