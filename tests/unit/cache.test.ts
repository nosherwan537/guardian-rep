import { describe, it, expect, beforeEach } from 'vitest'
import { readCache, writeCache } from '../../src/utils/cache'

const PKG = '__test-pkg__'
const VER = '__test-ver__'

beforeEach(async () => {
  // clean state: reading before writing should return null
})

describe('cache', () => {
  it('returns null for a cache miss', async () => {
    const result = await readCache(PKG, 'no-such-version-xyz')
    expect(result).toBeNull()
  })

  it('roundtrips data through write then read', async () => {
    const payload = { name: PKG, foo: 'bar', num: 42 }
    await writeCache(PKG, VER, payload)
    const result = await readCache<typeof payload>(PKG, VER)
    expect(result).toEqual(payload)
  })

  it('handles scoped package names without path errors', async () => {
    await expect(writeCache('@scope/pkg', 'v1', { ok: true })).resolves.not.toThrow()
    const result = await readCache('@scope/pkg', 'v1')
    expect(result).toEqual({ ok: true })
  })
})
