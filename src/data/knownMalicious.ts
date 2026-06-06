// Curated list of confirmed malicious packages.
// Run `npm run update-db` to refresh from upstream sources.
const KNOWN_MALICIOUS: Record<string, string> = {
  'crossenv':                'Typosquat of cross-env; exfiltrated environment variables',
  'cross-env.js':            'Typosquat of cross-env; malicious postinstall',
  'flatmap-stream':          'Injected via event-stream compromise; targeted bitcoin wallets',
  'event-stream':            'Compromised in 2018; malicious dependency injected',
  'eslint-scope':            'Compromised in 2018; stole npm tokens',
  'getcookies':              'Malicious package; credential harvester',
  'nodejs-malware-found':    'Test malware package; should not be installed',
  'npm-dev-test':            'Harvested environment variables on install',
  'node-ipc':                'Intentional destructive payload added by maintainer (protestware)',
  'peacenotwar':             'Destructive protestware; wiped files on Russian/Belarusian IPs',
  'ua-parser-js':            'Compromised in 2021; installed cryptominer and password stealer',
  'coa':                     'Compromised in 2021; malicious version published',
  'rc':                      'Compromised in 2021; malicious version published',
  'twilio-npm':              'Typosquat of twilio; exfiltrated environment variables',
  'loadyaml':                'Typosquat of js-yaml; exfiltrated env vars',
  'sanitize-html-esca':      'Typosquat of sanitize-html; data exfiltration',
  'discord-lofy':            'Discord token stealer',
  'prerequests-xcode':       'macOS credential stealer targeting Xcode projects',
  'python-utils':            'Typosquat targeting Python developers; ran shell payload',
  'umbra-software':          'Exfiltrated environment variables and SSH keys',
  'noblox.js-proxied':       'Roblox cookie stealer',
  'pad-left':                'Typosquat of left-pad; malicious postinstall script',
}

export function isKnownMalicious(packageName: string): string | null {
  return KNOWN_MALICIOUS[packageName] ?? null
}
