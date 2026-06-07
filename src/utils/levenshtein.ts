// Standard iterative Levenshtein with early-exit once distance exceeds maxDist.
export function levenshtein(a: string, b: string, maxDist = Infinity): number {
  if (a === b) return 0
  if (Math.abs(a.length - b.length) > maxDist) return maxDist + 1

  const m = a.length
  const n = b.length
  const row = Array.from({ length: n + 1 }, (_, i) => i)

  for (let i = 1; i <= m; i++) {
    let prev = i
    let rowMin = Infinity

    for (let j = 1; j <= n; j++) {
      const val = a[i - 1] === b[j - 1]
        ? row[j - 1]
        : 1 + Math.min(row[j - 1], row[j], prev)
      row[j - 1] = prev
      prev = val
      if (val < rowMin) rowMin = val
    }

    row[n] = prev
    if (rowMin > maxDist) return maxDist + 1
  }

  return row[n]
}
