export type RiskLevel = 'info' | 'low' | 'medium' | 'high' | 'critical'

export interface Finding {
  packageName: string
  level: RiskLevel
  check: string
  title: string
  description: string
  evidence?: string
  recommendation?: string
}

export interface PackageTarget {
  name: string
  requestedVersion?: string
  dependencyType?: 'dependencies' | 'devDependencies' | 'peerDependencies' | 'optionalDependencies'
}

export interface ScanReport {
  scannedAt: string
  targetPath?: string
  packagesScanned: number
  findings: Finding[]
  summary: Record<RiskLevel, number>
}
