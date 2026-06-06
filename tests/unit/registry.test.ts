import { describe, it, expect, vi, afterEach } from 'vitest'
import { fetchPackument } from '../../src/utils/registry'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('fetchPackument', () => {
  it('returns not-found for a 404 response', async () => {
    vi.stubGlobal('fetch', async () => ({ ok: false, status: 404 }))
    const result = await fetchPackument('__no-such-package-xyz__')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe('not-found')
  })

  it('returns network-error for a non-404 error status', async () => {
    vi.stubGlobal('fetch', async () => ({ ok: false, status: 503 }))
    const result = await fetchPackument('__pkg__')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe('network-error')
  })

  it('returns network-error when fetch throws', async () => {
    vi.stubGlobal('fetch', async () => { throw new Error('connection refused') })
    const result = await fetchPackument('__pkg-throws__')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe('network-error')
  })

  it('returns ok and data for a successful response', async () => {
    const mockData = { name: 'lodash', 'dist-tags': { latest: '4.17.21' }, versions: {}, time: {} }
    vi.stubGlobal('fetch', async () => ({
      ok: true,
      status: 200,
      json: async () => mockData,
    }))
    const result = await fetchPackument('lodash')
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.data.name).toBe('lodash')
  })
})
