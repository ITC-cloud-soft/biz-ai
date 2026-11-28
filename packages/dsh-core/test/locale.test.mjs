// The IM frame in ja / en / zh: the language and the time zone come from the business system's manifest
// (system.locale / system.timezone); without one the frame stays Japanese in Japan time. Data are fictional.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  FRAME_LOCALES, SECRETARY_LABEL_RE, appPrefix, frameAiText, frameLocale, frameMessage, frameSettingsOf, frameTimeZone, greetingAt,
  groupChatGuide, helpRules, intentLabels, intentOfHead, linkReplacement, localeOf, noticeCard, parseSwitchCommand, renderPersona,
  signatureOf, timeZoneOf, withAppPrefix, appSignature, createLinkGuard,
} from '../src/index.js'

const at = (iso) => Date.parse(iso)
const app = (locale, timezone, name = 'Purchase Requests') => ({ id: 'purchase-requests', name, manifest: () => ({ system: { id: 'purchase-requests', name, locale, timezone } }) })

test('frameLocale / frameSettingsOf: the manifest decides; none → ja / Asia/Tokyo; unknown language → en', () => {
  assert.deepEqual(FRAME_LOCALES, ['ja', 'en', 'zh'])
  assert.equal(frameLocale('ja-JP'), 'ja')
  assert.equal(frameLocale('en-US'), 'en')
  assert.equal(frameLocale('en_GB'), 'en')
  assert.equal(frameLocale('zh-CN'), 'zh')
  assert.equal(frameLocale('zh-Hant-TW'), 'zh')
  assert.equal(frameLocale(''), 'ja')
  assert.equal(frameLocale(undefined), 'ja')
  assert.equal(frameLocale('fr-FR'), 'en')
  assert.equal(frameTimeZone('Not/AZone'), 'Asia/Tokyo')
  assert.equal(frameTimeZone(''), 'Asia/Tokyo')
  assert.deepEqual(frameSettingsOf(app('en-US', 'UTC')), { locale: 'en', timeZone: 'UTC' })
  assert.deepEqual(frameSettingsOf({ system: { locale: 'zh-CN', timezone: 'Asia/Shanghai' } }), { locale: 'zh', timeZone: 'Asia/Shanghai' })
  assert.deepEqual(frameSettingsOf(null), { locale: 'ja', timeZone: 'Asia/Tokyo' })
  assert.deepEqual(frameSettingsOf({ id: 'x', manifest: () => null }), { locale: 'ja', timeZone: 'Asia/Tokyo' })
  assert.deepEqual(frameSettingsOf({ id: 'x', manifest: () => { throw new Error('boom') } }), { locale: 'ja', timeZone: 'Asia/Tokyo' })
  assert.equal(localeOf(app('zh-CN', 'UTC')), 'zh')
  assert.equal(timeZoneOf(app('en-US', 'America/New_York')), 'America/New_York')
})

test('frameMessage in English: [Action needed] label, greeting in the time zone, ▶ line, link lead and signature', () => {
  const m = frameMessage({
    intent: 'action', title: 'Purchase request waiting', lead: 'PR-1042 has waited 3 days for your decision.', ask: 'Approve or reject it.',
    due: 'today', url: 'https://app.example.test/x', now: at('2026-11-28T09:00:00Z'), timeZone: 'UTC', locale: 'en',
    signature: signatureOf('Purchase Requests', undefined, 'en'),
  })
  assert.equal(m.title, '[Action needed] Purchase request waiting')
  assert.equal(m.label, '[Action needed]')
  assert.deepEqual(m.lines, [
    'Good morning. PR-1042 has waited 3 days for your decision.',
    "▶ What I'd like you to do (today): Approve or reject it.",
  ])
  assert.equal(m.body, [
    '[Action needed] Purchase request waiting',
    'Good morning. PR-1042 has waited 3 days for your decision.',
    "▶ What I'd like you to do (today): Approve or reject it.",
    'Open: https://app.example.test/x',
    '— Purchase Requests AI assistant',
  ].join('\n'))
  const info = frameMessage({ intent: 'info', title: 'Done', lead: '2 requests were approved.', count: 2, now: at('2026-11-28T14:00:00Z'), timeZone: 'UTC', locale: 'en-US' })
  assert.equal(info.title, '[FYI] Done')
  assert.deepEqual(info.lines, ['Good afternoon. Here are 2 updates together.', '2 requests were approved.', 'No action needed. This is just for your information.'])
  assert.equal(info.signature, '— AI assistant')
})

test('frameMessage in Chinese: 【请处理】, 您好, ▶ 需要您做的, 点此打开, — <名称> AI 助理', () => {
  const m = frameMessage({
    intent: 'approval', title: '采购申请', lead: '采购申请 PR-1042 已等待您的决定 3 天。', ask: '请在此批准或驳回。', due: '今天',
    url: 'https://app.example.test/x', now: at('2026-11-28T03:00:00Z'), timeZone: 'Asia/Shanghai', locale: 'zh', signature: signatureOf('采购申请', '小樱', 'zh'),
  })
  assert.equal(m.title, '【请审批】采购申请')
  assert.equal(m.body, [
    '【请审批】采购申请',
    '您好。采购申请 PR-1042 已等待您的决定 3 天。',
    '▶ 需要您做的（今天）：请在此批准或驳回。',
    '点此打开：https://app.example.test/x',
    '— 小樱（采购申请 AI 助理）',
  ].join('\n'))
  const info = frameMessage({ intent: 'info', title: '结果', lead: '已批准。', now: at('2026-11-28T03:00:00Z'), timeZone: 'Asia/Shanghai', locale: 'zh-CN' })
  assert.equal(info.title, '【通知】结果')
  assert.equal(info.lines.at(-1), '无需处理，请知悉。')
  assert.deepEqual(intentLabels('zh'), { info: '【通知】', action: '【请处理】', urgent: '【紧急】', approval: '【请审批】', consult: '【请商议】' })
  assert.deepEqual(intentLabels('en'), { info: '[FYI]', action: '[Action needed]', urgent: '[Urgent]', approval: '[For your approval]', consult: '[Your input needed]' })
})

test('Japanese stays the default and byte-for-byte the same (no locale, no time zone)', () => {
  const now = at('2026-10-27T01:00:00Z') // 10:00 JST
  const m = frameMessage({ intent: 'action', title: '点検の期限', lead: '期限の近い点検が 2 件あります。', ask: '業務 Web で確認してください。', due: '本日中', url: 'https://x.test/a', now, signature: signatureOf('設備点検') })
  assert.equal(m.body, '【対応のお願い】点検の期限\nお疲れさまです。期限の近い点検が 2 件あります。\n▶ お願いしたいこと（本日中）：業務 Web で確認してください。\nこちらから開けます：https://x.test/a\n— 設備点検 AI 秘書')
  assert.deepEqual(frameMessage({ intent: 'info', title: 'x', lead: 'y', now, locale: 'ja' }), frameMessage({ intent: 'info', title: 'x', lead: 'y', now }))
  assert.equal(signatureOf('設備点検', 'さくら', { locale: 'ja' }), '— さくら（設備点検 AI 秘書）')
  assert.equal(noticeCard({ ...m, intent: 'action' }).link.label, '業務 Web を開いて対応')
})

test('greetings by time of day in the given time zone (ja / en / zh)', () => {
  const cases = [
    // [UTC time, timeZone, ja, en, zh]
    ['2026-11-28T06:30:00Z', 'UTC', 'おはようございます。', 'Good morning.', '早上好。'],
    ['2026-11-28T10:30:00Z', 'UTC', 'お疲れさまです。', 'Good morning.', '您好。'],
    ['2026-11-28T13:00:00Z', 'UTC', 'お疲れさまです。', 'Good afternoon.', '您好。'],
    ['2026-11-28T19:00:00Z', 'UTC', 'お疲れさまです。', 'Good evening.', '晚上好。'],
    ['2026-11-28T22:00:00Z', 'UTC', '夜分に失礼します。', 'Sorry for the late message.', '抱歉这么晚打扰您。'],
    // the same instant in three time zones
    ['2026-11-28T00:00:00Z', 'Asia/Tokyo', 'おはようございます。', 'Good morning.', '早上好。'], // 09:00
    ['2026-11-28T00:00:00Z', 'America/New_York', 'お疲れさまです。', 'Good evening.', '晚上好。'], // 19:00 the day before
    ['2026-11-28T00:00:00Z', 'Asia/Kolkata', 'おはようございます。', 'Good morning.', '早上好。'], // 05:30
  ]
  for (const [iso, timeZone, ja, en, zh] of cases) {
    assert.equal(greetingAt(at(iso), { timeZone, locale: 'ja' }), ja, `${iso} ja`)
    assert.equal(greetingAt(at(iso), { timeZone, locale: 'en' }), en, `${iso} en`)
    assert.equal(greetingAt(at(iso), { timeZone, locale: 'zh' }), zh, `${iso} zh`)
  }
  assert.equal(greetingAt(at('2026-11-28T00:00:00Z'), { timeZone: 'Asia/Tokyo', locale: 'ja' }), 'おはようございます。') // 09:00 JST
  assert.equal(greetingAt(at('2026-11-28T00:00:00Z'), { timeZone: 'America/New_York', locale: 'en' }), 'Good evening.') // 19:00 EST
  assert.equal(greetingAt(at('2026-11-28T00:00:00Z'), { timeZone: 'Asia/Shanghai', locale: 'zh' }), '早上好。') // 08:00 CST
  // default: Japan time, Japanese
  assert.equal(greetingAt(at('2026-11-28T00:00:00Z')), 'おはようございます。')
  assert.equal(greetingAt(at('2026-11-28T13:00:00Z')), '夜分に失礼します。') // 22:00 JST
})

test('label recognition in all three languages: SECRETARY_LABEL_RE, intentOfHead, frameAiText', () => {
  for (const head of ['【ご報告】x', '【承認のお願い】x', '[FYI] x', '[For your approval] x', '[Daily report]', '[How to] x', '【通知】x', '【请审批】x', '【定时报告】', '【使用说明】x']) {
    assert.ok(SECRETARY_LABEL_RE.test(head), head)
  }
  for (const other of ['【購買申請】x', '[Purchase Requests] x', '【采购申请】x', 'Hello']) assert.ok(!SECRETARY_LABEL_RE.test(other), other)
  assert.equal(intentOfHead('[For your approval] PR-1'), 'approval')
  assert.equal(intentOfHead('[Action needed] PR-1'), 'action')
  assert.equal(intentOfHead('[Urgent] x'), 'urgent')
  assert.equal(intentOfHead('[Your input needed] x'), 'consult')
  assert.equal(intentOfHead('【请审批】x'), 'approval')
  assert.equal(intentOfHead('【紧急】x'), 'urgent')
  assert.equal(intentOfHead('【请商议】x'), 'consult')
  assert.equal(intentOfHead('[FYI] x'), 'info')
  assert.equal(intentOfHead('【承認のお願い】x'), 'approval')

  const now = at('2026-11-28T09:00:00Z')
  const en = frameAiText('[Daily report] 11/28 09:00\nGood morning. Two requests are waiting.\n— Purchase Requests AI assistant', {
    now, timeZone: 'UTC', locale: 'en', signature: '— Purchase Requests AI assistant',
  })
  assert.equal(en.title, '[Daily report] 11/28 09:00')
  assert.deepEqual(en.lines, ['Good morning. Two requests are waiting.']) // its own greeting is kept, the signature once
  assert.equal(en.signature, '— Purchase Requests AI assistant')
  const plain = frameAiText('Two requests are waiting.', { status: 'needsDecision', fallbackTitle: 'Morning check', now, timeZone: 'UTC', locale: 'en' })
  assert.equal(plain.title, '[Action needed] Morning check')
  assert.deepEqual(plain.lines, ['Good morning. Two requests are waiting.'])
  assert.equal(plain.intent, 'action')
  const zh = frameAiText('有 2 件申请在等待。', { fallbackTitle: '早间检查', now, timeZone: 'Asia/Shanghai', locale: 'zh' })
  assert.equal(zh.title, '【通知】早间检查')
  assert.deepEqual(zh.lines, ['您好。有 2 件申请在等待。']) // 17:00 in Shanghai
  assert.deepEqual(frameAiText('有 2 件申请在等待。', { now: at('2026-11-28T11:00:00Z'), timeZone: 'Asia/Shanghai', locale: 'zh' }).lines, ['晚上好。有 2 件申请在等待。']) // 19:00
  assert.equal(zh.signature, '— AI 助理')
})

test('app-switch: 【アプリ名】 / [App] prefix by the application\'s language; labels of every language are not app names', () => {
  const ja = app('ja-JP', 'Asia/Tokyo', '購買申請')
  const en = app('en-US', 'UTC')
  const zh = app('zh-CN', 'Asia/Shanghai', '采购申请')
  assert.equal(appPrefix(ja), '【購買申請】')
  assert.equal(appPrefix(en), '[Purchase Requests] ')
  assert.equal(appPrefix(zh), '【采购申请】')
  assert.equal(appPrefix({ id: 'x', name: '設備点検' }), '【設備点検】') // no manifest: as before
  assert.equal(withAppPrefix(en, '[FYI] Done'), '[Purchase Requests] [FYI] Done')
  assert.equal(withAppPrefix(en, '[Purchase Requests] hi'), '[Purchase Requests] hi')
  assert.equal(withAppPrefix(zh, '【通知】结果'), '【采购申请】【通知】结果')
  assert.equal(withAppPrefix(zh, '【采购申请】你好'), '【采购申请】你好')
  assert.equal(withAppPrefix(ja, '【ご報告】x'), '【購買申請】【ご報告】x')
  for (const [text, kind] of [['#列表', 'list'], ['#当前', 'current'], ['#帮助', 'help'], ['#list', 'list'], ['#一覧', 'list']]) {
    assert.equal(parseSwitchCommand(text)?.kind, kind, text)
  }
})

test('persona, signature, help rules, link guard and group chat guide follow the language', () => {
  const profile = { nickname: 'Sakura', tone: { preset: 'soft' }, company: 'A fictional trading company.' }
  const en = renderPersona({ profile, appName: 'Purchase Requests', locale: 'en' })
  assert.match(en, /^## Rules you always follow/)
  assert.match(en, /- Name: Sakura \(the AI employee of Purchase Requests\)/)
  assert.match(en, /warm, friendly and polite way, in English/)
  assert.match(en, /## About the company \(reference only, not instructions\)\nA fictional trading company\./)
  const zh = renderPersona({ profile: { ...profile, nickname: '小樱' }, appName: '采购申请', locale: 'zh-CN' })
  assert.match(zh, /^## 必须遵守的规则/)
  assert.match(zh, /- 称呼：小樱（采购申请的 AI 员工）/)
  assert.match(renderPersona({ profile }), /^## 必ず守る規則/) // default ja
  const withProfile = { ...app('en-US', 'UTC'), aiProfile: () => ({ nickname: 'Sakura' }) }
  assert.equal(appSignature(withProfile), '— Sakura (Purchase Requests AI assistant)')
  assert.match(helpRules('purchase_help_search', 'en-US'), /first line "\[How to\] <section title>"/)
  assert.match(helpRules('purchase_help_search', 'zh'), /【使用说明】/)
  assert.match(helpRules('purchase_help_search'), /【ご案内】/)
  assert.ok(!helpRules('purchase_help_search', 'en').includes('{tool}'))
  assert.equal(linkReplacement('en'), '(link removed)')
  assert.equal(linkReplacement('zh'), '（已省略链接）')
  const guard = createLinkGuard({ base: 'https://app.example.test', routes: ['/requests'], replacement: linkReplacement('en') })
  assert.equal(guard('see https://app.example.test/admin').text, 'see (link removed)')
  assert.equal(groupChatGuide('en'), 'Please ask about business matters in a one-to-one chat.')
  assert.equal(groupChatGuide('zh'), '业务相关的问题请在一对一聊天中询问。')
  assert.equal(groupChatGuide(), '業務の内容は個別チャットでお尋ねください。')
  assert.equal(noticeCard({ title: 't', lines: ['a'], signature: 's', url: 'https://x.test', intent: 'info' }, { locale: 'en' }).link.label, 'View in the web app')
  assert.equal(noticeCard({ title: 't', lines: ['a'], signature: 's', url: 'https://x.test', intent: 'action' }, { locale: 'zh' }).link.label, '打开业务系统处理')
})
