import { Command } from 'commander'
import { loadPackageJson, extractDependencies } from '../utils/packageJson'
import { scan } from '../scanner'
import { renderTerminal, renderJson, hasCritical } from '../reporter'
import { checkKnownMalicious } from '../checks/knownMalicious'
import { checkLifecycleScripts } from '../checks/lifecycleScripts'

export const scanCommand = new Command('scan')
  .description('Scan a package.json without installing dependencies')
  .argument('[path]', 'Path to package.json or directory containing one', '.')
  .option('-j, --json', 'Output structured JSON')
  .option('--threshold <level>', 'Minimum risk level to show: low, medium, high, critical', 'low')
  .option('--no-color', 'Disable colored output')
  .action(async (pathArg: string, options: { json?: boolean; threshold?: string }) => {
    let pkg: Awaited<ReturnType<typeof loadPackageJson>>

    try {
      pkg = await loadPackageJson(pathArg)
    } catch {
      console.error(`Error: could not read package.json at "${pathArg}"`)
      process.exit(2)
    }

    const targets = extractDependencies(pkg.raw)

    if (targets.length === 0) {
      console.log('No dependencies found.')
      process.exit(0)
    }

    const report = await scan(targets, [checkKnownMalicious, checkLifecycleScripts], pkg.resolvedPath)

    if (options.json) {
      console.log(renderJson(report))
    } else {
      process.stdout.write(renderTerminal(report))
    }

    process.exit(hasCritical(report) ? 1 : 0)
  })
