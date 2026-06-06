import type { Finding } from '../types'
import type { RegistryPackument } from '../utils/registry'
import { isKnownMalicious } from '../data/knownMalicious'

export function checkKnownMalicious(packageName: string, _packument: RegistryPackument): Finding[] {
  const reason = isKnownMalicious(packageName)
  if (!reason) return []

  return [{
    packageName,
    level: 'critical',
    check: 'known-malicious',
    title: 'Known malicious package',
    description: reason,
    recommendation: 'Remove this package immediately and audit your system for compromise.',
  }]
}
