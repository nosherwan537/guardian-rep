import { Command } from 'commander'
import { fetchPackument } from '../utils/registry'
import { renderJson, hasCritical } from '../reporter'
import { checkKnownMalicious } from '../checks/knownMalicious'
import { checkLifecycleScripts } from '../checks/lifecycleScripts'
import { checkAdvisory } from '../checks/advisory'
import { checkTyposquat } from '../checks/typosquat'
import { checkPackageAge } from '../checks/packageAge'
import type { PackageTarget, ScanReport, RiskLevel } from '../types'
import { bold, dim, riskColor } from '../utils/chalk'

interface AuditOptions {
  verbose?: boolean
  json?: boolean
}

const CHECKS = [checkKnownMalicious, checkLifecycleScripts, checkAdvisory, checkTyposquat, checkPackageAge]

const RISK_ORDER: RiskLevel[] = ['critical', 'high', 'medium', 'low', 'info']

function renderMetadata(packument: import('../utils/registry').RegistryPackument): string {
  const lines: string[] = []
  const latest = packument['dist-tags']?.latest

  lines.push(bold(`  Package: ${packument.name}`))
  if (latest) lines.push(dim(`  Latest:  ${latest}`))

  const published = latest ? packument.time?.[latest] : undefined
  if (published) {
    const d = new Date(published)
    const ageDays = Math.floor((Date.now() - d.getTime()) / 86400000)
    lines.push(dim(`  Published: ${d.toLocaleDateString()} (${ageDays} days ago)`))
  }

  const created = packument.time?.created
  if (created) lines.push(dim(`  Created:   ${new Date(created).toLocaleDateString()}`))

  // time has one entry per published version plus 'created'/'modified' — subtract those
  const timeKeys = Object.keys(packument.time ?? {})
  const versionCount = timeKeys.filter(k => k !== 'created' && k !== 'modified').length
  if (versionCount > 0) lines.push(dim(`  Versions:  ${versionCount}`))

  const maintainers = packument.maintainers ?? []
  if (maintainers.length > 0) {
    lines.push(dim(`  Maintainers: ${maintainers.map(m => m.name).join(', ')}`))
  }

  lines.push('')
  return lines.join('\n')
}

export const auditCommand = new Command('audit')
  .description('Audit a single package by name')
  .argument('<package>', 'Package name to audit (optionally @version)')
  .option('-v, --verbose', 'Show full package metadata')
  .option('-j, --json', 'Output structured JSON')
  .action(async (pkgArg: string, options: AuditOptions) => {
    // Parse optional version suffix: express@4.18.0
    const atIdx = pkgArg.lastIndexOf('@')
    const isScoped = pkgArg.startsWith('@')
    const hasVersion = atIdx > (isScoped ? 0 : -1)

    const packageName = hasVersion ? pkgArg.slice(0, atIdx) : pkgArg
    const requestedVersion = hasVersion ? pkgArg.slice(atIdx + 1) : undefined

    const result = await fetchPackument(packageName)

    if (!result.ok) {
      if (result.reason === 'not-found') {
        console.error(`Error: package "${packageName}" not found in registry.`)
        process.exit(2)
      }
      console.error(`Error: ${result.message}`)
      process.exit(3)
    }

    const target: PackageTarget = { name: packageName, requestedVersion }
    const packument = result.data

    // Show metadata header before findings
    if (!options.json) {
      process.stdout.write('\n')
      process.stdout.write(renderMetadata(packument))
    }

    // Run all checks
    const findings = (
      await Promise.all(CHECKS.map(check => check(target, packument)))
    ).flat()

    findings.sort((a, b) => RISK_ORDER.indexOf(a.level) - RISK_ORDER.indexOf(b.level))

    const summary: Record<RiskLevel, number> = { critical: 0, high: 0, medium: 0, low: 0, info: 0 }
    for (const f of findings) summary[f.level]++

    const report: ScanReport = {
      scannedAt: new Date().toISOString(),
      packagesScanned: 1,
      findings,
      summary,
    }

    if (options.json) {
      // Include metadata in JSON output
      console.log(JSON.stringify({
        package: packageName,
        version: packument['dist-tags']?.latest,
        ...JSON.parse(renderJson(report)),
      }, null, 2))
    } else {
      // Print findings section (skip the scan header — we already printed metadata)
      if (findings.length === 0) {
        const { green: g } = await import('../utils/chalk')
        process.stdout.write(g(`  ✓ No issues found.\n\n`))
      } else {
        for (const f of findings) {
          const label = riskColor(f.level)(`[${f.level.toUpperCase()}]`)
          const lines = [
            `  ${label} ${bold(f.title)}`,
            `         ${f.description}`,
          ]
          if (f.evidence) lines.push(`         ${dim('Evidence:')} ${f.evidence}`)
          if (f.recommendation) lines.push(`         ${dim('Fix:')} ${f.recommendation}`)
          process.stdout.write(lines.join('\n') + '\n')
        }

        const parts = (Object.entries(summary) as [RiskLevel, number][])
          .filter(([, n]) => n > 0)
          .map(([level, n]) => riskColor(level)(`${n} ${level}`))
        process.stdout.write(`\n  ${parts.join(', ')}\n\n`)
      }

      // Verbose: show lifecycle scripts and all dist-tags
      if (options.verbose) {
        const latest = packument['dist-tags']?.latest
        const scripts = latest ? packument.versions?.[latest]?.scripts : undefined
        if (scripts && Object.keys(scripts).length > 0) {
          process.stdout.write(bold('  Lifecycle scripts:\n'))
          for (const [k, v] of Object.entries(scripts)) {
            process.stdout.write(`    ${dim(k + ':')} ${v}\n`)
          }
          process.stdout.write('\n')
        }

        const tags = packument['dist-tags'] ?? {}
        if (Object.keys(tags).length > 1) {
          process.stdout.write(bold('  dist-tags:\n'))
          for (const [tag, ver] of Object.entries(tags)) {
            process.stdout.write(`    ${dim(tag + ':')} ${ver}\n`)
          }
          process.stdout.write('\n')
        }
      }
    }

    process.exit(hasCritical(report) ? 1 : 0)
  })
