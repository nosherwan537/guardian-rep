import { describe, it, expect } from 'vitest'

describe('chalk utils', () => {
  it('passes text through when NO_COLOR is set', async () => {
    process.env.NO_COLOR = '1'
    const { red, bold } = await import('../../src/utils/chalk')
    expect(red('danger')).toBe('danger')
    expect(bold('text')).toBe('text')
    delete process.env.NO_COLOR
  })

  it('riskColor returns a callable function', async () => {
    const { riskColor } = await import('../../src/utils/chalk')
    expect(typeof riskColor('critical')).toBe('function')
    expect(typeof riskColor('low')).toBe('function')
    expect(typeof riskColor('info')).toBe('function')
  })
})
