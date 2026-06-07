import { describe, it, expect } from 'vitest'
import { checkTyposquat } from '../../src/checks/typosquat'
import { levenshtein } from '../../src/utils/levenshtein'

const target = (name: string) => ({ name })
const fakePackument = { name: '', 'dist-tags': {}, versions: {}, time: {} } as any

describe('levenshtein', () => {
  it('returns 0 for identical strings', () => {
    expect(levenshtein('lodash', 'lodash')).toBe(0)
  })

  it('returns 1 for a single character substitution', () => {
    expect(levenshtein('expres', 'express')).toBe(1)
  })

  it('returns 1 for a single insertion', () => {
    expect(levenshtein('reacts', 'react')).toBe(1)
  })

  it('returns 2 for two-character typo', () => {
    expect(levenshtein('lodahs', 'lodash')).toBe(2)
  })

  it('returns > maxDist early when strings differ by more', () => {
    expect(levenshtein('completely', 'different', 2)).toBeGreaterThan(2)
  })
})

describe('checkTyposquat', () => {
  it('returns no findings for a package in the popular list', () => {
    expect(checkTyposquat(target('lodash'), fakePackument)).toHaveLength(0)
  })

  it('returns no findings for an unrelated package name', () => {
    expect(checkTyposquat(target('my-totally-unique-company-pkg'), fakePackument)).toHaveLength(0)
  })

  it('flags distance-1 typosquat as critical', () => {
    const findings = checkTyposquat(target('expres'), fakePackument)
    expect(findings).toHaveLength(1)
    expect(findings[0].level).toBe('critical')
    expect(findings[0].description).toContain('express')
  })

  it('flags distance-2 typosquat as high', () => {
    const findings = checkTyposquat(target('lodahs'), fakePackument)
    expect(findings).toHaveLength(1)
    expect(findings[0].level).toBe('high')
    expect(findings[0].description).toContain('lodash')
  })

  it('does not flag scoped packages against unrelated short names', () => {
    // @types/node normalises to "typesnode" — should not match short packages
    const findings = checkTyposquat(target('@types/node'), fakePackument)
    expect(findings).toHaveLength(0)
  })

  it('does not flag packages with names <= 3 chars from the corpus', () => {
    // "pgs" is close to "pg" (len 2) but pg is skipped due to short length rule
    const findings = checkTyposquat(target('pgs'), fakePackument)
    expect(findings).toHaveLength(0)
  })

  it('shows up to 3 matches in the description', () => {
    // "reacts" is distance 1 from "react" and potentially matches others
    const findings = checkTyposquat(target('reacts'), fakePackument)
    if (findings.length > 0) {
      const matchCount = (findings[0].description.match(/distance/g) ?? []).length
      expect(matchCount).toBeLessThanOrEqual(3)
    }
  })
})
