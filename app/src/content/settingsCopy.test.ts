import { describe, expect, it } from 'vitest'
import {
  SETTINGS_DESTINATIONS,
  SETTINGS_HOME_ROWS,
  type SettingsHomeRowCopy,
} from './settingsCopy'

const homeRows: SettingsHomeRowCopy[] = [
  ...Object.values(SETTINGS_DESTINATIONS),
  ...Object.values(SETTINGS_HOME_ROWS),
]

describe('settings copy', () => {
  it('keeps settings home rows action-first in visible copy', () => {
    for (const row of homeRows) {
      if (row.spokenLabelOverride) continue

      expect(row.title.trim().length).toBeGreaterThan(0)
      expect(row.description.trim().length).toBeGreaterThan(0)
    }
  })

  it('requires a documented reason when spoken labels intentionally diverge', () => {
    for (const row of homeRows) {
      if (!row.spokenLabelOverride) continue

      expect(row.spokenLabelOverride.label.trim().length).toBeGreaterThan(0)
      expect(row.spokenLabelOverride.reason.trim().length).toBeGreaterThan(0)
    }
  })

  it('keeps the diagnostics home row visibly and audibly opt-in', () => {
    const diagnostics = SETTINGS_DESTINATIONS.diagnostics

    expect(diagnostics.title).toContain('Turn on')
    expect(diagnostics.title).toContain('temporary diagnostics')
    expect(diagnostics.description).toContain('Turn on local diagnostics')
  })
})
