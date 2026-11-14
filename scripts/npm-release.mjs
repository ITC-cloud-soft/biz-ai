#!/usr/bin/env node
// Publishes the framework packages (@dsh-bridge/*) to npm — the AI-plane plugins, dsh-core, the protocol and the kits.
//
//   node scripts/npm-release.mjs              dry run: packs each package into a temporary folder and checks it (nothing is published)
//   node scripts/npm-release.mjs --publish    publish every package whose version is not on npm yet (npm login first)
//   node scripts/npm-release.mjs --publish --auth-type=web
//                                             the same, confirming the second factor in the browser (npm needs 2FA to publish);
//                                             run it in your own terminal so npm can ask
//
// Not published: the profile template, the testing harness, the examples and vendor/ (the DSH plugin forks).
// The root LICENSE and NOTICE are copied into each package for the tarball and removed again afterwards.
// pnpm pack turns `workspace:*` ranges into real versions; npm publish uploads the checked tarball.
import { spawnSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const PUBLISH = process.argv.includes('--publish')
// passed on to npm publish, e.g. --auth-type=web (confirm the second factor in the browser) or --otp=123456
const EXTRA = process.argv.slice(2).filter((a) => /^--(auth-type|otp)=/.test(a))
// dependency order: the protocol first, then dsh-core, then everything that needs them
export const PACKAGES = [
  'packages/protocol', 'packages/dsh-core', 'packages/gateway', 'packages/help', 'packages/server-kit', 'packages/telemetry', 'packages/web-kit',
  'plugins/identity', 'plugins/tools', 'plugins/events', 'plugins/notify', 'plugins/approvals', 'plugins/assistant', 'plugins/memory',
  'plugins/persona', 'plugins/reader',
]

const sh = (cmd, args, cwd) => spawnSync(cmd, args, { cwd, encoding: 'utf8', shell: process.platform === 'win32' })
const published = (name, version) => sh('npm', ['view', `${name}@${version}`, 'version'], ROOT).stdout.trim() === version

if (PUBLISH && sh('npm', ['whoami'], ROOT).status !== 0) {
  console.error('npm login first (the account must be able to publish to the @dsh-bridge scope)')
  process.exit(2)
}
if (PUBLISH) {
  // npm refuses to publish (403) from an account without two-factor authentication: say so once instead of 16 times
  let tfa = null
  try { tfa = JSON.parse(sh('npm', ['profile', 'get', '--json'], ROOT).stdout).tfa } catch { /* unknown: let npm decide */ }
  if (tfa === false) {
    console.error('npm needs two-factor authentication to publish. Turn it on first: npmjs.com → your avatar → Account → Two-Factor Authentication.')
    process.exit(2)
  }
}
let failed = 0
const OUT = mkdtempSync(join(tmpdir(), 'biz-ai-pack-'))
for (const dir of PACKAGES) {
  const cwd = join(ROOT, dir)
  const pkg = JSON.parse(readFileSync(join(cwd, 'package.json'), 'utf8'))
  if (pkg.private) { console.error(`${pkg.name}: private`); failed++; continue }
  if (PUBLISH && published(pkg.name, pkg.version)) { console.log(`= ${pkg.name}@${pkg.version} (already on npm)`); continue }
  const copied = []
  for (const f of ['LICENSE', 'NOTICE']) if (!existsSync(join(cwd, f))) { copyFileSync(join(ROOT, f), join(cwd, f)); copied.push(f) }
  try {
    // pnpm packs (it turns workspace: ranges into versions); npm publishes the checked tarball
    const r = sh('pnpm', ['pack', '--pack-destination', OUT, '--json'], cwd)
    if (r.status !== 0) { failed++; console.error(`✗ ${pkg.name}\n${(r.stdout + r.stderr).trim()}`); continue }
    const info = JSON.parse(r.stdout.slice(r.stdout.indexOf('{')))
    const paths = info.files.map((x) => x.path)
    const leaks = paths.filter((p) => /(^|\/)(test|node_modules)\/|(^|\/)\.env/.test(p))
    // the packed package.json must not keep workspace: ranges
    const packed = spawnSync('tar', ['-xOf', info.filename, 'package/package.json'], { encoding: 'utf8' }).stdout
    const workspace = /workspace:/.test(packed)
    console.log(`${leaks.length || workspace ? '!' : '✓'} ${pkg.name}@${pkg.version}  ${paths.length} files${leaks.length ? `  unexpected: ${leaks.join(', ')}` : ''}${workspace ? '  workspace: range left' : ''}`)
    if (leaks.length || workspace) { failed++; continue }
    if (PUBLISH) {
      // in the terminal: npm may ask for the second factor (a code, or the browser with --auth-type=web)
      const p = spawnSync('npm', ['publish', info.filename, '--access', 'public', ...EXTRA], { cwd: ROOT, stdio: 'inherit', shell: process.platform === 'win32' })
      if (p.status !== 0) {
        // stop at the first refusal (the rest would fail the same way); a rerun skips what is already on npm
        console.error(`✗ ${pkg.name} (npm publish) — stopped; fix the cause above and run the same command again`)
        failed++
        break
      }
      console.log(`+ ${pkg.name}@${pkg.version}`)
    }
  } finally {
    for (const f of copied) rmSync(join(cwd, f), { force: true })
  }
}
rmSync(OUT, { recursive: true, force: true })
process.exit(failed ? 1 : 0)
