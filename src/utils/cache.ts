import { readFile, writeFile, mkdir, stat } from 'fs/promises'
import { join } from 'path'
import { homedir } from 'os'

const CACHE_DIR = join(homedir(), '.npmguard', 'cache')
const TTL_MS = 24 * 60 * 60 * 1000

function cachePath(packageName: string, version: string): string {
  const safeName = packageName.replace(/\//g, '__')
  return join(CACHE_DIR, safeName, `${version}.json`)
}

export async function readCache<T>(packageName: string, version: string): Promise<T | null> {
  const file = cachePath(packageName, version)
  try {
    const s = await stat(file)
    if (Date.now() - s.mtimeMs > TTL_MS) return null
    const raw = await readFile(file, 'utf-8')
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export async function writeCache<T>(packageName: string, version: string, data: T): Promise<void> {
  const file = cachePath(packageName, version)
  await mkdir(join(CACHE_DIR, packageName.replace(/\//g, '__')), { recursive: true })
  await writeFile(file, JSON.stringify(data), 'utf-8')
}
