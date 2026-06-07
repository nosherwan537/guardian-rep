import type { Finding, PackageTarget } from '../types'
import type { RegistryPackument } from '../utils/registry'
import { readCache, writeCache, TTL_1H } from '../utils/cache'

// ── npm advisory API ──────────────────────────────────────────────────────────

interface NpmAdvisory {
  id: number
  url: string
  title: string
  severity: 'critical' | 'high' | 'moderate' | 'low' | 'info'
  vulnerable_versions: string
  recommendation?: string
  cwe?: string[]
  cvss?: { score: number }
}

type NpmAdvisoryBulkResponse = Record<string, NpmAdvisory[]>

async function fetchNpmAdvisories(name: string, version: string): Promise<NpmAdvisory[]> {
  const cacheKey = `__npm_advisory__${version}`
  const cached = await readCache<NpmAdvisory[]>(name, cacheKey, TTL_1H)
  if (cached) return cached

  try {
    const res = await fetch('https://registry.npmjs.org/-/npm/v1/security/advisories/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [name]: [version] }),
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return []

    const data = (await res.json()) as NpmAdvisoryBulkResponse
    const advisories = data[name] ?? []
    await writeCache(name, cacheKey, advisories).catch(() => undefined)
    return advisories
  } catch {
    return []
  }
}

// ── OSV.dev API ───────────────────────────────────────────────────────────────

interface OsvSeverity {
  type: string
  score: string
}

interface OsvVuln {
  id: string
  summary?: string
  severity?: OsvSeverity[]
  affected?: Array<{ ranges?: Array<{ events?: Array<{ introduced?: string; fixed?: string }> }> }>
}

interface OsvQueryBatchResponse {
  results: Array<{ vulns?: OsvVuln[] }>
}

async function fetchOsvAdvisories(name: string, version: string): Promise<OsvVuln[]> {
  const cacheKey = `__osv__${version}`
  const cached = await readCache<OsvVuln[]>(name, cacheKey, TTL_1H)
  if (cached) return cached

  try {
    const res = await fetch('https://api.osv.dev/v1/querybatch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        queries: [{ package: { name, ecosystem: 'npm' }, version }],
      }),
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return []

    const data = (await res.json()) as OsvQueryBatchResponse
    const vulns = data.results?.[0]?.vulns ?? []
    await writeCache(name, cacheKey, vulns).catch(() => undefined)
    return vulns
  } catch {
    return []
  }
}

// ── severity mapping ──────────────────────────────────────────────────────────

function npmSeverityToLevel(s: NpmAdvisory['severity']): Finding['level'] {
  switch (s) {
    case 'critical': return 'critical'
    case 'high':     return 'high'
    case 'moderate': return 'medium'
    case 'low':      return 'low'
    default:         return 'info'
  }
}

function osvScoreToLevel(vulnSeverity?: OsvSeverity[]): Finding['level'] {
  if (!vulnSeverity?.length) return 'medium'
  const cvss = vulnSeverity.find(s => s.type === 'CVSS_V3' || s.type === 'CVSS_V2')
  if (!cvss) return 'medium'
  const score = parseFloat(cvss.score)
  if (score >= 9.0) return 'critical'
  if (score >= 7.0) return 'high'
  if (score >= 4.0) return 'medium'
  return 'low'
}

// ── main check ────────────────────────────────────────────────────────────────

export async function checkAdvisory(target: PackageTarget, packument: RegistryPackument): Promise<Finding[]> {
  const name = target.name
  const version = packument['dist-tags']?.latest
  if (!version) return []

  const [npmAdvisories, osvVulns] = await Promise.all([
    fetchNpmAdvisories(name, version),
    fetchOsvAdvisories(name, version),
  ])

  const findings: Finding[] = []
  const seenIds = new Set<string>()

  for (const adv of npmAdvisories) {
    // Prefer the GHSA ID from the URL so OSV duplicates are caught
    const ghsaMatch = adv.url.match(/(GHSA-[a-z0-9-]+)/i)
    const id = ghsaMatch ? ghsaMatch[1] : `npm-${adv.id}`
    if (seenIds.has(id)) continue
    seenIds.add(id)

    findings.push({
      packageName: name,
      level: npmSeverityToLevel(adv.severity),
      check: 'advisory',
      title: adv.title,
      description: `Affects versions: ${adv.vulnerable_versions}. See ${adv.url}`,
      evidence: adv.cwe?.join(', '),
      recommendation: adv.recommendation ?? 'Update to a non-vulnerable version.',
    })
  }

  for (const vuln of osvVulns) {
    const id = vuln.id
    if (seenIds.has(id)) continue
    seenIds.add(id)

    findings.push({
      packageName: name,
      level: osvScoreToLevel(vuln.severity),
      check: 'advisory',
      title: vuln.summary ?? id,
      description: `OSV advisory ${id}. See https://osv.dev/vulnerability/${id}`,
      recommendation: 'Update to a non-vulnerable version.',
    })
  }

  return findings
}
