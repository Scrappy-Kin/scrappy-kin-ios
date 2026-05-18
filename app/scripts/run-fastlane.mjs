import { spawn } from 'node:child_process'
import { resolveRepoLocalToolEnv } from './xcode-runtime-paths.mjs'

const args = process.argv.slice(2)

if (args.length === 0) {
  console.error('Usage: node scripts/run-fastlane.mjs <fastlane args...>')
  process.exit(2)
}

const env = {
  ...process.env,
  ...(await resolveRepoLocalToolEnv()),
}

const child = spawn('fastlane', args, {
  env,
  stdio: 'inherit',
})

child.on('exit', (code, signal) => {
  if (signal) {
    console.error(`fastlane exited from signal ${signal}`)
    process.exit(1)
  }
  process.exit(code ?? 1)
})
