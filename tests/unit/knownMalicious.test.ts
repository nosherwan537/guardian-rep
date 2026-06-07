import { describe, it, expect } from 'vitest'
import { checkKnownMalicious } from '../../src/checks/knownMalicious'

const fakePackument = { name: '', 'dist-tags': {}, versions: {}, time: {} } as any
const target = (name: string) => ({ name })

describe('checkKnownMalicious', () => {
  it('returns a critical finding for a known malicious package', () => {
    const findings = checkKnownMalicious(target('crossenv'), fakePackument)
    expect(findings).toHaveLength(1)
    expect(findings[0].level).toBe('critical')
    expect(findings[0].check).toBe('known-malicious')
  })

  it('returns no findings for a clean package', () => {
    const findings = checkKnownMalicious(target('lodash'), fakePackument)
    expect(findings).toHaveLength(0)
  })

  it('is case-sensitive — does not flag partial matches', () => {
    const findings = checkKnownMalicious(target('crossenv-extra'), fakePackument)
    expect(findings).toHaveLength(0)
  })

  it('includes the reason in the description', () => {
    const findings = checkKnownMalicious(target('crossenv'), fakePackument)
    expect(findings[0].description).toContain('cross-env')
  })
})
