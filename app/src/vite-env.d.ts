/// <reference types="vite/client" />

declare const __BUILD_SHA__: string
declare const __BUILD_TIME__: string
declare const __BUILD_MODE__: string

interface ImportMetaEnv {
  readonly VITE_APPLE_SUBSCRIPTION_PRODUCT_ID?: string
  readonly VITE_EXECUTION_LANE?: string
}
