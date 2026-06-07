import type { Finding, PackageTarget } from '../types'
import type { RegistryPackument } from '../utils/registry'

const DAY_MS = 24 * 60 * 60 * 1000
const HIGH_THRESHOLD_DAYS = 7
const MEDIUM_THRESHOLD_DAYS = 30

export function checkPackageAge(target: PackageTarget, packument: RegistryPackument): Finding[] {
  const latest = packument['dist-tags']?.latest
  if (!latest) return []

  const publishedAt = packument.time?.[latest]
  if (!publishedAt) return []

  const ageMs = Date.now() - new Date(publishedAt).getTime()
  const ageDays = Math.floor(ageMs / DAY_MS)

  if (ageDays < 0) return [] // clock skew / bad data

  if (ageDays < HIGH_THRESHOLD_DAYS) {
    return [{
      packageName: target.name,
      level: 'high',
      check: 'package-age',
      title: `Package published ${ageDays === 0 ? 'today' : `${ageDays} day${ageDays === 1 ? '' : 's'} ago`}`,
      description: `"${target.name}" (v${latest}) was published less than a week ago. Very new packages have not been vetted by the community and are a common vector for supply chain attacks.`,
      recommendation: 'Wait for community vetting or manually audit the source before installing.',
    }]
  }

  if (ageDays < MEDIUM_THRESHOLD_DAYS) {
    return [{
      packageName: target.name,
      level: 'medium',
      check: 'package-age',
      title: `Package published ${ageDays} days ago`,
      description: `"${target.name}" (v${latest}) is less than 30 days old. New packages carry higher supply chain risk.`,
      recommendation: 'Review the package source and maintainer before installing.',
    }]
  }

  return []
}
