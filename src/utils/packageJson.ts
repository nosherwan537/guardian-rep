import { readFile, stat } from 'fs/promises'
import { resolve, join } from 'path'
import type { PackageTarget } from '../types'

interface RawPackageJson {
  name?: string
  version?: string
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
  optionalDependencies?: Record<string, string>
}

export async function loadPackageJson(pathArg: string): Promise<{ raw: RawPackageJson; resolvedPath: string }> {
  let resolvedPath = resolve(pathArg)

  try {
    const s = await stat(resolvedPath)
    if (s.isDirectory()) {
      resolvedPath = join(resolvedPath, 'package.json')
    }
  } catch {
    // not a directory — use path as-is
  }

  const content = await readFile(resolvedPath, 'utf-8')
  const raw = JSON.parse(content) as RawPackageJson
  return { raw, resolvedPath }
}

export function extractDependencies(raw: RawPackageJson): PackageTarget[] {
  const targets: PackageTarget[] = []
  const depTypes = [
    'dependencies',
    'devDependencies',
    'peerDependencies',
    'optionalDependencies',
  ] as const

  for (const depType of depTypes) {
    const deps = raw[depType]
    if (!deps) continue
    for (const [name, version] of Object.entries(deps)) {
      targets.push({ name, requestedVersion: version, dependencyType: depType })
    }
  }

  return targets
}
