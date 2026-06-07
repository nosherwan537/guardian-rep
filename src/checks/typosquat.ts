import type { Finding, PackageTarget } from '../types'
import type { RegistryPackument } from '../utils/registry'
import { levenshtein } from '../utils/levenshtein'
import { POPULAR_PACKAGES } from '../data/popularPackages'

const MAX_DIST = 2

// Normalise a package name for comparison: flatten scope into the name, lowercase, collapse separators.
// "@types/node" → "typesnode", "lodash-clonedeep" → "lodashclonedeep".
// We keep the scope text so "@types/node" doesn't collapse to bare "node" and false-positive
// against unrelated short packages like "nock" or "ts-node".
function normalise(name: string): string {
  return name
    .replace(/^@/, '')           // drop leading @
    .toLowerCase()
    .replace(/[-_./]/g, '')      // collapse separators including /
}

interface TyposquatMatch {
  target: string
  popular: string
  dist: number
}

export function checkTyposquat(target: PackageTarget, _packument: RegistryPackument): Finding[] {
  const name = target.name

  // If the package itself is in the popular list it's not a typosquat
  if (POPULAR_PACKAGES.includes(name)) return []

  const normName = normalise(name)
  const best: TyposquatMatch[] = []

  for (const popular of POPULAR_PACKAGES) {
    if (popular === name) return []  // exact match — definitely not a typosquat

    const normPopular = normalise(popular)

    // Skip if normalised forms are identical (e.g. scoped vs unscoped alias)
    if (normName === normPopular) continue

    // Skip very short popular packages where distance 1-2 is noise (e.g. "pg", "ws")
    if (popular.length <= 3) continue

    const dist = levenshtein(normName, normPopular, MAX_DIST)
    if (dist <= MAX_DIST) {
      best.push({ target: name, popular, dist })
    }
  }

  if (best.length === 0) return []

  // Sort by distance then alpha, take top 3 to keep the message readable
  best.sort((a, b) => a.dist - b.dist || a.popular.localeCompare(b.popular))
  const top = best.slice(0, 3)

  const level = top[0].dist === 1 ? 'critical' : 'high'
  const matches = top.map(m => `"${m.popular}" (distance ${m.dist})`).join(', ')

  return [{
    packageName: name,
    level,
    check: 'typosquat',
    title: `Possible typosquat of popular package`,
    description: `"${name}" closely resembles ${matches}.`,
    recommendation: `Verify this is the package you intended. If you meant one of the above, correct the name in package.json.`,
  }]
}
