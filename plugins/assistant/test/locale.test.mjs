// What the assistant panel shows is in the business system's language (its manifest's system.locale): the default AI
// employee's name and description, the default question for files only, the errors of a turn and the DSH session title.
// ja (no manifest) stays exactly as before. Fictional data only.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createApplicationRegistry } from '@dsh-bridge/dsh-core'
import { DEFAULT_AGENTS, DEFAULT_ATTACHMENT_TEXT, MESSAGES, createAssistantService, sessionTitle } from '../src/service.js'
import { mockHarness, startFakeApi } from './helpers.mjs'

const TICKET = `tkt_${'l'.repeat(43)}`
const silent = { warn() {}, info() {}, debug() {} }
const DOC = { kind: 'document', name: 'quote.csv', kind2: 'csv', text: 'item,qty\nchair,2', truncated: false }

const manifestFor = (id, locale, timezone) => ({
  bridge: 1,
  version: '2026-11-28',
  system: { id, name: id, locale, timezone },
  roles: { staff: { label: 'Staff', scope: 'all', delegation: 'propose' } },
  events: { 'room.booked': { payload: ['roomId'], severity: 'info' } },
  tools: [],
})

async function setup() {
  const api = await startFakeApi((req) => {
    if (req.path === '/bridge/v1/assistant/delegations' && req.method === 'POST' && req.body?.ticket === TICKET) {
      return { status: 201, body: { token: 'dlg-1', user: { id: 'user-0001-xxxx', role: 'staff' }, expiresAt: new Date(Date.now() + 300_000).toISOString() } }
    }
    return { status: 404, body: { error: 'not_found' } }
  })
  const registry = createApplicationRegistry({
    logger: silent,
    applications: [
      { id: 'room-booking', name: 'Room Booking', default: true, apiUrl: api.url, serviceToken: 'svc', manifest: manifestFor('room-booking', 'en-US', 'UTC') },
      { id: 'desk-booking', name: '工位预约', apiUrl: api.url, serviceToken: 'svc', manifest: manifestFor('desk-booking', 'zh-CN', 'Asia/Shanghai') },
      { id: 'daily-report', name: '日報', apiUrl: api.url, serviceToken: 'svc' },
    ],
  })
  await registry.ensureManifests()
  const harness = mockHarness()
  const service = createAssistantService({
    registry,
    harness,
    logger: silent,
    agents: () => [
      { ...DEFAULT_AGENTS[0] },
      { ...DEFAULT_AGENTS[0], application: 'desk-booking' },
      { ...DEFAULT_AGENTS[0], application: 'daily-report' },
    ],
  })
  harness.onEvent((sessionId, event) => service.onSessionEvent(sessionId, event))
  return { api, harness, service, close: () => api.close() }
}

test('en: the default AI employee, the files-only question, the session title and the errors are English', async () => {
  const env = await setup()
  try {
    const list = await env.service.handleRpc('agents.list', { ticket: TICKET })
    assert.deepEqual([list.value.agents[0].name, list.value.agents[0].description], [MESSAGES.en.agents.assistant.name, MESSAGES.en.agents.assistant.description])
    assert.equal(list.value.agents[0].name, 'AI assistant')
    const sent = await env.service.handleRpc('message.send', { ticket: TICKET, agent: 'assistant', text: '', attachments: [DOC] })
    assert.equal(sent.ok, true, JSON.stringify(sent))
    assert.equal(env.harness.state.created[0].title, 'AI assistant (Room Booking, employee user-000)')
    assert.ok(env.harness.state.prompts.at(-1).text.startsWith('Please explain the attached files.'))
    await env.service.handleRpc('message.cancel', { ticket: TICKET, agent: 'assistant' })
    const conv = await env.service.handleRpc('conversation.get', { ticket: TICKET, agent: 'assistant' })
    assert.deepEqual(conv.value.messages.map((m) => [m.role, m.text]), [['user', 'Please explain the attached files.'], ['error', 'The answer was stopped.']])
  } finally {
    await env.close()
  }
})

test('zh: Chinese; ja (no manifest): exactly the Japanese texts', async () => {
  const env = await setup()
  try {
    const zh = await env.service.handleRpc('agents.list', { ticket: TICKET, application: 'desk-booking' })
    assert.equal(zh.value.agents[0].name, 'AI 助理')
    const sent = await env.service.handleRpc('message.send', { ticket: TICKET, agent: 'assistant', application: 'desk-booking', text: 'hi' })
    assert.equal(sent.ok, true, JSON.stringify(sent))
    const sessionId = env.harness.state.created.at(-1).sessionId
    const turn = env.harness.startTurn(sessionId, env.harness.state.prompts.at(-1).requestId)
    env.harness.endTurn(sessionId, turn, { kind: 'error' })
    const conv = await env.service.handleRpc('conversation.get', { ticket: TICKET, agent: 'assistant', application: 'desk-booking' })
    assert.equal(conv.value.messages.at(-1).text, 'AI 的处理中途结束了。请再试一次。')

    const ja = await env.service.handleRpc('agents.list', { ticket: TICKET, application: 'daily-report' })
    assert.deepEqual([ja.value.agents[0].name, ja.value.agents[0].description], ['AI アシスタント', '業務の質問に、あなたの権限の範囲で答えます。確定・承認はしません。'])
    assert.equal(DEFAULT_ATTACHMENT_TEXT, '添付した資料について説明してください。')
    assert.equal(sessionTitle({}, { name: '日報' }, { id: 'abcdefghij' }), 'AIアシスタント（日報・職員 abcdefgh）')
  } finally {
    await env.close()
  }
})
