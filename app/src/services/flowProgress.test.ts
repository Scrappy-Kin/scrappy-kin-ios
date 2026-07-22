import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@capacitor/preferences', () => ({
  Preferences: {
    get: vi.fn(),
    set: vi.fn(() => Promise.resolve()),
    remove: vi.fn(),
  },
}))

import { Preferences } from '@capacitor/preferences'
import { persistViewedFlowStep, setSavedFlowStep } from './flowProgress'

const mockSetPreference = vi.mocked(Preferences.set)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('onboarding progress persistence', () => {
  it('does not start onboarding merely because the fresh intro was viewed', async () => {
    await persistViewedFlowStep('intro', false)

    expect(mockSetPreference).not.toHaveBeenCalled()
  })

  it('does not complete the starter set merely because it was viewed', async () => {
    await persistViewedFlowStep('starter-set', true)

    expect(mockSetPreference).not.toHaveBeenCalled()
  })

  it('records explicit intro acceptance for restart routing', async () => {
    await setSavedFlowStep('intro')

    expect(mockSetPreference).toHaveBeenNthCalledWith(1, {
      key: 'flow_started',
      value: 'true',
    })
    expect(mockSetPreference).toHaveBeenNthCalledWith(2, {
      key: 'flow_last_step',
      value: 'intro',
    })
  })

  it('records explicit starter-set acceptance for restart routing', async () => {
    await setSavedFlowStep('starter-set')

    expect(mockSetPreference).toHaveBeenNthCalledWith(1, {
      key: 'flow_started',
      value: 'true',
    })
    expect(mockSetPreference).toHaveBeenNthCalledWith(2, {
      key: 'flow_last_step',
      value: 'starter-set',
    })
  })
})
