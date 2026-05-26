import fs from 'node:fs/promises'

function parseLocalEnvLine(line) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) return null

  const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/)
  if (!match) return null

  const [, key, rawValue] = match
  let value = rawValue.trim()

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1)
  }

  return { key, value }
}

export async function loadLocalEnv(filePath) {
  let contents
  try {
    contents = await fs.readFile(filePath, 'utf8')
  } catch (error) {
    if (error?.code === 'ENOENT') return
    throw error
  }

  for (const line of contents.split(/\r?\n/)) {
    const entry = parseLocalEnvLine(line)
    if (!entry) continue
    process.env[entry.key] ??= entry.value
  }
}
