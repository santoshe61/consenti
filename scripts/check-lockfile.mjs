// Fails if package-lock.json is out of sync with the workspace package.json files, or can't be
// installed on a supported platform (the usual cause: a lockfile written on one OS that only
// records that OS's optional native packages, so `npm ci` breaks on Windows/Linux).
//
// Fix: delete package-lock.json and node_modules, run `npm install --package-lock-only` TWICE
// (the second pass settles hoisting), then re-run this check.
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

// Validate with the npm the project pins: newer npm releases accept lockfiles that npm 10 rejects.
const pinned = JSON.parse(readFileSync('package.json', 'utf8')).packageManager ?? 'npm@10.9.2'
const npm = pinned.startsWith('npm@') ? pinned : 'npm@10.9.2'

const targets = [
  ['win32', 'x64'], ['win32', 'arm64'],
  ['linux', 'x64'], ['linux', 'arm64'],
  ['darwin', 'x64'], ['darwin', 'arm64'],
]

let failed = false
for (const [os, cpu] of targets) {
  const result = spawnSync(
    'npx', ['--yes', npm, 'ci', '--dry-run', '--ignore-scripts', '--no-audit', '--no-fund', `--os=${os}`, `--cpu=${cpu}`],
    { encoding: 'utf8', shell: process.platform === 'win32' },
  )
  if (result.status === 0) {
    console.log(`ok    ${os}/${cpu}`)
  } else {
    failed = true
    console.error(`FAIL  ${os}/${cpu}\n${(result.stderr || result.stdout).split('\n').filter(l => /Missing|Invalid|EUSAGE|error/i.test(l)).slice(0, 6).join('\n')}`)
  }
}
process.exit(failed ? 1 : 0)
