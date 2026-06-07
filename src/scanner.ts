import type { Finding, PackageTarget, ScanReport, RiskLevel } from './types'
import { fetchPackument } from './utils/registry'

export type CheckFn = (
  target: PackageTarget,
  packument: import('./utils/registry').RegistryPackument,
) => Finding[] | Promise<Finding[]>

const RISK_ORDER: RiskLevel[] = ['critical', 'high', 'medium', 'low', 'info']

async function scanPackage(
  target: PackageTarget,
  checks: CheckFn[],
): Promise<Finding[]> {
  const result = await fetchPackument(target.name)

  if (!result.ok) {
    if (result.reason === 'not-found') {
      return [{
        packageName: target.name,
        level: 'high',
        check: 'registry',
        title: 'Package not found in registry',
        description: result.message,
        recommendation: 'Verify the package name is correct — this may be a typo or a removed package.',
      }]
    }
    // timeout or network-error: warn but don't block
    return [{
      packageName: target.name,
      level: 'low',
      check: 'registry',
      title: 'Registry lookup failed',
      description: result.message,
      recommendation: 'Check your network connection. Scan results for this package are incomplete.',
    }]
  }

  const findings: Finding[] = []
  for (const check of checks) {
    findings.push(...await check(target, result.data))
  }
  return findings
}

export async function scan(
  targets: PackageTarget[],
  checks: CheckFn[],
  targetPath?: string,
): Promise<ScanReport> {
  const results = await Promise.allSettled(
    targets.map(target => scanPackage(target, checks)),
  )

  const findings: Finding[] = []
  for (const result of results) {
    if (result.status === 'fulfilled') {
      findings.push(...result.value)
    }
  }

  findings.sort(
    (a, b) => RISK_ORDER.indexOf(a.level) - RISK_ORDER.indexOf(b.level),
  )

  const summary: Record<RiskLevel, number> = {
    critical: 0, high: 0, medium: 0, low: 0, info: 0,
  }
  for (const f of findings) summary[f.level]++

  return {
    scannedAt: new Date().toISOString(),
    targetPath,
    packagesScanned: targets.length,
    findings,
    summary,
  }
}
