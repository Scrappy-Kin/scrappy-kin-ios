import { execFile, execSync } from 'node:child_process'
import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

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

function createLocalRevealPlugin() {
  const allowedRoot = path.resolve(process.cwd())

  const handleReveal = (req: { url?: string }, res: { statusCode: number; setHeader: (name: string, value: string) => void; end: (body?: string) => void }, next: () => void) => {
    if (!req.url) {
      next()
      return
    }

    const requestUrl = new URL(req.url, 'http://localhost')
    if (requestUrl.pathname !== '/__local/reveal') {
      next()
      return
    }

    const requestedPath = requestUrl.searchParams.get('path')
    if (!requestedPath) {
      res.statusCode = 400
      res.setHeader('content-type', 'application/json')
      res.end(JSON.stringify({ error: 'Missing path' }))
      return
    }

    const resolvedPath = path.resolve(requestedPath)
    if (!resolvedPath.startsWith(allowedRoot)) {
      res.statusCode = 403
      res.setHeader('content-type', 'application/json')
      res.end(JSON.stringify({ error: 'Path not allowed' }))
      return
    }

    execFile('open', [resolvedPath], (error) => {
      res.setHeader('content-type', 'application/json')
      if (error) {
        res.statusCode = 500
        res.end(JSON.stringify({ error: 'Failed to reveal path' }))
        return
      }

      res.statusCode = 204
      res.end()
    })
  }

  return {
    name: 'local-reveal-plugin',
    configureServer(server: { middlewares: { use: (fn: typeof handleReveal) => void } }) {
      server.middlewares.use(handleReveal)
    },
    configurePreviewServer(server: { middlewares: { use: (fn: typeof handleReveal) => void } }) {
      server.middlewares.use(handleReveal)
    },
  }
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), createLocalRevealPlugin()],
  define: {
    __BUILD_SHA__: JSON.stringify(resolveGitSha()),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    __BUILD_MODE__: JSON.stringify(mode),
  },
}))
