import { Command } from 'commander'

export const auditCommand = new Command('audit')
  .description('Audit a single package by name')
  .argument('<package>', 'Package name to audit')
  .option('-v, --verbose', 'Show full package metadata')
  .action(async (_pkg: string, _options: unknown) => {
    console.log('audit: not yet implemented')
    process.exit(2)
  })
