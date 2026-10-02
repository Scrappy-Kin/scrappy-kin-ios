import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const PROD_GOOGLE_CLIENT_ID = '304151210577-2hvg4113nd77cn8om3kppubqju7eu3sj.apps.googleusercontent.com'
const DEV_GOOGLE_CLIENT_ID = '914858229260-ns59pecm40udl9fi18ugrb1njlqie0m1.apps.googleusercontent.com'

// https://vite.dev/config/
function resolveGitSha() {
  try {
    const sha = execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim()
    return sha || 'unknown'
  } catch {
    return 'unknown'
  }
}

function createBootDiagnosticPlugin(enabled: boolean) {
  return {
    name: 'scrappy-boot-diagnostic',
    transformIndexHtml(html: string) {
      if (!enabled) {
        return html
      }

      const snippetPath = path.resolve('scripts/boot-diagnostic-snippet.html')
      const snippet = readFileSync(snippetPath, 'utf8').trim()
      return html.replace('</body>', `${snippet}\n  </body>`)
    },
  }
}

function resolveBootDiagnosticsEnabled(mode: string) {
  const enabled = process.env.SCRAPPY_BOOT_DIAGNOSTICS === '1'
  if (enabled && mode === 'production') {
    throw new Error('Boot diagnostics are dev-only and cannot be enabled for production builds.')
  }

  return enabled
}

function resolveGoogleClientId(mode: string) {
  const configured = process.env.VITE_GOOGLE_CLIENT_ID?.trim()
  if (configured) {
    if (mode === 'production' && configured !== PROD_GOOGLE_CLIENT_ID) {
      throw new Error('Production builds must use the production Google OAuth client ID.')
    }

    return configured
  }

  return mode === 'production' ? PROD_GOOGLE_CLIENT_ID : DEV_GOOGLE_CLIENT_ID
}

export default defineConfig(({ mode }) => {
  const bootDiagnosticsEnabled = resolveBootDiagnosticsEnabled(mode)
  const googleClientId = resolveGoogleClientId(mode)
  const base = process.env.SCRAPPY_WEB_HARNESS === '1' ? '/' : './'

  return {
    base,
    plugins: [
      react(),
      createBootDiagnosticPlugin(bootDiagnosticsEnabled),
    ],
    define: {
      'import.meta.env.VITE_GOOGLE_CLIENT_ID': JSON.stringify(googleClientId),
      __BUILD_SHA__: JSON.stringify(resolveGitSha()),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
      __BUILD_MODE__: JSON.stringify(mode),
      __BOOT_DIAGNOSTICS_ENABLED__: JSON.stringify(bootDiagnosticsEnabled),
    },
  }
})
