#!/usr/bin/env node
// Publishes the framework packages (@dsh-bridge/*) to npm — the AI-plane plugins, dsh-core, the protocol and the kits.
//
//   node scripts/npm-release.mjs              dry run: packs each package into a temporary folder and checks it (nothing is published)
//   node scripts/npm-release.mjs --publish    publish every package whose version is not on npm yet (npm login first)
//
// Not published: the profile template, the testing harness, the examples and vendor/ (the DSH plugin forks).
// The root LICENSE and NOTICE are copied into each package for the tarball and removed again afterwards.
// `workspace:*` ranges are turned into real versions by pnpm publish.
import { spawnSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const PUBLISH = process.argv.includes('--publish')
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
    const args = PUBLISH ? ['publish', '--access', 'public', '--no-git-checks'] : ['pack', '--pack-destination', OUT, '--json']
    const r = sh('pnpm', args, cwd)
    if (r.status !== 0) { failed++; console.error(`✗ ${pkg.name}\n${(r.stdout + r.stderr).trim()}`); continue }
    if (PUBLISH) { console.log(`+ ${pkg.name}@${pkg.version}`); continue }
    const info = JSON.parse(r.stdout.slice(r.stdout.indexOf('{')))
    const paths = info.files.map((x) => x.path)
    const leaks = paths.filter((p) => /(^|\/)(test|node_modules)\/|(^|\/)\.env/.test(p))
    // the packed package.json must not keep workspace: ranges
    const packed = spawnSync('tar', ['-xOf', info.filename, 'package/package.json'], { encoding: 'utf8' }).stdout
    const workspace = /workspace:/.test(packed)
    console.log(`${leaks.length || workspace ? '!' : '✓'} ${pkg.name}@${pkg.version}  ${paths.length} files${leaks.length ? `  unexpected: ${leaks.join(', ')}` : ''}${workspace ? '  workspace: range left' : ''}`)
    if (leaks.length || workspace) failed++
  } finally {
    for (const f of copied) rmSync(join(cwd, f), { force: true })
  }
}
rmSync(OUT, { recursive: true, force: true })
process.exit(failed ? 1 : 0)
