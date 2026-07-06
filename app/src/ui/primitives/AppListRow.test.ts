import { describe, expect, it } from 'vitest'
import { buildAppListRowAccessibilityLabel } from './listRowAccessibility'

describe('buildAppListRowAccessibilityLabel', () => {
  it('adds a spoken pause between string title and description', () => {
    expect(
      buildAppListRowAccessibilityLabel(
        'Turn on temporary diagnostics',
        'Turn on local diagnostics, export logs, or check this app version.',
      ),
    ).toBe(
      'Turn on temporary diagnostics. Turn on local diagnostics, export logs, or check this app version.',
    )
  })

  it('uses explicit labels as the intentional escape hatch', () => {
    expect(
      buildAppListRowAccessibilityLabel(
        'Support email',
        undefined,
        'Contact support@scrappykin.com for help',
      ),
    ).toBe('Contact support@scrappykin.com for help')
  })
})
