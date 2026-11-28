// The language of bridge-notify's texts: the business system's manifest (system.locale / system.timezone). en / zh frames,
// greetings in the manifest's time zone, the auto-task frames, the AI report replies; without a manifest Japanese as before.
// Fictional data only.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { V1_PATHS, createBusinessApi, noticeCard } from '@dsh-bridge/dsh-core'
import { audienceTemplate, renderManifestMessage, renderNotification } from '../src/index.js'
import { COMMAND_RE, createAiReporter, defaultReportPrompt, reportTemplate } from '../src/ai-report.js'
import { messagesFor } from '../src/messages.js'
import { makeSource, silentLogger, startFakeApi } from './helpers.mjs'

const manifestIn = (locale, timezone, name, label, description, action) => ({
  system: { id: 'purchase-requests', name, locale, timezone },
  events: { 'purchase.unanswered': { label } },
  templates: { 'purchase.unanswered': { description, intent: 'action', action } },
})
const EN = manifestIn('en-US', 'America/New_York', 'Purchase Requests', 'Purchase request waiting',
  'Purchase request PR-{requestNumber} has waited {daysWaiting} day(s).', 'Approve or reject it in Purchase Requests.')
const ZH = manifestIn('zh-CN', 'Asia/Shanghai', '采购申请', '采购申请待审批', '采购申请 PR-{requestNumber} 已等待 {daysWaiting} 天。', '请在采购申请中批准或驳回。')
const input = (manifest, at) => ({
  manifest, template: 'purchase.unanswered', type: 'purchase.unanswered', count: 1, params: { requestNumber: 1042, daysWaiting: 3 },
  link: 'https://purchase.example.test/purchase-requests/r1', appName: manifest.system.name, now: at,
})
// 2026-11-02 13:00 UTC = 08:00 New York (EST) = 21:00 Shanghai = 22:00 Tokyo
const AT = Date.UTC(2026, 10, 2, 13, 0)

test('en: manifest template → [Action needed], greeting in the manifest time zone, signature, link line, card link label', () => {
  const m = renderNotification(input(EN, AT))
  assert.equal(m.title, '[Action needed] Purchase request waiting')
  assert.deepEqual(m.lines, [
    'Good morning. Purchase request PR-1042 has waited 3 day(s).',
    "▶ What I'd like you to do: Approve or reject it in Purchase Requests.",
  ])
  assert.equal(m.signature, '— Purchase Requests AI assistant')
  assert.match(m.body, /\nOpen: https:\/\/purchase\.example\.test\/purchase-requests\/r1\n/)
  assert.equal(noticeCard(m, { locale: 'en' }).link.label, 'Open and take action')
  // the same message in the evening of New York
  assert.match(renderManifestMessage(EN, input(EN, Date.UTC(2026, 10, 2, 23, 30))).lines[0], /^Good evening\. /)
  // a template the manifest does not have: the default notice in English
  const other = renderManifestMessage(EN, { ...input(EN, AT), template: 'x', type: 'x' })
  assert.equal(other.title, '[FYI] Purchase Requests')
  assert.deepEqual(other.lines, ['Good morning. There is a new update in the web app.', 'No action needed. This is just for your information.'])
  assert.equal(noticeCard(other, { locale: 'en' }).link.label, 'View in the web app')
})

test('zh: manifest template → 【请处理】, greeting in Asia/Shanghai, signature, link line, nickname', () => {
  const m = renderNotification({ ...input(ZH, AT), nickname: '小樱' })
  assert.equal(m.title, '【请处理】采购申请待审批')
  assert.deepEqual(m.lines, ['抱歉这么晚打扰您。采购申请 PR-1042 已等待 3 天。', '▶ 需要您做的：请在采购申请中批准或驳回。'])
  assert.equal(m.signature, '— 小樱（采购申请 AI 助理）')
  assert.match(m.body, /\n点此打开：https:\/\/purchase\.example\.test\/purchase-requests\/r1\n/)
  assert.equal(noticeCard(m, { locale: 'zh' }).link.label, '打开业务系统处理')
  const two = renderNotification({ ...input(ZH, Date.UTC(2026, 10, 2, 1, 0)), count: 2 })
  assert.equal(two.lines[0], '早上好。共 2 条，一并通知您。')
})

test('a template module gets the locale and time zone of the manifest', () => {
  let seen = null
  const mod = { render: (i) => { seen = { locale: i.locale, timeZone: i.timeZone, signature: i.signature }; return null }, templates: null, types: [] }
  renderNotification({ ...input(ZH, AT), modules: [mod] })
  assert.deepEqual(seen, { locale: 'zh', timeZone: 'Asia/Shanghai', signature: '— 采购申请 AI 助理' })
})

test('auto-task frames (audienceText: template) and the fixed AI report text in en / zh', () => {
  const at = Date.UTC(2026, 10, 2, 15, 0) // 15:00 UTC
  const en = audienceTemplate({ status: 'needsDecision', title: 'Weekly check', url: 'https://x.example.test/', now: at, locale: 'en', timeZone: 'UTC' })
  assert.equal(en.title, '[Action needed] Weekly check')
  assert.deepEqual(en.lines, ['Good afternoon. An automatic AI task put together something for you to check.', "▶ What I'd like you to do: Please review it in the web app and take care of it."])
  assert.equal(en.signature, '— AI assistant')
  const zh = audienceTemplate({ status: 'failed', title: '每周检查', now: at, locale: 'zh', timeZone: 'Asia/Shanghai' })
  assert.equal(zh.title, '【通知】每周检查')
  assert.deepEqual(zh.lines, ['抱歉这么晚打扰您。AI 自动处理未能完成。', '详细内容请在业务系统中查看。'])
  assert.equal(audienceTemplate({ status: 'done', title: 'x', now: at, locale: 'en', timeZone: 'UTC' }).lines[0], 'Good afternoon. An automatic AI task has finished.')
  const report = reportTemplate({ appName: 'Purchase Requests', url: 'https://x.example.test/', now: at, locale: 'en', timeZone: 'UTC' })
  assert.equal(report.split('\n')[0], '[Daily report]')
  assert.match(report, /^Good afternoon\. It is time for the daily report\./m)
  assert.match(report, /\nOpen: https:\/\/x\.example\.test\/\n— Purchase Requests AI assistant$/)
  assert.match(reportTemplate({ appName: '采购申请', now: at, locale: 'zh', timeZone: 'Asia/Shanghai' }), /^【定时报告】\n抱歉这么晚打扰您。定时业务报告的时间到了。/)
})

test('the default AI report instructions are written in the language of the application', () => {
  const app = (locale) => ({ id: 'purchase-requests', name: 'Purchase Requests', namespace: 'purchase', manifest: () => ({ system: { locale, timezone: 'UTC' } }) })
  const en = defaultReportPrompt(app('en-US'))
  assert.match(en, /purchase_\* tools/)
  assert.match(en, /in English/)
  assert.match(en, /"\[Daily report\]"/)
  assert.match(en, /"■ Needs action"/)
  assert.match(en, /The last line is "— Purchase Requests AI assistant"/)
  const zh = defaultReportPrompt(app('zh-CN'))
  assert.match(zh, /「【定时报告】」/)
  assert.match(zh, /简体中文/)
  assert.match(zh, /「— Purchase Requests AI 助理」/)
  assert.match(defaultReportPrompt(app('ja-JP')), /^定時業務報告の時刻です。.*「【定時のご報告】」/)
})

test('ja (no manifest / a Japanese manifest): the texts are as before', () => {
  const ja = { ...manifestIn('ja-JP', 'Asia/Tokyo', '購買申請', '購買申請の判断待ち', '購買申請 PR-{requestNumber} が {daysWaiting} 日間待っています。', '承認か差戻を選んでください。') }
  const m = renderNotification(input(ja, AT))
  assert.equal(m.body, [
    '【対応のお願い】購買申請の判断待ち', '夜分に失礼します。購買申請 PR-1042 が 3 日間待っています。', '▶ お願いしたいこと：承認か差戻を選んでください。',
    'こちらから開けます：https://purchase.example.test/purchase-requests/r1', '— 購買申請 AI 秘書',
  ].join('\n'))
  const none = renderManifestMessage(null, { template: 'x', type: 'x', count: 1, appName: '購買申請', now: AT })
  assert.deepEqual(none.lines, ['夜分に失礼します。業務 Web に新しいお知らせがあります。', 'ご対応は不要です。ご確認だけお願いします。'])
  assert.equal(audienceTemplate({ status: 'done', title: 'x', now: AT }).lines[0], '夜分に失礼します。AI の自動処理が完了しました。')
  assert.equal(messagesFor(undefined), messagesFor('ja'))
})

test('AI report commands: the keyword and words of all three languages; the replies in the language of the application', async () => {
  for (const text of ['定時報告 オン', 'daily report on', 'Daily Report status', '定时报告 开启', '定时报告 关闭', '定时报告 测试', '定时报告']) assert.ok(COMMAND_RE.test(text), text)
  assert.equal(COMMAND_RE.test('daily report please'), false)
  const api = await startFakeApi((req) => {
    if (req.path === '/bridge/v1/identity') {
      const users = { 'wx-admin': { id: 'u-admin', role: 'admin' }, 'wx-staff': { id: 'u-staff', role: 'staff' } }
      const u = users[req.query.userId]
      return { body: u ? { ok: true, linked: true, user: u } : { ok: true, linked: false } }
    }
    return { status: 404, body: { error: 'not_found' } }
  })
  const appIn = (locale, timezone) => ({
    id: 'purchase-requests', name: 'Purchase Requests', namespace: 'purchase', paths: { ...V1_PATHS }, label: 'test API',
    api: createBusinessApi({ baseUrl: () => api.url, serviceToken: () => 'svc', label: 'test API' }),
    manifest: () => ({ system: { id: 'purchase-requests', locale, timezone }, reports: { daily: { cron: ['0 8 * * *'] } } }),
  })
  const alarms = []
  const proactive = {
    async state(sessionId) { return { alarms: alarms.filter((a) => a.sessionId === sessionId) } },
    async action(action, sessionId) {
      if (action.kind === 'create') alarms.push({ id: `a${alarms.length + 1}`, sessionId, prompt: action.args.prompt, cron: action.args.cron, state: 'scheduled' })
      if (action.kind === 'cancel') alarms.find((a) => a.id === action.id).state = 'cancelled'
      return { ok: true }
    },
  }
  const targets = []
  const dshIm = { listTargets: async () => targets, createTarget: async (botId, t) => { targets.push(t); return t } }
  const reporterFor = (app) => {
    const registry = { default: () => app, get: () => app, resolveApplication: () => app }
    return createAiReporter({ registry, dshIm, proactive: () => proactive, logger: silentLogger() })
  }
  const admin = makeSource({ platform: 'weixin', botId: 'W1', teamId: undefined, userId: 'wx-admin', conversationId: 'wx-admin' })
  const staff = makeSource({ platform: 'weixin', botId: 'W1', teamId: undefined, userId: 'wx-staff', conversationId: 'wx-staff' })
  try {
    const en = reporterFor(appIn('en-US', 'UTC'))
    assert.equal(await en.handleCommand('daily report on', staff), 'Sorry, only people with the configured roles (such as administrators and managers) can set up the daily report.')
    assert.equal(await en.handleCommand('daily report on', admin), 'Please send any message to the AI employee in this chat first, then send "daily report on" again.')
    await en.noteInbound({ sessionId: 's-en', source: admin, text: 'hello' })
    assert.equal(await en.handleCommand('daily report on', admin),
      'Done. The daily report is on (every day at 08:00, UTC). I will report in this chat. To stop, send "daily report off"; to try it now, send "daily report test".')
    assert.equal(targets[0].name, 'Daily report (AI employee)')
    assert.match(alarms[0].prompt, /in English/)
    assert.equal(await en.handleCommand('daily report', admin), 'The daily report is on (every day at 08:00). I report in this chat at those times.')
    assert.equal(await en.handleCommand('定時報告 オフ', admin), 'Done. The daily report is off. Send "daily report on" when you need it again.')

    const zh = reporterFor(appIn('zh-CN', 'Asia/Shanghai'))
    assert.equal(await zh.handleCommand('定时报告 开启', makeSource({ platform: 'weixin', userId: 'wx-nobody' })), '此账号尚未与业务系统关联。请先在业务系统中完成 SNS 关联，然后再试一次。')
    await zh.noteInbound({ sessionId: 's-zh', source: admin, text: '你好' })
    assert.equal(await zh.handleCommand('定时报告 开启', admin),
      '好的，已开启定时业务报告（每天 08:00，Asia/Shanghai）。我会在这个聊天中报告。要停止请发送「定时报告 关闭」，要立即试一次请发送「定时报告 测试」。')
    assert.equal(await zh.handleCommand('定时报告 关闭', admin), '好的，已关闭定时业务报告。需要时请再发送「定时报告 开启」。')
    assert.equal(await zh.handleCommand('定时报告 测试', admin), '定时业务报告处于关闭状态。请先发送「定时报告 开启」。')

    // a Japanese application keeps the Japanese replies (and a configured Japanese default reply counts as the default)
    const ja = reporterFor(appIn('ja-JP', 'Asia/Tokyo'))
    assert.match(await ja.handleCommand('定時報告 オン', staff), /^申し訳ありません。定時業務報告は、設定された役割/)
    const enWithJaDefault = createAiReporter({
      registry: { default: () => appIn('en-US', 'UTC'), get: () => appIn('en-US', 'UTC'), resolveApplication: () => appIn('en-US', 'UTC') },
      dshIm, proactive: () => proactive, logger: silentLogger(), messages: () => ({ role: messagesFor('ja').replies.role }),
    })
    assert.match(await enWithJaDefault.handleCommand('daily report on', staff), /^Sorry, only people/)
  } finally {
    await api.close()
  }
})
