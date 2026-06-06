const NO_COLOR =
  process.env.NO_COLOR !== undefined ||
  process.env.TERM === 'dumb' ||
  !process.stdout.isTTY

const c =
  (open: number, close: number) =>
  (text: string): string =>
    NO_COLOR ? text : `\x1b[${open}m${text}\x1b[${close}m`

export const red = c(31, 39)
export const yellow = c(33, 39)
export const green = c(32, 39)
export const cyan = c(36, 39)
export const gray = c(90, 39)
export const white = c(37, 39)
export const bold = c(1, 22)
export const dim = c(2, 22)

export function riskColor(level: string): (text: string) => string {
  switch (level) {
    case 'critical': return (t) => bold(red(t))
    case 'high': return red
    case 'medium': return yellow
    case 'low': return cyan
    default: return gray
  }
}
