// The AI effect report (sql/effect-report.*.sql, src/effect-report.mjs): the same rows give the same numbers on PostgreSQL
// and MySQL / TiDB. Each database is its own temporary one (fw_effect_test), created here and dropped at the end.
//   FW_TEST_DATABASE_URL=postgres://…  FW_TEST_MYSQL_URL=mysql://…   Unset: that database is skipped with a message.
import { after, before, describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import {
  createMysqlPool, createMysqlStore, createPool, createPostgresStore, dropDatabase, dropMysqlDatabase, ensureDatabase, ensureMysqlDatabase,
  splitSqlStatements, EFFECT_REPORT_SECTIONS, effectReportMarkdown, effectReportQueries, runEffectReport, startOfDayIn,
} from '../src/index.mjs'

const FROM = new Date('2026-11-01T00:00:00Z')
const TO = new Date('2026-12-01T00:00:00Z')
const at = (s) => new Date(`${s}Z`)
const plus = (d, minutes) => new Date(d.getTime() + minutes * 60_000)

test('effect report: both files have the same queries; dates in a time zone', () => {
  const pg = effectReportQueries('postgres'), my = effectReportQueries('mysql')
  assert.deepEqual(Object.keys(pg), EFFECT_REPORT_SECTIONS)
  assert.deepEqual(Object.keys(my), EFFECT_REPORT_SECTIONS)
  for (const sql of [...Object.values(pg), ...Object.values(my)]) {
    assert.doesNotMatch(sql, /\bpayload\b|\bcomment\b|\bsections\b/, 'never reads contents')
    assert.match(sql, /^-- /, 'each query keeps its explanation')
  }
  assert.throws(() => effectReportQueries('sqlite'), /unknown dialect/)
  assert.equal(startOfDayIn('2026-11-01', 'Asia/Tokyo').toISOString(), '2026-10-31T15:00:00.000Z')
  assert.equal(startOfDayIn('2026-11-01').toISOString(), '2026-11-01T00:00:00.000Z')
  assert.equal(startOfDayIn('2026-03-09', 'America/New_York').toISOString(), '2026-03-09T04:00:00.000Z') // after the DST change
  assert.throws(() => startOfDayIn('2026-02-30', 'UTC'), /not a date/)
})

test('effect report: Markdown with empty sections', () => {
  const empty = { dialect: 'postgres', from: FROM.toISOString(), to: TO.toISOString(), usage: {} }
  for (const s of EFFECT_REPORT_SECTIONS.slice(1)) empty[s] = []
  const md = effectReportMarkdown(empty)
  assert.match(md, /# AI の効果レポート/)
  assert.match(md, /（この期間はありません）/)
})

// ------------------------------------------------------------------ the same rows on each database
async function seed(exec) {
  const ids = { u1: randomUUID(), u2: randomUUID(), u3: randomUUID(), u4: randomUUID() }
  const identity = (key, user, created, unlinked = null) => exec(
    'insert into bridge_identity (id, user_id, platform, team_id, external_id, verified_at, created_at, unlinked_at) values (?, ?, ?, ?, ?, ?, ?, ?)',
    [ids[key], user, 'line', '', `ext-${key}`, at(created), at(created), unlinked && at(unlinked)])
  await identity('u1', 'u1', '2026-10-01 09:00:00')
  await identity('u2', 'u2', '2026-11-05 09:00:00')
  await identity('u3', 'u3', '2026-10-01 09:00:00', '2026-11-10 09:00:00') // unlinked during the period
  await identity('u4', 'u4', '2026-12-05 09:00:00') // after the period

  const event = (id, type, created) => exec(
    'insert into bridge_event (id, event_type, aggregate_type, aggregate_id, payload, created_at) values (?, ?, ?, ?, ?, ?)',
    [id, type, 'request', String(id), '{}', at(created)])
  await event(1, 'request.decided', '2026-11-02 10:00:00')
  await event(2, 'request.decided', '2026-11-05 10:00:00')
  await event(3, 'approval.requested', '2026-11-06 10:00:00')
  await event(4, 'request.decided', '2026-10-25 10:00:00') // before

  const delegation = (user, created, sourceEventId = null) => exec(
    'insert into bridge_delegation (id, token_hash, user_id, identity_id, created_at, expires_at, source_event_id) values (?, ?, ?, ?, ?, ?, ?)',
    [randomUUID(), randomUUID(), user, ids[user], at(created), plus(at(created), 5), sourceEventId])
  await delegation('u1', '2026-11-02 09:00:00')
  await delegation('u1', '2026-11-02 11:00:00')
  await delegation('u1', '2026-11-20 09:00:00')
  await delegation('u2', '2026-11-06 09:00:00')
  await delegation('u1', '2026-11-02 10:01:00', 1) // an automatic task on event 1
  await delegation('u2', '2026-10-20 09:00:00') // before

  const proposal = (kind, status, via, created, minutes = null) => exec(
    'insert into bridge_proposal (id, kind, payload, status, created_via, created_at, decided_by, decided_at) values (?, ?, ?, ?, ?, ?, ?, ?)',
    [randomUUID(), kind, '{}', status, via, at(created), minutes === null ? null : 'mgr', minutes === null ? null : plus(at(created), minutes)])
  await proposal('request_withdraw', 'accepted', 'delegation', '2026-11-02 10:00:00', 10)
  await proposal('request_withdraw', 'accepted', 'delegation', '2026-11-03 10:00:00', 20)
  await proposal('request_withdraw', 'rejected', 'service', '2026-11-04 10:00:00', 30)
  await proposal('request_withdraw', 'pending_review', 'delegation', '2026-11-10 10:00:00')
  await proposal('approval_reminder', 'accepted', 'service', '2026-11-10 10:00:00', 60)
  await proposal('approval_reminder', 'rejected', 'delegation', '2026-11-11 10:00:00', 5)
  await proposal('request_withdraw', 'accepted', 'delegation', '2026-10-30 10:00:00', 1) // before

  const delivery = (eventId, user, status) => exec('insert into bridge_delivery (event_id, user_id, status) values (?, ?, ?)', [eventId, user, status])
  await delivery(1, 'u1', 'sent')
  await delivery(1, 'u2', 'skipped')
  await delivery(2, 'u1', 'failed')
  await delivery(2, 'u2', 'sent')
  await delivery(3, 'u1', 'undeliverable')
  await delivery(4, 'u1', 'sent') // event before the period

  const approval = (approvalId, user, status, created) => exec(
    'insert into bridge_approval_delivery (id, approval_id, user_id, identity_id, token_hash, status, expires_at, created_at) values (?, ?, ?, ?, ?, ?, ?, ?)',
    [randomUUID(), approvalId, user, ids[user], randomUUID(), status, plus(at(created), 60 * 24), at(created)])
  await approval('A1', 'u1', 'used', '2026-11-03 09:00:00')
  await approval('A1', 'u2', 'revoked', '2026-11-03 09:00:00')
  await approval('A2', 'u1', 'issued', '2026-11-04 09:00:00')
  await approval('A0', 'u1', 'used', '2026-10-30 09:00:00') // before

  const report = (kind, date, attention, test, generated) => exec(
    'insert into bridge_report (id, kind, report_date, slot, sections, attention, test, generated_at) values (?, ?, ?, ?, ?, ?, ?, ?)',
    [randomUUID(), kind, date, '09:00', '[]', attention, test, at(generated)])
  await report('daily', '2026-11-02', 2, false, '2026-11-02 00:00:00')
  await report('daily', '2026-11-03', 0, false, '2026-11-03 00:00:00')
  await report('weekly', '2026-11-09', 1, false, '2026-11-09 00:00:00')
  await report('daily', '2026-11-04', 5, true, '2026-11-04 03:00:00') // a test send
  await report('daily', '2026-10-31', 3, false, '2026-10-31 00:00:00') // before

  const run = (status, ms, created) => exec(
    'insert into bridge_connector_run (connector_id, operation_id, trigger_kind, status, duration_ms, created_at) values (?, ?, ?, ?, ?, ?)',
    ['crm', 'get_customer', 'manual', status, ms, at(created)])
  await run('succeeded', 100, '2026-11-02 09:00:00')
  await run('succeeded', 300, '2026-11-03 09:00:00')
  await run('failed', 200, '2026-11-04 09:00:00')
  await run('succeeded', 999, '2026-10-30 09:00:00') // before
}

const EXPECTED = {
  usage: { linked_users: 2, newly_linked_users: 1, ai_users: 2, ai_delegations: 4, event_delegations: 1 },
  proposals_by_kind: [
    { kind: 'approval_reminder', proposals: 2, from_chat: 1, automatic: 1, accepted: 1, rejected: 1, pending: 0, adoption_rate: 0.5, median_minutes_to_decide: 32.5, p90_minutes_to_decide: 60 },
    { kind: 'request_withdraw', proposals: 4, from_chat: 3, automatic: 1, accepted: 2, rejected: 1, pending: 1, adoption_rate: 0.667, median_minutes_to_decide: 20, p90_minutes_to_decide: 30 },
    { kind: '(all)', proposals: 6, from_chat: 4, automatic: 2, accepted: 3, rejected: 2, pending: 1, adoption_rate: 0.6, median_minutes_to_decide: 20, p90_minutes_to_decide: 60 },
  ],
  proposals_by_week: [
    { week_start: '2026-11-02', proposals: 3, accepted: 2, rejected: 1, pending: 0, adoption_rate: 0.667, median_minutes_to_decide: 20 },
    { week_start: '2026-11-09', proposals: 3, accepted: 1, rejected: 1, pending: 1, adoption_rate: 0.5, median_minutes_to_decide: 32.5 },
  ],
  notifications_by_type: [
    { event_type: 'approval.requested', deliveries: 1, sent: 0, failed: 0, undeliverable: 1, skipped: 0, pending: 0, delivery_rate: 0 },
    { event_type: 'request.decided', deliveries: 4, sent: 2, failed: 1, undeliverable: 0, skipped: 1, pending: 0, delivery_rate: 0.667 },
    { event_type: '(all)', deliveries: 5, sent: 2, failed: 1, undeliverable: 1, skipped: 1, pending: 0, delivery_rate: 0.5 },
  ],
  approvals_from_chat: [{ links: 3, approvals: 2, used: 1, open: 1, revoked: 1, locked: 0, use_rate: 0.333 }],
  reports: [
    { kind: 'daily', reports: 2, attention_items: 2 },
    { kind: 'weekly', reports: 1, attention_items: 1 },
  ],
  connector_runs: [{ connector_id: 'crm', operation_id: 'get_customer', runs: 3, succeeded: 2, failed: 1, median_duration_ms: 200 }],
}

function checkReport(r) {
  for (const s of EFFECT_REPORT_SECTIONS) assert.deepEqual(r[s], EXPECTED[s], s)
  const md = effectReportMarkdown(r)
  assert.match(md, /\| request_withdraw \| 4 \| 3 \| 1 \| 2 \| 1 \| 1 \| 66\.7% \| 20 \| 30 \|/)
  assert.match(md, /\| 2 \| 1 \| 2 \| 4 \| 1 \|/)
}

const DATABASES = [
  {
    name: 'postgres', env: 'FW_TEST_DATABASE_URL',
    async open(url) {
      await dropDatabase(url).catch(() => {})
      await ensureDatabase(url)
      const pool = await createPool(url)
      const store = createPostgresStore({ pool })
      await store.migrate()
      let n
      const exec = (sql, params) => { n = 0; return pool.query(sql.replace(/\?/g, () => `$${++n}`), params) }
      return { pool, exec, close: async () => { await store.close(); await dropDatabase(url) } }
    },
  },
  {
    name: 'mysql', env: 'FW_TEST_MYSQL_URL',
    async open(url) {
      await dropMysqlDatabase(url).catch(() => {})
      await ensureMysqlDatabase(url)
      const pool = await createMysqlPool(url, { max: 3 })
      const store = createMysqlStore({ pool })
      await store.migrate()
      const exec = (sql, params) => pool.query(sql, params)
      return { pool, exec, close: async () => { await store.close(); await dropMysqlDatabase(url) } }
    },
  },
]

for (const d of DATABASES) {
  const server = process.env[d.env] || ''
  const url = server ? Object.assign(new URL(server), { pathname: '/fw_effect_test' }).toString() : ''
  let db = null
  let unavailable = server ? null : `${d.env} is not set: effect report on ${d.name} skipped`
  if (!unavailable) try { db = await d.open(url) } catch (error) { unavailable = `${d.name} not reachable (${error.code ?? error.message.split('\n')[0]})` }
  if (unavailable) { test(`effect report on ${d.name}`, { skip: unavailable }, () => {}); continue }

  describe(`effect report on ${d.name}`, () => {
    before(async () => { await seed(db.exec) })
    after(async () => { await db.close() })

    test('the numbers for the period', async () => {
      checkReport(await runEffectReport({ dialect: d.name, pool: db.pool, from: FROM, to: TO }))
    })

    test('an empty period gives zeros and no rows, not errors', async () => {
      const r = await runEffectReport({ dialect: d.name, pool: db.pool, from: at('2030-01-01 00:00:00'), to: at('2030-02-01 00:00:00') })
      assert.deepEqual(r.usage, { linked_users: 3, newly_linked_users: 0, ai_users: 0, ai_delegations: 0, event_delegations: 0 }) // u1, u2, u4
      for (const s of ['proposals_by_week', 'reports', 'connector_runs']) assert.deepEqual(r[s], [], s)
      assert.deepEqual(r.approvals_from_chat, [{ links: 0, approvals: 0, used: 0, open: 0, revoked: 0, locked: 0, use_rate: null }])
      for (const s of ['proposals_by_kind', 'notifications_by_type']) assert.deepEqual(r[s], [], s)
    })

    test('the file runs as it is, with its own SET lines (the way a person runs it)', async () => {
      // the example period in the file is the same as FROM / TO
      const text = readFileSync(new URL(`../sql/effect-report.${d.name}.sql`, import.meta.url), 'utf8')
      const rows = []
      if (d.name === 'postgres') {
        const client = await db.pool.connect()
        try { for (const r of await client.query(text)) if (r.command === 'SELECT') rows.push(r.rows) } finally { client.release() }
      } else {
        const conn = await db.pool.getConnection()
        try { for (const sql of splitSqlStatements(text)) { const [r] = await conn.query(sql); if (Array.isArray(r)) rows.push(r) } } finally { conn.release() }
      }
      assert.equal(rows.length, EFFECT_REPORT_SECTIONS.length)
      assert.deepEqual(Object.fromEntries(Object.entries(rows[0][0]).map(([k, v]) => [k, Number(v)])), EXPECTED.usage)
      assert.equal(rows[1].length, 3)
    })

    test('from must be before to', async () => {
      await assert.rejects(runEffectReport({ dialect: d.name, pool: db.pool, from: TO, to: FROM }), /before to/)
    })
  })
}
