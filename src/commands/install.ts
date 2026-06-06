import { Command } from 'commander'

export const installCommand = new Command('install')
  .description('Scan dependencies, then run npm install only if risk is acceptable')
  .option('-f, --force', 'Install even if critical risks are found')
  .option('--ignore-scripts', 'Pass --ignore-scripts to npm')
  .option('--dry-run', 'Scan only; do not install')
  .option('--ci', 'Hard-block on high-risk findings (for CI pipelines)')
  .allowUnknownOption(true)
  .action(async (_options: unknown) => {
    console.log('install: not yet implemented')
    process.exit(2)
  })
