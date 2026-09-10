import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  native: vi.fn(() => false),
  request: vi.fn(async () => ({ requested: true })),
  appInfo: vi.fn(async () => ({ version: '1.0.0' })),
  get: vi.fn(), set: vi.fn(), remove: vi.fn(),
}))
vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: mocks.native },
  registerPlugin: () => ({ request: mocks.request }),
}))
vi.mock('@capacitor/preferences', () => ({ Preferences: mocks }))
vi.mock('@capacitor/app', () => ({ App: { getInfo: mocks.appInfo } }))
vi.mock('../config/buildInfo', () => ({ IS_DEV_BUILD: true }))

import { beginReviewRound, completeReviewRound, discardReviewOpportunity, requestDashboardReview, setReviewMarketingVersionForQa } from './reviewPrompt'

const full = { sent: 5, failed: 0, pending: 0, total: 5, newlySent: 5 }
const ready = () => true
const arm = () => completeReviewRound(beginReviewRound(), full)

beforeEach(() => {
  vi.resetAllMocks()
  mocks.native.mockReturnValue(false)
  mocks.request.mockResolvedValue({ requested: true })
  mocks.appInfo.mockResolvedValue({ version: '1.0.0' })
  let stored: string | null = null
  mocks.get.mockImplementation(async () => ({ value: stored }))
  mocks.set.mockImplementation(async ({ value }: { value: string }) => { stored = value })
  mocks.remove.mockImplementation(async () => { stored = null })
  discardReviewOpportunity()
  setReviewMarketingVersionForQa('1.0.0')
})

describe('dashboard review opportunity', () => {
  it('requires a fresh complete send, not dashboard entry or stored send history', async () => {
    expect(await requestDashboardReview(ready)).toBe('skipped')
    arm()
    expect(await requestDashboardReview(ready)).toBe('preview')
    expect(mocks.request).not.toHaveBeenCalled()
  })

  it.each([
    { ...full, sent: 4, failed: 1, newlySent: 4 },
    { ...full, sent: 4, pending: 1, newlySent: 4 },
    { sent: 0, failed: 0, pending: 0, total: 0, newlySent: 0 },
    { ...full, newlySent: 0 },
  ])('rejects incomplete, empty, and already-sent queues: %j', async (summary) => {
    completeReviewRound(beginReviewRound(), summary)
    expect(await requestDashboardReview(ready)).toBe('skipped')
    expect(mocks.set).not.toHaveBeenCalled()
  })

  it('does not resurrect a send that completed after backgrounding or leaving', async () => {
    const round = beginReviewRound()
    discardReviewOpportunity()
    completeReviewRound(round, full)
    expect(await requestDashboardReview(ready)).toBe('skipped')
  })

  it('discards this opportunity without blocking a later fresh round', async () => {
    arm()
    discardReviewOpportunity()
    expect(await requestDashboardReview(ready)).toBe('skipped')
    arm()
    expect(await requestDashboardReview(ready)).toBe('preview')
  })

  it('records only one attempt for the same marketing version', async () => {
    arm()
    expect(await requestDashboardReview(ready)).toBe('preview')
    expect(await requestDashboardReview(ready)).toBe('skipped')
    arm()
    expect(await requestDashboardReview(ready)).toBe('skipped')
    expect(mocks.set).toHaveBeenCalledTimes(1)
  })

  it('allows a new marketing version after another fresh complete send', async () => {
    arm()
    expect(await requestDashboardReview(ready)).toBe('preview')
    setReviewMarketingVersionForQa('1.1.0')
    arm()
    expect(await requestDashboardReview(ready)).toBe('preview')
    expect(mocks.set).toHaveBeenLastCalledWith(expect.objectContaining({ value: '1.1.0' }))
  })

  it('uses the native app marketing version outside a QA override', async () => {
    setReviewMarketingVersionForQa(null)
    mocks.native.mockReturnValue(true)
    arm()
    expect(await requestDashboardReview(ready)).toBe('requested')
    expect(mocks.appInfo).toHaveBeenCalledOnce()
    expect(mocks.set).toHaveBeenCalledWith(expect.objectContaining({ value: '1.0.0' }))
  })

  it('does not request after leaving while storage is loading', async () => {
    arm()
    mocks.get.mockImplementationOnce(async () => {
      discardReviewOpportunity()
      return { value: null }
    })
    expect(await requestDashboardReview(ready)).toBe('skipped')
    expect(mocks.set).not.toHaveBeenCalled()
  })

  it('does not consume the attempt if eligibility changes during the write', async () => {
    arm()
    mocks.set.mockImplementationOnce(async () => { discardReviewOpportunity() })
    expect(await requestDashboardReview(ready)).toBe('skipped')
    expect(mocks.remove).toHaveBeenCalledOnce()
  })

  it('rechecks dashboard readiness and drops the opportunity', async () => {
    arm()
    expect(await requestDashboardReview(() => false)).toBe('skipped')
    expect(await requestDashboardReview(ready)).toBe('skipped')
  })

  it('coalesces simultaneous requests', async () => {
    arm()
    const first = requestDashboardReview(ready)
    expect(await requestDashboardReview(ready)).toBe('skipped')
    expect(await first).toBe('preview')
    expect(mocks.set).toHaveBeenCalledOnce()
  })

  it('crosses the native bridge only after recording the attempt', async () => {
    mocks.native.mockReturnValue(true)
    mocks.request.mockImplementationOnce(async () => {
      expect(mocks.set).toHaveBeenCalledOnce()
      return { requested: true }
    })
    arm()
    expect(await requestDashboardReview(ready)).toBe('requested')
  })

  it('releases the attempt when native presentation is unsafe, without retrying this send', async () => {
    mocks.native.mockReturnValue(true)
    mocks.request.mockResolvedValueOnce({ requested: false })
    arm()
    expect(await requestDashboardReview(ready)).toBe('skipped')
    expect(mocks.remove).toHaveBeenCalledOnce()
    expect(await requestDashboardReview(ready)).toBe('skipped')
  })

  it('fails quietly and conservatively if bridge completion is unknown', async () => {
    mocks.native.mockReturnValue(true)
    mocks.request.mockRejectedValueOnce(new Error('bridge interrupted'))
    arm()
    expect(await requestDashboardReview(ready)).toBe('skipped')
    arm()
    expect(await requestDashboardReview(ready)).toBe('skipped')
    expect(mocks.request).toHaveBeenCalledOnce()
  })

  it('does not request if recording the guard fails', async () => {
    mocks.native.mockReturnValue(true)
    mocks.set.mockRejectedValueOnce(new Error('storage unavailable'))
    arm()
    expect(await requestDashboardReview(ready)).toBe('skipped')
    expect(mocks.request).not.toHaveBeenCalled()
  })
})
