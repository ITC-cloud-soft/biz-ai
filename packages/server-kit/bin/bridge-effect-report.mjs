#!/usr/bin/env node
// bridge-effect-report --from 2026-11-01 --to 2026-12-01 [--tz Asia/Tokyo] [--json]
//   DATABASE_URL=postgres://… or mysql://… (the business system's database, where the bridge_* tables are). Read only.
//   Dates are calendar days in --tz (default UTC); --to is the first day NOT included. docs/EFFECT_REPORT.md
import { parseArgs } from 'node:util'
import { createPool } from '../src/store/pg.mjs'
import { createMysqlPool } from '../src/store/mysqldb.mjs'
import { effectReportMarkdown, runEffectReport, startOfDayIn } from '../src/effect-report.mjs'

const USAGE = 'usage: DATABASE_URL=postgres://…|mysql://… bridge-effect-report --from YYYY-MM-DD --to YYYY-MM-DD [--tz Asia/Tokyo] [--json]'
let args
try {
  args = parseArgs({ options: { from: { type: 'string' }, to: { type: 'string' }, tz: { type: 'string', default: 'UTC' }, json: { type: 'boolean', default: false }, help: { type: 'boolean', short: 'h' } } }).values
} catch (error) { console.error(`${error.message}\n${USAGE}`); process.exit(2) }
if (args.help) { console.log(USAGE); process.exit(0) }

const url = process.env.DATABASE_URL || ''
if (!args.from || !args.to || !url) { console.error(USAGE); process.exit(2) }
const dialect = /^postgres(ql)?:/.test(url) ? 'postgres' : /^mysql:/.test(url) ? 'mysql' : null
if (!dialect) { console.error('DATABASE_URL must start with postgres:// or mysql://'); process.exit(2) }

let from, to
try {
  from = startOfDayIn(args.from, args.tz)
  to = startOfDayIn(args.to, args.tz)
} catch (error) { console.error(error.message); process.exit(2) }

const pool = dialect === 'postgres' ? await createPool(url, { max: 1 }) : await createMysqlPool(url, { max: 1 })
try {
  const report = await runEffectReport({ dialect, pool, from, to })
  process.stdout.write(args.json ? `${JSON.stringify(report, null, 2)}\n` : effectReportMarkdown(report))
} catch (error) {
  console.error(`effect report failed: ${error.code ?? ''} ${error.message.split('\n')[0]}`) // never the URL
  process.exitCode = 1
} finally {
  await pool.end()
}
