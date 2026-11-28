// The AI effect report: numbers read from the Bridge tables (bridge_*) only — never business tables, names or proposal
// contents. The queries live in sql/effect-report.{postgres,mysql}.sql so that a DBA can run them by hand; this module
// runs the same text. docs/EFFECT_REPORT.md
import { readFileSync } from 'node:fs'
import { isValidDate } from './time.mjs'

export const EFFECT_REPORT_SECTIONS = ['usage', 'proposals_by_kind', 'proposals_by_week', 'notifications_by_type', 'approvals_from_chat', 'reports', 'connector_runs']
const LABELS = new Set(['kind', 'event_type', 'week_start', 'connector_id', 'operation_id'])
const SQL_FILE = { postgres: 'effect-report.postgres.sql', mysql: 'effect-report.mysql.sql' }

/** { name: sql } from the file: each query starts at a `-- name: <name>` line; what comes before the first one is ignored. */
export function effectReportQueries(dialect) {
  if (!SQL_FILE[dialect]) throw new TypeError(`effect report: unknown dialect ${dialect} (postgres | mysql)`)
  const text = readFileSync(new URL(`../sql/${SQL_FILE[dialect]}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n')
  const out = {}
  const parts = text.split(/^-- name: (\w+)\n/m)
  for (let i = 1; i < parts.length; i += 2) out[parts[i]] = parts[i + 1].trim().replace(/;\s*$/, '')
  return out
}

/** The UTC instant at 00:00 of a calendar date in a time zone. */
export function startOfDayIn(date, timeZone = 'UTC') {
  if (!isValidDate(date)) throw new TypeError(`effect report: not a date (YYYY-MM-DD): ${date}`)
  const guess = Date.parse(`${date}T00:00:00Z`)
  const offsetAt = (ms) => {
    const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
      timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
    }).formatToParts(new Date(ms)).map((x) => [x.type, x.value]))
    return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - ms
  }
  let at = guess - offsetAt(guess)
  at = guess - offsetAt(at) // once more across a DST change
  return new Date(at)
}

const toNumber = (v) => (typeof v === 'string' && /^-?\d+(\.\d+)?$/.test(v) ? Number(v) : typeof v === 'bigint' ? Number(v) : v)
const clean = (row) => Object.fromEntries(Object.entries(row).map(([k, v]) => [k, LABELS.has(k) ? (v === null ? null : String(v)) : toNumber(v)]))
const mysqlTime = (d) => d.toISOString().replace('T', ' ').replace('Z', '')

/**
 * Runs every query for [from, to) on one connection.
 *   dialect 'postgres': pool = a pg Pool (createPool); 'mysql': pool = a mysql2/promise pool (createMysqlPool).
 * Returns { dialect, from, to, usage: {…}, proposals_by_kind: [...], … } with counts and rates as numbers.
 */
export async function runEffectReport({ dialect, pool, from, to }) {
  const f = new Date(from), t = new Date(to)
  if (Number.isNaN(f.getTime()) || Number.isNaN(t.getTime()) || !(f < t)) throw new TypeError('effect report: from must be a time before to')
  const queries = effectReportQueries(dialect)
  const out = { dialect, from: f.toISOString(), to: t.toISOString() }
  if (dialect === 'postgres') {
    const client = await pool.connect()
    try {
      await client.query("select set_config('bridge_effect.from_at', $1, false), set_config('bridge_effect.to_at', $2, false)", [out.from, out.to])
      for (const name of EFFECT_REPORT_SECTIONS) out[name] = (await client.query(queries[name])).rows.map(clean)
    } finally { client.release() }
  } else {
    const conn = await pool.getConnection()
    try {
      await conn.query('set @bridge_effect_from = ?, @bridge_effect_to = ?', [mysqlTime(f), mysqlTime(t)])
      for (const name of EFFECT_REPORT_SECTIONS) out[name] = (await conn.query(queries[name]))[0].map(clean)
    } finally { conn.release() }
  }
  out.usage = out.usage[0] ?? {}
  return out
}

// ------------------------------------------------------------------ Markdown (Japanese, for the person who reads it)
const HEAD = {
  kind: '種類', proposals: '提案', from_chat: 'チャットから', automatic: '自動', accepted: '採択', rejected: '却下', pending: '審査待ち',
  adoption_rate: '採択率', median_minutes_to_decide: '決めるまで（中央値・分）', p90_minutes_to_decide: '決めるまで（90%・分）',
  week_start: '週（月曜）', event_type: '通知の種類', deliveries: '件数', sent: '送信', failed: '失敗', undeliverable: '宛先なし',
  skipped: '本人の設定で送らず', delivery_rate: '届いた率', links: 'リンク', approvals: '承認の件', used: '使われた', open: '未使用',
  revoked: '取り消し', locked: 'ロック', use_rate: '使われた率', reports: 'レポート', attention_items: '要対応の件数',
  connector_id: 'コネクタ', operation_id: '操作', runs: '実行', succeeded: '成功', median_duration_ms: '所要（中央値・ms）',
}
const RATE = new Set(['adoption_rate', 'delivery_rate', 'use_rate'])
const cell = (k, v) => (v === null || v === undefined ? '—' : RATE.has(k) ? `${(v * 100).toFixed(1)}%` : String(v))
function table(rows) {
  if (!rows.length) return '（この期間はありません）\n'
  const keys = Object.keys(rows[0])
  return [`| ${keys.map((k) => HEAD[k] ?? k).join(' | ')} |`, `|${keys.map(() => '---').join('|')}|`,
    ...rows.map((r) => `| ${keys.map((k) => cell(k, r[k])).join(' | ')} |`)].join('\n') + '\n'
}

export function effectReportMarkdown(r) {
  const u = r.usage
  return [
    `# AI の効果レポート`, '',
    `期間：${r.from} 〜 ${r.to}（UTC、終わりの時刻は含まない）`, '',
    `## 使っている人`, '',
    `| 連携している人 | 期間中に連携した人 | AI が代わりに読んだ人 | 委任の回数 | イベントで動いた回数 |`, `|---|---|---|---|---|`,
    `| ${u.linked_users ?? 0} | ${u.newly_linked_users ?? 0} | ${u.ai_users ?? 0} | ${u.ai_delegations ?? 0} | ${u.event_delegations ?? 0} |`, '',
    `## AI の提案（種類ごと）`, '', table(r.proposals_by_kind),
    `## AI の提案（週ごと）`, '', table(r.proposals_by_week),
    `## 通知`, '', table(r.notifications_by_type),
    `## チャットからの承認`, '', table(r.approvals_from_chat),
    `## 定期レポート`, '', table(r.reports),
    `## コネクタ`, '', table(r.connector_runs),
    `業務そのものの処理時間・件数は、業務システムの表から取ります（docs/EFFECT_REPORT.md §3）。`, '',
  ].join('\n')
}
