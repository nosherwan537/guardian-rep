import { readCache, writeCache } from './cache'

const REGISTRY = 'https://registry.npmjs.org'
const TIMEOUT_MS = 8000

export interface RegistryPackument {
  name: string
  'dist-tags': Record<string, string>
  versions: Record<string, RegistryVersion>
  time: Record<string, string>
  maintainers?: Array<{ name: string; email: string }>
}

export interface RegistryVersion {
  name: string
  version: string
  scripts?: Record<string, string>
  maintainers?: Array<{ name: string; email: string }>
  _npmUser?: { name: string; email: string }
}

export type FetchResult =
  | { ok: true; data: RegistryPackument }
  | { ok: false; reason: 'not-found' | 'network-error' | 'timeout'; message: string }

export async function fetchPackument(packageName: string): Promise<FetchResult> {
  const cacheKey = '__packument__'

  const cached = await readCache<RegistryPackument>(packageName, cacheKey)
  if (cached) return { ok: true, data: cached }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const url = `${REGISTRY}/${encodeURIComponent(packageName).replace('%40', '@')}`
    const res = await fetch(url, { signal: controller.signal })
    clearTimeout(timer)

    if (res.status === 404) {
      return { ok: false, reason: 'not-found', message: `Package "${packageName}" not found in registry` }
    }
    if (!res.ok) {
      return { ok: false, reason: 'network-error', message: `Registry returned ${res.status} for "${packageName}"` }
    }

    const data = (await res.json()) as RegistryPackument
    await writeCache(packageName, cacheKey, data).catch(() => undefined)
    return { ok: true, data }
  } catch (err) {
    clearTimeout(timer)
    const isTimeout = err instanceof Error && err.name === 'AbortError'
    return {
      ok: false,
      reason: isTimeout ? 'timeout' : 'network-error',
      message: isTimeout
        ? `Registry request timed out for "${packageName}"`
        : `Network error fetching "${packageName}": ${String(err)}`,
    }
  }
}
