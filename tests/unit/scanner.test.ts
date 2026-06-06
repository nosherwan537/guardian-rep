import { describe, it, expect, vi, afterEach } from 'vitest'
import { scan } from '../../src/scanner'
import type { PackageTarget } from '../../src/types'

afterEach(() => vi.restoreAllMocks())

const mockPackument = (name: string) => ({
  name,
  'dist-tags': { latest: '1.0.0' },
  versions: {},
  time: { created: new Date().toISOString() },
})

describe('scan', () => {
  it('returns a report with correct package count', async () => {
    vi.stubGlobal('fetch', async () => ({
      ok: true,
      status: 200,
      json: async () => mockPackument('lodash'),
    }))

    const targets: PackageTarget[] = [
      { name: 'lodash', requestedVersion: '^4.0.0', dependencyType: 'dependencies' },
    ]
    const report = await scan(targets, [])
    expect(report.packagesScanned).toBe(1)
    expect(report.findings).toHaveLength(0)
  })

  it('produces a high finding when package is not found', async () => {
    vi.stubGlobal('fetch', async () => ({ ok: false, status: 404 }))

    const targets: PackageTarget[] = [{ name: 'totally-fake-pkg' }]
    const report = await scan(targets, [])
    expect(report.findings[0].level).toBe('high')
    expect(report.findings[0].check).toBe('registry')
  })

  it('collects findings from checks', async () => {
    vi.stubGlobal('fetch', async () => ({
      ok: true,
      status: 200,
      json: async () => mockPackument('some-pkg'),
    }))

    const fakeCheck = vi.fn(() => [{
      packageName: 'some-pkg',
      level: 'medium' as const,
      check: 'fake',
      title: 'Fake finding',
      description: 'For testing',
    }])

    const targets: PackageTarget[] = [{ name: 'some-pkg' }]
    const report = await scan(targets, [fakeCheck])
    expect(report.findings).toHaveLength(1)
    expect(report.summary.medium).toBe(1)
  })

  it('sorts findings critical-first', async () => {
    vi.stubGlobal('fetch', async () => ({
      ok: true,
      status: 200,
      json: async () => mockPackument('pkg'),
    }))

    const checks = [vi.fn(() => [
      { packageName: 'pkg', level: 'low' as const, check: 'a', title: 'Low', description: '' },
      { packageName: 'pkg', level: 'critical' as const, check: 'b', title: 'Critical', description: '' },
      { packageName: 'pkg', level: 'medium' as const, check: 'c', title: 'Medium', description: '' },
    ])]

    const report = await scan([{ name: 'pkg' }], checks)
    expect(report.findings.map(f => f.level)).toEqual(['critical', 'medium', 'low'])
  })

  it('includes scannedAt timestamp', async () => {
    vi.stubGlobal('fetch', async () => ({
      ok: true,
      status: 200,
      json: async () => mockPackument('pkg'),
    }))
    const report = await scan([{ name: 'pkg' }], [])
    expect(new Date(report.scannedAt).getTime()).toBeGreaterThan(0)
  })
})
