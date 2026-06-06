import { Command } from 'commander'
import { scanCommand } from './commands/scan'
import { installCommand } from './commands/install'
import { auditCommand } from './commands/audit'

const program = new Command()

program
  .name('npmguard')
  .description('Scan npm dependencies before installation')
  .version('0.1.0')

program.addCommand(scanCommand)
program.addCommand(installCommand)
program.addCommand(auditCommand)

program.parse()
