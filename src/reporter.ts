import type { ScanReport, Finding, RiskLevel } from './types'
import { bold, dim, green, red, riskColor } from './utils/chalk'

const LEVEL_LABEL: Record<RiskLevel, string> = {
  critical: 'CRITICAL',
  high:     'HIGH    ',
  medium:   'MEDIUM  ',
  low:      'LOW     ',
  info:     'INFO    ',
}

function formatFinding(f: Finding): string {
  const label = riskColor(f.level)(`[${LEVEL_LABEL[f.level].trim()}]`)
  const lines = [
    `  ${label} ${bold(f.title)} (${f.packageName})`,
    `         ${f.description}`,
  ]
  if (f.evidence) lines.push(`         ${dim('Evidence:')} ${f.evidence}`)
  if (f.recommendation) lines.push(`         ${dim('Fix:')} ${f.recommendation}`)
  return lines.join('\n')
}

export function renderTerminal(report: ScanReport): string {
  const lines: string[] = []

  lines.push('')
  lines.push(bold(`npm-guardian scan — ${new Date(report.scannedAt).toLocaleString()}`))
  if (report.targetPath) lines.push(dim(`  ${report.targetPath}`))
  lines.push('')

  if (report.findings.length === 0) {
    lines.push(green('  ✓ No issues found across ' + report.packagesScanned + ' packages.'))
    lines.push('')
    return lines.join('\n')
  }

  const grouped = new Map<string, Finding[]>()
  for (const f of report.findings) {
    const existing = grouped.get(f.packageName) ?? []
    existing.push(f)
    grouped.set(f.packageName, existing)
  }

  for (const [pkg, findings] of grouped) {
    lines.push(bold(`  ${pkg}`))
    for (const f of findings) lines.push(formatFinding(f))
    lines.push('')
  }

  const { critical, high, medium, low, info } = report.summary
  const parts = [
    critical > 0 ? red(`${critical} critical`) : '',
    high > 0 ? riskColor('high')(`${high} high`) : '',
    medium > 0 ? riskColor('medium')(`${medium} medium`) : '',
    low > 0 ? riskColor('low')(`${low} low`) : '',
    info > 0 ? dim(`${info} info`) : '',
  ].filter(Boolean)

  lines.push(`  ${report.packagesScanned} packages scanned — ${parts.join(', ')}`)
  lines.push('')
  return lines.join('\n')
}

export function renderJson(report: ScanReport): string {
  return JSON.stringify(report, null, 2)
}

export function hasCritical(report: ScanReport): boolean {
  return report.summary.critical > 0
}

export function hasHigh(report: ScanReport): boolean {
  return report.summary.high > 0
}

const LEVEL_RANK: Record<RiskLevel, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 }

export function hasAboveLevel(report: ScanReport, threshold: RiskLevel): boolean {
  return report.findings.some(f => LEVEL_RANK[f.level] <= LEVEL_RANK[threshold])
}
