#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const repoRoot = path.resolve(__dirname, '..')
const schemaPath = path.join(repoRoot, 'app', 'src', 'services', 'logSchema.ts')
const sourceRoot = path.join(repoRoot, 'app', 'src')

function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8')
}

function listFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...listFiles(fullPath))
    } else if (entry.isFile()) {
      files.push(fullPath)
    }
  }
  return files
}

function getSchemaEvents(schemaText) {
  const events = new Set()
  const inSchema = schemaText.split('\n')
  for (const line of inSchema) {
    const match = line.match(/^  ([a-z0-9_]+):\s*\{/)
    if (match) {
      events.add(match[1])
    }
  }
  return events
}

function getLogEventCalls(files) {
  const events = new Set()
  const dynamicCalls = []

  for (const file of files) {
    if (file === schemaPath) continue
    if (file.endsWith('logStore.ts')) continue
    const text = readText(file)

    const dynamicMatch = text.match(/logEvent\(\s*[^'"`]/)
    if (dynamicMatch) {
      dynamicCalls.push(file)
    }

    const regex = /logEvent\(\s*(['"`])([^'"`]+)\1/g
    let match
    while ((match = regex.exec(text))) {
      events.add(match[2])
    }
  }

  return { events, dynamicCalls }
}

function main() {
  if (!fs.existsSync(schemaPath)) {
    console.error(`Missing log schema at ${schemaPath}`)
    process.exit(1)
  }

  const schemaText = readText(schemaPath)
  const schemaEvents = getSchemaEvents(schemaText)
  if (schemaEvents.size === 0) {
    console.error('No log events found in schema.')
    process.exit(1)
  }

  const files = listFiles(sourceRoot).filter((file) =>
    file.endsWith('.ts') || file.endsWith('.tsx'),
  )
  const { events, dynamicCalls } = getLogEventCalls(files)

  if (dynamicCalls.length > 0) {
    console.error('Dynamic logEvent calls found (must be string literals):')
    for (const file of dynamicCalls) {
      console.error(`- ${path.relative(repoRoot, file)}`)
    }
    process.exit(1)
  }

  const missing = [...events].filter((event) => !schemaEvents.has(event))
  if (missing.length > 0) {
    console.error('Log events missing from schema:')
    for (const event of missing) {
      console.error(`- ${event}`)
    }
    process.exit(1)
  }

  console.log('Log schema checks passed')
}

main()
