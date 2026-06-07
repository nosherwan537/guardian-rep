import { createInterface } from 'readline'

export async function confirm(question: string): Promise<boolean> {
  // In non-interactive environments (CI, piped stdin) default to "no"
  if (!process.stdin.isTTY) return false

  const rl = createInterface({ input: process.stdin, output: process.stderr })

  return new Promise(resolve => {
    rl.question(`${question} [y/N] `, answer => {
      rl.close()
      resolve(answer.trim().toLowerCase() === 'y')
    })
  })
}
