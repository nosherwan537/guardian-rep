import { describe, it, expect } from 'vitest'
import { renderTerminal, renderJson, hasCritical, hasHigh } from '../../src/reporter'
import type { ScanReport } from '../../src/types'

function makeReport(overrides: Partial<ScanReport> = {}): ScanReport {
  return {
    scannedAt: new Date().toISOString(),
    packagesScanned: 1,
    findings: [],
    summary: { critical: 0, high: 0, medium: 0, low: 0, info: 0 },
    ...overrides,
  }
}

describe('renderTerminal', () => {
  it('shows clean message when no findings', () => {
    const out = renderTerminal(makeReport())
    expect(out).toContain('No issues found')
  })

  it('shows finding title and package name', () => {
    const report = makeReport({
      findings: [{
        packageName: 'evil-pkg',
        level: 'critical',
        check: 'test',
        title: 'Bad package',
        description: 'Very suspicious',
      }],
      summary: { critical: 1, high: 0, medium: 0, low: 0, info: 0 },
    })
    const out = renderTerminal(report)
    expect(out).toContain('evil-pkg')
    expect(out).toContain('Bad package')
    expect(out).toContain('CRITICAL')
  })

  it('shows summary line with counts', () => {
    const report = makeReport({
      packagesScanned: 5,
      findings: [{
        packageName: 'pkg',
        level: 'high',
        check: 'test',
        title: 'High risk',
        description: 'desc',
      }],
      summary: { critical: 0, high: 1, medium: 0, low: 0, info: 0 },
    })
    const out = renderTerminal(report)
    expect(out).toContain('5 packages scanned')
    expect(out).toContain('1 high')
  })
})

describe('renderJson', () => {
  it('produces valid JSON matching the report', () => {
    const report = makeReport({ packagesScanned: 3 })
    const parsed = JSON.parse(renderJson(report))
    expect(parsed.packagesScanned).toBe(3)
  })
})

describe('hasCritical / hasHigh', () => {
  it('returns true when critical count > 0', () => {
    expect(hasCritical(makeReport({ summary: { critical: 1, high: 0, medium: 0, low: 0, info: 0 } }))).toBe(true)
  })

  it('returns false when no criticals', () => {
    expect(hasCritical(makeReport())).toBe(false)
  })

  it('returns true when high count > 0', () => {
    expect(hasHigh(makeReport({ summary: { critical: 0, high: 2, medium: 0, low: 0, info: 0 } }))).toBe(true)
  })
})
