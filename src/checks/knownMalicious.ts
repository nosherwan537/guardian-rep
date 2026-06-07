import type { Finding, PackageTarget } from '../types'
import type { RegistryPackument } from '../utils/registry'
import { isKnownMalicious } from '../data/knownMalicious'

export function checkKnownMalicious(target: PackageTarget, _packument: RegistryPackument): Finding[] {
  const reason = isKnownMalicious(target.name)
  if (!reason) return []

  return [{
    packageName: target.name,
    level: 'critical',
    check: 'known-malicious',
    title: 'Known malicious package',
    description: reason,
    recommendation: 'Remove this package immediately and audit your system for compromise.',
  }]
}
