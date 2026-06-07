import { Command } from 'commander'
import { spawn } from 'child_process'
import { loadPackageJson, extractDependencies } from '../utils/packageJson'
import { scan } from '../scanner'
import { renderTerminal, hasCritical, hasAboveLevel } from '../reporter'
import { confirm } from '../utils/prompt'
import { checkKnownMalicious } from '../checks/knownMalicious'
import { checkLifecycleScripts } from '../checks/lifecycleScripts'
import { checkAdvisory } from '../checks/advisory'
import { checkTyposquat } from '../checks/typosquat'
import { checkPackageAge } from '../checks/packageAge'

interface InstallOptions {
  force?: boolean
  ignoreScripts?: boolean
  dryRun?: boolean
  ci?: boolean
}

const OWN_FLAGS = new Set([
  '--force', '-f',
  '--ignore-scripts',
  '--dry-run',
  '--ci',
])

function buildNpmArgs(extraArgs: string[], ignoreScripts: boolean): string[] {
  const args = ['install', ...extraArgs]
  if (ignoreScripts && !args.includes('--ignore-scripts')) {
    args.push('--ignore-scripts')
  }
  return args
}

function runNpm(args: string[]): Promise<number> {
  return new Promise((resolve, reject) => {
    const child = spawn('npm', args, { stdio: 'inherit' })
    child.on('close', code => resolve(code ?? 0))
    child.on('error', reject)
  })
}

export const installCommand = new Command('install')
  .description('Scan dependencies, then run npm install only if risk is acceptable')
  .option('-f, --force', 'Install even if critical risks are found')
  .option('--ignore-scripts', 'Pass --ignore-scripts to npm')
  .option('--dry-run', 'Scan only; do not run npm install')
  .option('--ci', 'Non-interactive: block on any high or critical finding')
  .allowUnknownOption(true)
  .action(async (options: InstallOptions, _command: Command) => {
    // Collect any extra args to forward to npm (package names, --save-dev, etc.)
    const extraArgs = process.argv
      .slice(3)
      .filter(a => !OWN_FLAGS.has(a))

    // Load package.json from cwd
    let pkg: Awaited<ReturnType<typeof loadPackageJson>>
    try {
      pkg = await loadPackageJson('.')
    } catch {
      console.error('Error: could not read package.json in current directory')
      process.exit(2)
    }

    const targets = extractDependencies(pkg.raw)

    if (targets.length === 0 && extraArgs.length === 0) {
      // No deps and no packages named on CLI — just run npm install
      const code = await runNpm(buildNpmArgs([], options.ignoreScripts ?? false))
      process.exit(code)
    }

    if (targets.length > 0) {
      process.stderr.write('Scanning dependencies…\n\n')

      const report = await scan(
        targets,
        [checkKnownMalicious, checkLifecycleScripts, checkAdvisory, checkTyposquat, checkPackageAge],
        pkg.resolvedPath,
      )

      const output = renderTerminal(report)
      process.stdout.write(output)

      const hasBlockingFindings = hasCritical(report)
      const hasCiBlockingFindings = hasAboveLevel(report, 'medium')

      // --dry-run: report only, no install
      if (options.dryRun) {
        process.exit(hasBlockingFindings ? 1 : 0)
      }

      // --ci: hard-block on high/critical without prompting
      if (options.ci && hasCiBlockingFindings) {
        process.stderr.write('\nBlocked: high or critical findings detected (--ci mode).\n')
        process.exit(1)
      }

      // Critical findings require explicit --force or user confirmation
      if (hasBlockingFindings && !options.force) {
        const proceed = await confirm('\nCritical risks found. Install anyway?')
        if (!proceed) {
          process.stderr.write('Aborted.\n')
          process.exit(1)
        }
      }

      if (!hasBlockingFindings && report.summary.high > 0 && !options.force) {
        const proceed = await confirm('\nHigh-risk findings detected. Install anyway?')
        if (!proceed) {
          process.stderr.write('Aborted.\n')
          process.exit(1)
        }
      }
    }

    // Run npm install
    const npmArgs = buildNpmArgs(extraArgs, options.ignoreScripts ?? false)
    process.stderr.write(`\nRunning: npm ${npmArgs.join(' ')}\n\n`)
    const code = await runNpm(npmArgs)
    process.exit(code)
  })
