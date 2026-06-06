import { describe, it, expect } from 'vitest'
import { extractDependencies } from '../../src/utils/packageJson'

describe('extractDependencies', () => {
  it('extracts dependencies', () => {
    const targets = extractDependencies({
      dependencies: { express: '^4.18.0', lodash: '^4.17.0' },
    })
    expect(targets).toHaveLength(2)
    expect(targets[0]).toMatchObject({ name: 'express', dependencyType: 'dependencies' })
    expect(targets[1]).toMatchObject({ name: 'lodash', dependencyType: 'dependencies' })
  })

  it('extracts devDependencies with correct type', () => {
    const targets = extractDependencies({
      devDependencies: { typescript: '^5.0.0' },
    })
    expect(targets[0]).toMatchObject({ name: 'typescript', dependencyType: 'devDependencies' })
  })

  it('preserves requested version', () => {
    const targets = extractDependencies({ dependencies: { dotenv: '~16.0.0' } })
    expect(targets[0].requestedVersion).toBe('~16.0.0')
  })

  it('returns empty array when no deps present', () => {
    expect(extractDependencies({})).toHaveLength(0)
  })

  it('handles all four dependency types', () => {
    const targets = extractDependencies({
      dependencies: { a: '1.0.0' },
      devDependencies: { b: '1.0.0' },
      peerDependencies: { c: '1.0.0' },
      optionalDependencies: { d: '1.0.0' },
    })
    expect(targets).toHaveLength(4)
    expect(targets.map(t => t.dependencyType)).toEqual([
      'dependencies',
      'devDependencies',
      'peerDependencies',
      'optionalDependencies',
    ])
  })
})
