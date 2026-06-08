#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const appRoot = resolve(scriptDir, '..')
const projectPath = resolve(appRoot, 'ios/App/App.xcodeproj/project.pbxproj')

function usage() {
  console.error('Usage: npm run ios:version:set -- --build <positive-integer>')
}

const buildIndex = process.argv.indexOf('--build')
const buildValue = buildIndex >= 0 ? process.argv[buildIndex + 1] : ''

if (!/^[1-9]\d*$/.test(buildValue)) {
  usage()
  process.exit(2)
}

const project = readFileSync(projectPath, 'utf8')
const matches = project.match(/CURRENT_PROJECT_VERSION = [^;]+;/g) ?? []
if (matches.length === 0) {
  console.error(`No CURRENT_PROJECT_VERSION entries found in ${projectPath}`)
  process.exit(1)
}

const updated = project.replace(/CURRENT_PROJECT_VERSION = [^;]+;/g, `CURRENT_PROJECT_VERSION = ${buildValue};`)
writeFileSync(projectPath, updated)

console.log(`Set ${matches.length} Xcode build number entries to ${buildValue}.`)
