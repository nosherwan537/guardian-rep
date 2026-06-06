import { Command } from 'commander'

export const scanCommand = new Command('scan')
  .description('Scan a package.json without installing dependencies')
  .argument('[path]', 'Path to package.json or directory containing one', '.')
  .option('-j, --json', 'Output structured JSON')
  .option('--threshold <level>', 'Minimum risk level to show: low, medium, high, critical', 'low')
  .option('--no-color', 'Disable colored output')
  .action(async (_path: string, _options: unknown) => {
    console.log('scan: not yet implemented')
    process.exit(2)
  })
