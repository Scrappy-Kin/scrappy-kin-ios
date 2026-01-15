export const BUILD_SHA = typeof __BUILD_SHA__ === 'string' ? __BUILD_SHA__ : 'unknown'
export const BUILD_TIME = typeof __BUILD_TIME__ === 'string' ? __BUILD_TIME__ : 'unknown'
export const BUILD_MODE = typeof __BUILD_MODE__ === 'string' ? __BUILD_MODE__ : 'unknown'
export const IS_DEV_BUILD = BUILD_MODE !== 'production'
