// bridge-persona speaks the business system's language: the persona section and the signature follow the application's
// manifest (system.locale): ja (no manifest, the default), en, zh. Fictional data only.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { FIXED_RULES, PERSONA_MESSAGES, createApplicationRegistry } from '@dsh-bridge/dsh-core'
import { apply } from '../src/index.js'

const silent = { debug() {}, info() {}, warn() {}, error() {} }

const manifestFor = (id, locale, timezone) => ({
  bridge: 1,
  version: '2026-11-28',
  system: { id, name: id, locale, timezone },
  roles: { staff: { label: 'Staff', scope: 'all', delegation: 'propose' } },
  events: { 'room.booked': { payload: ['roomId'], severity: 'info' } },
  tools: [],
})

function fakeBusiness(profiles) {
  return async (url) => {
    const u = new URL(url)
    const h = new Map([['bridge-protocol', '1'], ['etag', '"p1"']])
    const ok = u.pathname === '/bridge/v1/ai-profile' && u.host in profiles
    return {
      status: ok ? 200 : 404, ok, headers: { get: (k) => h.get(k.toLowerCase()) ?? null },
      text: async () => JSON.stringify(ok ? { ok: true, profile: profiles[u.host], version: 1, updatedAt: null } : { ok: false, error: 'not_found' }),
    }
  }
}

async function setup() {
  const registry = createApplicationRegistry({
    applications: [
      { id: 'room-booking', name: 'Room Booking', apiUrl: 'http://en.test', serviceToken: 'svc', default: true, bots: [{ platform: 'slack', botId: 'BE' }], manifest: manifestFor('room-booking', 'en-US', 'UTC') },
      { id: 'desk-booking', name: '工位预约', apiUrl: 'http://zh.test', serviceToken: 'svc', bots: [{ platform: 'slack', botId: 'BZ' }], manifest: manifestFor('desk-booking', 'zh-CN', 'Asia/Shanghai') },
      { id: 'daily-report', name: '日報', apiUrl: 'http://ja.test', serviceToken: 'svc', bots: [{ platform: 'slack', botId: 'BJ' }] },
    ],
    fetch: fakeBusiness({ 'en.test': { nickname: 'Sam', tone: { preset: 'soft' } }, 'zh.test': { nickname: '小林' }, 'ja.test': { nickname: 'あおい' } }),
    logger: silent,
  })
  await registry.ensureManifests()
  await registry.refreshAiProfiles()
  const contexts = []
  const listeners = new Map()
  const ctx = {
    bridgeApps: registry,
    systemPrompt: { context: (c) => { contexts.push(c); return () => {} } },
    logger: () => silent,
    provide(k, v) { ctx[k] = v },
    on(event, fn) {
      if (!listeners.has(event)) listeners.set(event, new Set())
      listeners.get(event).add(fn)
      return () => listeners.get(event)?.delete(fn)
    },
    emit(event, ...args) { for (const fn of listeners.get(event) ?? []) fn(...args) },
  }
  const service = apply(ctx, {})
  const prompt = (sessionId, botId) => {
    ctx.emit('dsh-im/inbound', { sessionId, source: { platform: 'slack', botId, userId: 'U1' }, text: 'hi' })
    return contexts[0].text({ agent: { session: { id: sessionId } } })
  }
  return { service, prompt }
}

test('en / zh / ja: the persona section and the signature are in the application\'s language', async () => {
  const t = await setup()
  const en = t.prompt('s-en', 'BE')
  assert.ok(en.startsWith('## Rules you always follow (above every setting)'))
  for (const r of PERSONA_MESSAGES.en.rules) assert.ok(en.includes(r))
  assert.match(en, /- Name: Sam \(the AI employee of Room Booking\)\./)
  assert.match(en, /- Tone: Speak in a warm, friendly and polite way, in English\./)
  assert.equal(t.service.signatureFor('room-booking'), '— Sam (Room Booking AI assistant)')

  const zh = t.prompt('s-zh', 'BZ')
  assert.ok(zh.startsWith('## 必须遵守的规则（优先于任何设置）'))
  assert.match(zh, /- 称呼：小林（工位预约的 AI 员工）。/)
  assert.equal(t.service.signatureFor('desk-booking'), '— 小林（工位预约 AI 助理）')

  // no manifest → Japanese, exactly as before
  const ja = t.prompt('s-ja', 'BJ')
  assert.ok(ja.startsWith('## 必ず守る規則（どの設定よりも優先）'))
  for (const r of FIXED_RULES) assert.ok(ja.includes(r))
  assert.match(ja, /- 呼び名：あおい（日報の AI 社員）/)
  assert.equal(t.service.signatureFor('daily-report'), '— あおい（日報 AI 秘書）')
})
