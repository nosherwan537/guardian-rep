import type { Finding, PackageTarget } from '../types'
import type { RegistryPackument } from '../utils/registry'

// Scripts npm runs automatically — never triggered by the user
const LIFECYCLE_HOOKS = ['preinstall', 'install', 'postinstall', 'preuninstall', 'uninstall', 'postuninstall', 'prepare']

interface Pattern {
  regex: RegExp
  level: Finding['level']
  title: string
  description: string
}

const PATTERNS: Pattern[] = [
  // Exfil transport
  {
    regex: /\bcurl\b/i,
    level: 'high',
    title: 'Outbound HTTP via curl in lifecycle script',
    description: 'curl can exfiltrate environment variables, credentials, or files to a remote host.',
  },
  {
    regex: /\bwget\b/i,
    level: 'high',
    title: 'Outbound HTTP via wget in lifecycle script',
    description: 'wget can exfiltrate data or download and execute a remote payload.',
  },
  {
    regex: /\bnc\b|\bnetcat\b/i,
    level: 'high',
    title: 'Netcat in lifecycle script',
    description: 'netcat can open a reverse shell or exfiltrate data over raw TCP.',
  },
  // Shell execution of dynamic content
  {
    regex: /\beval\b/i,
    level: 'high',
    title: 'eval() in lifecycle script',
    description: 'eval executes arbitrary strings — commonly used with base64-decoded payloads to hide malicious code.',
  },
  {
    regex: /base64\s*(--decode|-d)/i,
    level: 'high',
    title: 'base64 decoding in lifecycle script',
    description: 'Decoding base64 at install time is a common obfuscation technique for hiding malicious payloads.',
  },
  // Credential and secret file access
  {
    regex: /\.ssh\b/,
    level: 'critical',
    title: 'SSH key access in lifecycle script',
    description: 'The script references ~/.ssh — a known target for stealing private keys and known_hosts.',
  },
  {
    regex: /\.aws\b/,
    level: 'critical',
    title: 'AWS credential access in lifecycle script',
    description: 'The script references ~/.aws — commonly targeted to steal AWS access keys.',
  },
  {
    regex: /\.npmrc/i,
    level: 'high',
    title: '.npmrc access in lifecycle script',
    description: '.npmrc can contain npm auth tokens — a common target for token theft.',
  },
  {
    regex: /\.env\b/,
    level: 'high',
    title: '.env file access in lifecycle script',
    description: 'The script references .env — which often contains secrets, API keys, and database credentials.',
  },
  {
    regex: /process\.env/,
    level: 'medium',
    title: 'Environment variable access in lifecycle script',
    description: 'Reads all environment variables at install time. Could capture CI tokens, secrets, or credentials in the environment.',
  },
  // Remote code execution
  {
    regex: /\bchmod\s+\+x\b/,
    level: 'high',
    title: 'Making a file executable in lifecycle script',
    description: 'chmod +x combined with a download is a common pattern for executing remote payloads.',
  },
  {
    regex: /\/dev\/tcp\//,
    level: 'critical',
    title: 'Raw TCP socket via /dev/tcp in lifecycle script',
    description: '/dev/tcp is a bash trick to open raw TCP connections — used in reverse shells.',
  },
  {
    regex: /\bpython\b.*\b-c\b|\bnode\b.*\b-e\b|\bruby\b.*\b-e\b/,
    level: 'high',
    title: 'Inline code execution in lifecycle script',
    description: 'Executing inline code strings (python -c, node -e) can run obfuscated payloads.',
  },
]

export function checkLifecycleScripts(target: PackageTarget, packument: RegistryPackument): Finding[] {
  const { name: packageName } = target
  const latestVersion = packument['dist-tags']?.latest
  if (!latestVersion) return []

  const versionData = packument.versions[latestVersion]
  if (!versionData?.scripts) return []

  const findings: Finding[] = []

  for (const hook of LIFECYCLE_HOOKS) {
    const scriptBody = versionData.scripts[hook]
    if (!scriptBody) continue

    for (const pattern of PATTERNS) {
      if (pattern.regex.test(scriptBody)) {
        findings.push({
          packageName,
          level: pattern.level,
          check: 'lifecycle-scripts',
          title: pattern.title,
          description: pattern.description,
          evidence: `${hook}: ${scriptBody.slice(0, 200)}${scriptBody.length > 200 ? '…' : ''}`,
          recommendation: 'Inspect the lifecycle script before installing. Use --ignore-scripts to install without running it.',
        })
      }
    }
  }

  // Deduplicate: same title can fire for multiple hooks — keep only the highest-severity instance per title
  const seen = new Map<string, Finding>()
  const LEVEL_RANK: Record<Finding['level'], number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 }
  for (const f of findings) {
    const existing = seen.get(f.title)
    if (!existing || LEVEL_RANK[f.level] < LEVEL_RANK[existing.level]) {
      seen.set(f.title, f)
    }
  }

  return [...seen.values()]
}
