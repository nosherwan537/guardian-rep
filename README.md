# npm-guardian

Scan npm dependencies before installation to catch typosquats, malicious lifecycle scripts, known malware, and CVEs — before a single script runs.

```
npmguard scan .
```

```
npm-guardian scan — 6/7/2026
  /your-project/package.json

  lodash
  [HIGH] lodash vulnerable to Code Injection via `_.template`
         Affects versions: >=4.0.0 <=4.17.23
         Fix: Update to a non-vulnerable version.

  expres
  [CRITICAL] Possible typosquat of popular package
             "expres" closely resembles "express" (distance 1).

  5 packages scanned — 1 critical, 1 high
```

---

## Why

Database-backed tools (npm audit, Snyk, Safe Chain) only catch a package **after** a human analyst has written an advisory. That window is typically 45 minutes to several hours — and you're unprotected during it.

npm-guardian also runs **behavioral analysis** locally. To exfiltrate data, an attacker must read credentials (`process.env`, `.ssh`, `.aws`) and send them somewhere (`curl`, `wget`, raw TCP). These two actions are unavoidable regardless of how the package is obfuscated. A brand-new package published 30 seconds ago with a malicious `postinstall` is caught on the first install — before any database knows it exists.

Everything runs locally. No account. No API key. No data leaves your machine.

---

## Install

```bash
npm install -g npm-guardian
```

Or run without installing:

```bash
npx npm-guardian scan .
```

---

## Commands

### `npmguard scan [path]`

Scans a `package.json` without installing anything.

```bash
npmguard scan .
npmguard scan /path/to/project
npmguard scan --json | jq '.findings'
npmguard scan --threshold high       # only show high and critical
```

| Option | Description |
|---|---|
| `-j, --json` | Output structured JSON |
| `--threshold <level>` | Minimum level to show: `low` `medium` `high` `critical` |
| `--no-color` | Disable colour output |

Exit `0` = clean. Exit `1` = critical findings.

---

### `npmguard install [npm-args]`

Scans first, then runs `npm install` only after you approve.

```bash
npmguard install
npmguard install --save-dev jest
npmguard install --ci              # hard-block in CI pipelines
npmguard install --dry-run         # scan only, never installs
npmguard install --force           # install even with critical findings
npmguard install --ignore-scripts  # pass --ignore-scripts to npm
```

In CI, set `--ci` to block automatically on any high or critical finding with exit code `1`.

**Recommended:** replace your usual `npm install` habit:

```bash
alias npm='npmguard'
```

---

### `npmguard audit <package>`

Deep-dive a single package by name.

```bash
npmguard audit lodash
npmguard audit express@4.18.0
npmguard audit suspicious-pkg --verbose
npmguard audit lodash --json
```

Shows package metadata (publish date, maintainers, version count) alongside all findings.

---

## What gets checked

| Check | Severity | How it works |
|---|---|---|
| Known malicious DB | Critical | Matches against a curated list of confirmed malware (event-stream, node-ipc, etc.) |
| Typosquat detection | Critical / High | Levenshtein distance ≤ 2 from ~200 popular packages |
| Lifecycle script analysis | Critical – Medium | Scans `preinstall`/`install`/`postinstall` for curl, wget, .ssh, .aws, eval, base64, process.env |
| CVE advisories | Critical – Low | npm bulk advisory API + OSV.dev, cached at 1 hr TTL |
| Package age | High / Medium | Latest version < 7 days = high, < 30 days = medium |

---

## CI usage

```yaml
# GitHub Actions
- name: Scan dependencies
  run: npx npm-guardian scan --json --threshold high > scan.json
  
- name: Block on critical findings
  run: npx npm-guardian install --ci --dry-run
```

JSON output works with `jq`, `jira`, `slack`, or any log aggregator.

---

## Updating the malicious package database

```bash
npm run update-db
```

---

## How it compares

| | npm audit | Safe Chain | Socket.dev | **npm-guardian** |
|---|---|---|---|---|
| Pre-install scan | ✗ | ✓ | ✓ | ✓ |
| Behavioral analysis | ✗ | ✗ | ✓ (cloud) | ✓ (local) |
| Zero-day protection | ✗ | ✗ | Partial | ✓ |
| No account required | ✓ | ✓ | ✗ | ✓ |
| Data stays local | ✓ | ✓ | ✗ | ✓ |
| Explains findings | ✗ | ✗ | Partial | ✓ |

---

## License

MIT
