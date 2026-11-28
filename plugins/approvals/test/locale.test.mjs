// The approval card and the replies in the business system's language (its manifest's system.locale / system.timezone):
// en / zh, and ja without a manifest (unchanged). Fictional data.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { BridgeApiError, createApplicationRegistry } from '@dsh-bridge/dsh-core'
import { ALL_REPLY_WORDS, MESSAGES, MSG, configuredReplyWords, createApprovalsIm, decisionErrorMessage, messagesFor, replyMatcher } from '../src/index.js'
import { makeSource, mockDshIm, startFakeApi } from './helpers.mjs'

const silent = { debug() {}, info() {}, warn() {}, error() {} }
const NOW = Date.parse('2026-11-28T14:00:00Z') // 14:00 UTC = 23:00 in Tokyo
const EXPIRES = '2026-11-30T09:30:00Z'

function memoryTable() {
  const map = new Map()
  return { get: (k) => map.get(k), entries: () => map.entries(), put: async (k, v) => { map.set(k, v) }, delete: async (k) => map.delete(k) }
}

/** The registry with its one application answering `manifest()` with the given system (null = no manifest). */
function withManifest(registry, system) {
  const app = registry.default()
  const proxied = system ? new Proxy(app, { get: (t, k) => (k === 'manifest' ? () => ({ system }) : t[k]) }) : app
  const wrap = (x) => (x === app ? proxied : Array.isArray(x) ? x.map(wrap) : x)
  return new Proxy(registry, { get: (t, k) => (typeof t[k] === 'function' ? (...a) => wrap(t[k](...a)) : t[k]) })
}

async function setup(system, { replyWords } = {}) {
  const decisions = []
  const api = await startFakeApi((req) => {
    if (/^\/bridge\/v1\/approvals\/[^/]+\/deliveries$/.test(req.path) && req.method === 'POST') {
      return {
        body: {
          ok: true,
          deliveries: [{
            deliveryId: 'd1', user: { id: 'e1' }, identity: { platform: 'slack', teamId: 'T1', externalId: 'U1', botId: 'B1' },
            token: 'cat_d1', replyCode: '123456', expiresAt: EXPIRES,
            card: { title: 'Purchase request', fields: [{ label: 'Request', value: 'PR-1042' }], body: 'Details are in the web app.' },
          }],
        },
      }
    }
    if (/\/sent$/.test(req.path)) return { body: { ok: true } }
    if (req.path === '/bridge/v1/approvals/im-decisions') {
      decisions.push(req.body)
      if (req.body.replyCode === '999999') return { status: 400, body: { error: 'invalid_reply_code', remainingAttempts: 2 } }
      return { body: { ok: true, approval: { id: 'apv-1', status: req.body.action === 'approve' ? 'executed' : 'rejected' } } }
    }
    if (/\/im-decision$/.test(req.path)) {
      decisions.push(req.body)
      return { body: { ok: true, approval: { id: 'apv-1', status: req.body.action === 'approve' ? 'executed' : 'rejected' } } }
    }
    return { status: 404, body: { error: 'not_found' } }
  })
  const base = createApplicationRegistry({
    logger: silent,
    applications: [{ id: 'purchase-requests', name: 'Purchase Requests', default: true, apiUrl: api.url, serviceToken: 'svc' }],
  })
  const registry = withManifest(base, system)
  const im = mockDshIm()
  const core = createApprovalsIm({
    registry, dshIm: im.dshIm, table: memoryTable(), logger: silent, platformPriority: () => ['slack'], now: () => NOW,
    webUrl: () => 'https://purchase.example.test/approvals/{id}', ...(replyWords ? { replyWords: () => replyWords } : {}),
  })
  await core.handleEvent({ id: 1, type: 'approval.requested', aggregateId: 'apv-1', payload: { expiresAt: EXPIRES } })
  return { api, im, core, decisions }
}

const user = (o = {}) => makeSource({ platform: 'slack', botId: 'B1', teamId: 'T1', userId: 'U1', ...o })
async function reply(core, text, source = user()) {
  const out = []
  await core.handleReply({ text, source, reply: async (t) => { out.push(t) } })
  return out
}
async function press(core, actionId, source = user(), extra = {}) {
  const out = []
  await core.handleAction({ actionId, value: '', source, messageRef: 'ref-1', respond: async (t) => { out.push(t) }, ...extra })
  return out
}

test('en (manifest en-US, UTC): the request card, its footer and the reply-code words are English', async () => {
  const { api, im, core } = await setup({ locale: 'en-US', timezone: 'UTC' })
  try {
    const card = im.state.sent[0].card
    assert.equal(card.title, '[For your approval] Purchase request')
    assert.deepEqual(card.body.split('\n'), [
      'Good afternoon. Your approval is requested: Purchase request.',
      '▶ What I\'d like you to do (due 11/30 09:30): check the details and choose “Approve” or “Reject”.',
      '• Approve: confirms it as it is',
      '• Reject: sends it back to the requester with your reason',
      'For reference: Details are in the web app.',
    ])
    assert.deepEqual(card.actions.map((a) => a.label), ['Approve', 'Reject'])
    assert.deepEqual(card.actions[1].input, { label: 'Reason for sending back', placeholder: 'e.g. Please check the amount' })
    assert.equal(card.footer, 'Reply in text: “Approve 123456” / “Reject 123456 reason”\n— Purchase Requests AI assistant')
    assert.equal(card.link.label, 'View details in the web app')
    // a text reply in English words, and the reason prompt
    assert.equal(core.matchesReply('approve 123456'), true)
    assert.deepEqual(await reply(core, 'Reject 123456'), [MESSAGES.en.reasonRequired('123456', { approve: ['Approve'], reject: ['Reject'] })])
    assert.match(MESSAGES.en.reasonRequired('123456'), /^A reason is needed/)
    assert.deepEqual(await reply(core, 'approve 999999'), ['The reply code is not correct. (2 attempts left)'])
    assert.deepEqual(await reply(core, 'Approve 123456'), [MESSAGES.en.approved])
    // the card updated with the decision
    const updated = im.state.updated.at(-1).card
    assert.equal(updated.title, '[FYI] Purchase request (Approved)')
    assert.equal(updated.body, 'This approval request was approved. No action needed.')
    assert.equal(updated.footer, 'Status: approved\n— Purchase Requests AI assistant')
    assert.deepEqual(await press(core, 'bridge_approval:approve:d1'), [MESSAGES.en.finished.approved])
  } finally {
    await api.close()
  }
})

test('zh (manifest zh-CN, Asia/Shanghai): the request card and the replies are Chinese; Chinese reply words work', async () => {
  const { api, im, core, decisions } = await setup({ locale: 'zh-CN', timezone: 'Asia/Shanghai' })
  try {
    const card = im.state.sent[0].card
    assert.equal(card.title, '【请审批】Purchase request')
    const lines = card.body.split('\n')
    assert.equal(lines[0], '抱歉这么晚打扰您。请审批这份Purchase request。') // 22:00 in Shanghai
    assert.equal(lines[1], '▶ 需要您做的（截止 11/30 17:30）：确认内容后，选择「批准」或「驳回」。')
    assert.deepEqual(card.actions.map((a) => a.label), ['批准', '驳回'])
    assert.equal(card.footer, '文字回复：「批准 123456」／「驳回 123456 理由」\n— Purchase Requests AI 助理')
    // the reject button without an input field asks for the reason; 「取消」 cancels
    assert.deepEqual(await press(core, 'bridge_approval:reject:d1', user(), { openReasonDialog: undefined }), [MESSAGES.zh.askReason('123456', { approve: ['批准'], reject: ['驳回'] })])
    assert.deepEqual(await reply(core, '取消'), [MESSAGES.zh.reasonCancelled])
    assert.deepEqual(await reply(core, '驳回 123456 请确认金额'), [MESSAGES.zh.rejected])
    assert.equal(decisions.at(-1).comment, '请确认金额')
    const updated = im.state.updated.at(-1).card
    assert.equal(updated.title, '【通知】Purchase request（已驳回）')
    assert.equal(updated.footer, '状态：已驳回\n— Purchase Requests AI 助理')
  } finally {
    await api.close()
  }
})

test('ja without a manifest: the card is exactly as before (Japan time, 承認 / 差戻); replies in other languages are still understood', async () => {
  const { api, im, core } = await setup(null)
  try {
    const card = im.state.sent[0].card
    assert.equal(card.title, '【承認のお願い】Purchase request')
    assert.deepEqual(card.body.split('\n').slice(0, 2), [
      '夜分に失礼します。Purchase requestの承認をお願いします。',
      '▶ お願いしたいこと（期限 11/30 18:30）：内容を確認し、「承認」か「差戻」を選んでください。',
    ])
    assert.deepEqual(card.actions.map((a) => a.label), ['承認', '差戻'])
    assert.equal(card.footer, `${MSG.footer('123456')}\n— Purchase Requests AI 秘書`)
    assert.deepEqual(await reply(core, 'Approve 123456'), [MSG.approved])
    assert.equal(im.state.updated.at(-1).card.title, '【ご報告】Purchase requestの承認依頼（承認済み）')
  } finally {
    await api.close()
  }
})

test('a configured replyWords wins over the language words (and only those words are claimed)', async () => {
  const { api, im, core } = await setup({ locale: 'en-US', timezone: 'UTC' }, { replyWords: { approve: ['OK'], reject: ['NG'] } })
  try {
    assert.deepEqual(im.state.sent[0].card.actions.map((a) => a.label), ['OK', 'NG'])
    assert.equal(core.matchesReply('Approve 123456'), false)
    assert.equal(core.matchesReply('ok 123456'), true)
  } finally {
    await api.close()
  }
})

test('decisionErrorMessage in en / zh; overrides still win; the default matcher stays Japanese only', () => {
  const e = (status, code, body) => new BridgeApiError('x', { status, code, body })
  assert.equal(decisionErrorMessage(e(403, 'role_not_permitted'), {}, 'en'), MESSAGES.en.code.role_not_permitted)
  assert.equal(decisionErrorMessage(e(0), {}, 'zh-CN'), '无法连接业务系统。请稍后再试。')
  assert.equal(decisionErrorMessage(e(400, 'invalid_reply_code', { remainingAttempts: 1 }), { invalid_reply_code: 'Wrong code.' }, 'en'), 'Wrong code. (1 attempt left)')
  assert.equal(decisionErrorMessage(e(503)), MSG.error.server)
  assert.equal(messagesFor(undefined), MSG)
  assert.equal(replyMatcher().parse('approve 123456'), null)
  assert.deepEqual(replyMatcher(ALL_REPLY_WORDS).parse('批准123456'), { action: 'approve', code: '123456', comment: undefined })
  for (const key of Object.keys(MESSAGES.ja)) {
    assert.ok(key in MESSAGES.en && key in MESSAGES.zh, `en / zh have ${key}`)
  }
})

test('configuredReplyWords: an unset setting (missing, {}, empty lists) or the Japanese default means "use the language\'s words"', () => {
  assert.equal(configuredReplyWords(undefined), null)
  assert.equal(configuredReplyWords({}), null)
  assert.equal(configuredReplyWords({ approve: [], reject: [' '] }), null)
  assert.equal(configuredReplyWords({ approve: ['承認'], reject: ['差戻'] }), null)
  assert.deepEqual(configuredReplyWords({ approve: ['OK'], reject: ['NG'] }), { approve: ['OK'], reject: ['NG'] })
})
