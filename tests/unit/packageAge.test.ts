import { describe, it, expect } from 'vitest'
import { checkPackageAge } from '../../src/checks/packageAge'
import type { RegistryPackument } from '../../src/utils/registry'

const target = (name: string) => ({ name })

function makePackument(publishedDaysAgo: number): RegistryPackument {
  const d = new Date(Date.now() - publishedDaysAgo * 24 * 60 * 60 * 1000)
  return {
    name: 'test-pkg',
    'dist-tags': { latest: '1.0.0' },
    versions: {},
    time: { '1.0.0': d.toISOString() },
  }
}

describe('checkPackageAge', () => {
  it('returns no findings for a well-established package (>30 days)', () => {
    expect(checkPackageAge(target('old-pkg'), makePackument(180))).toHaveLength(0)
  })

  it('returns a medium finding for a package published 15 days ago', () => {
    const findings = checkPackageAge(target('newer-pkg'), makePackument(15))
    expect(findings).toHaveLength(1)
    expect(findings[0].level).toBe('medium')
    expect(findings[0].check).toBe('package-age')
  })

  it('returns a high finding for a package published 3 days ago', () => {
    const findings = checkPackageAge(target('new-pkg'), makePackument(3))
    expect(findings).toHaveLength(1)
    expect(findings[0].level).toBe('high')
  })

  it('returns a high finding for a package published today', () => {
    const findings = checkPackageAge(target('brand-new'), makePackument(0))
    expect(findings).toHaveLength(1)
    expect(findings[0].level).toBe('high')
    expect(findings[0].title).toContain('today')
  })

  it('returns no findings when no dist-tags.latest', () => {
    const packument = { name: 'pkg', 'dist-tags': {}, versions: {}, time: {} } as any
    expect(checkPackageAge(target('pkg'), packument)).toHaveLength(0)
  })

  it('returns no findings when time entry is missing for latest version', () => {
    const packument: RegistryPackument = {
      name: 'pkg',
      'dist-tags': { latest: '1.0.0' },
      versions: {},
      time: {},
    }
    expect(checkPackageAge(target('pkg'), packument)).toHaveLength(0)
  })
})
