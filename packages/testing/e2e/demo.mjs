#!/usr/bin/env node
// `pnpm demo`: see AI employees at work in about three minutes, on your own machine, with no API key and no real chat account.
//
//   needs: Node 22.19+, pnpm install (done at the root), Docker (for a throwaway PostgreSQL) and the DSH CLI:
//          npm install -g @deepseek-ai/dsh@<the version in profile/template/package.json dshBridge.expectedDsh>
//
// What it runs: the example business system (examples/equipment-inspection, fictional data) + the framework plugins on a
// REAL DeepSeek Harness, with a scripted model and a mock LINE (packages/testing/e2e/run.mjs). At the end it prints the
// conversation — the employees' messages and what the AI employee sent them — and PASS / FAIL per scenario.
//
// PostgreSQL: FW_TEST_DATABASE_URL when set (only its server and credentials are used); otherwise a temporary container
// (postgres:16-alpine on 127.0.0.1:55432, random password) that is removed afterwards. Extra arguments go to run.mjs.
import { spawn, spawnSync } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { resolveDshBin } from '../../gateway/src/index.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const FRAMEWORK = resolve(here, '..', '..', '..')
const expected = JSON.parse(readFileSync(join(FRAMEWORK, 'profile', 'template', 'package.json'), 'utf8')).dshBridge.expectedDsh
const CONTAINER = 'biz-ai-demo-pg'
const PG_PORT = Number(process.env.FW_DEMO_PG_PORT || 55432)

const fail = (message) => { console.error(`\n✗ ${message}\n`); process.exit(2) }
const run = (cmd, args) => spawnSync(cmd, args, { encoding: 'utf8', shell: false })

// 1. prerequisites, each with the command that fixes it
const [major, minor] = process.versions.node.split('.').map(Number)
if (major < 22 || (major === 22 && minor < 19)) fail(`Node ${process.versions.node}: Node 22.19 or later is needed`)
const dsh = resolveDshBin()
if (!dsh) fail(`the DSH CLI is not installed:\n  npm install -g @deepseek-ai/dsh@${expected}`)
const version = (run(process.execPath, [dsh, '--version']).stdout ?? '').trim().split(/\r?\n/).pop()
if (version && version !== expected) console.warn(`! DSH ${version} found; this framework is tested with ${expected} (npm install -g @deepseek-ai/dsh@${expected})`)

let url = process.env.FW_TEST_DATABASE_URL
let started = false
function stopContainer() {
  if (started) { run('docker', ['rm', '-f', CONTAINER]); started = false }
}
if (!url) {
  if (run('docker', ['version', '--format', '{{.Server.Version}}']).status !== 0) {
    fail('Docker is not running. Start Docker, or set FW_TEST_DATABASE_URL=postgres://<user>:<password>@127.0.0.1:5432/postgres')
  }
  run('docker', ['rm', '-f', CONTAINER])
  const password = randomBytes(16).toString('hex')
  console.log(`• PostgreSQL: temporary container ${CONTAINER} on 127.0.0.1:${PG_PORT}`)
  const r = run('docker', ['run', '--rm', '-d', '--name', CONTAINER, '-p', `127.0.0.1:${PG_PORT}:5432`, '-e', `POSTGRES_PASSWORD=${password}`, 'postgres:16-alpine'])
  if (r.status !== 0) fail(`docker run failed: ${(r.stderr || r.stdout).trim()}`)
  started = true
  for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => { stopContainer(); process.exit(130) })
  let ready = false
  for (let i = 0; i < 60 && !ready; i++) {
    ready = run('docker', ['exec', CONTAINER, 'pg_isready', '-U', 'postgres', '-h', '127.0.0.1']).status === 0
    if (!ready) await new Promise((r) => setTimeout(r, 1000))
  }
  if (!ready) { stopContainer(); fail('PostgreSQL did not become ready in 60 s') }
  url = `postgres://postgres:${password}@127.0.0.1:${PG_PORT}/postgres`
}

// 2. the end-to-end run with the conversation printed at the end
console.log(`• DSH ${version || '(version unknown)'} · scripted model · mock LINE · fictional data — about 2–3 minutes\n`)
const child = spawn(process.execPath, [join(here, 'run.mjs'), '--story', ...process.argv.slice(2)], {
  cwd: FRAMEWORK, stdio: 'inherit', env: { ...process.env, FW_TEST_DATABASE_URL: url },
})
const code = await new Promise((r) => child.on('exit', (c) => r(c ?? 1)))
stopContainer()
if (code === 0) {
  console.log('\nNext: docs/GUIDELINE.en.md (connect your own system) · docs/skill/biz-assistant-integration (let a coding agent do it)')
}
process.exit(code)
