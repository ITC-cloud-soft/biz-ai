// The language of bridge-identity's chat replies is the business system's (its manifest's system.locale): ja (default),
// en and zh. The link guide and replies, the group chat guide, the how-to answer frame, the link guard's mark and the
// shared bot's switch replies. Fictional systems and people only.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createApplicationRegistry, registryService } from '@dsh-bridge/dsh-core'
import { apply, linkGuide, LINK_GUIDE_JA } from '../src/index.js'
import { switchMessages, SWITCH_MESSAGES } from '../src/app-switch.js'
import { makeCtx, makeSource, mockDshIm, startFakeApi } from './helpers.mjs'

const WEB = 'https://rooms.example.test'

/** A small valid manifest in a language (with a manual and the screens of the web app). */
function manifestFor(id, locale, timezone) {
  return {
    bridge: 1,
    version: '2026-11-28',
    system: { id, name: id, locale, timezone },
    roles: { staff: { label: 'Staff', scope: 'all', delegation: 'propose' } },
    events: { 'room.booked': { payload: ['roomId'], severity: 'info' } },
    tools: [{ name: 'rooms_help_search', description: 'Manual search.', http: 'GET /bridge/v1/help/search', access: 'read', roles: ['staff'], pii: 'none' }],
    help: { tool: 'rooms_help_search' },
    web: { routes: ['/rooms', '/rooms/:id'] },
  }
}

const SECTION = { id: 'login', title: 'Sign in', summary: 'Sign in to the web app.', steps: ['Enter your email', 'Press “Sign in”'], url: `${WEB}/rooms`, manualUrl: `${WEB}/help#login` }

async function setup(locale, { timezone = 'UTC', config = {}, appExtra = {} } = {}) {
  const linked = new Set(['U-linked'])
  const api = await startFakeApi((req) => {
    if (req.path === '/bridge/v1/identity') {
      return linked.has(req.query.userId) ? { body: { ok: true, linked: true, orgId: 'o', user: { id: 'e1', role: 'staff' } } } : { body: { ok: true, linked: false, orgId: 'o' } }
    }
    if (req.path === '/bridge/v1/identities/link' && req.method === 'POST') {
      if (req.body?.code !== '123456') return { status: 404, body: { ok: false, error: 'link_code_invalid' } }
      linked.add(req.body.source.userId)
      return { body: { ok: true, user: { id: 'e2', displayName: 'Alex' } } }
    }
    if (req.path === '/bridge/v1/help/public') return { body: { ok: true, found: true, results: [SECTION] } }
    return { status: 404, body: { ok: false } }
  })
  const manifest = locale ? manifestFor('room-booking', locale, timezone) : null
  const registry = createApplicationRegistry({
    applications: [{ id: 'room-booking', name: 'Room Booking', default: true, apiUrl: api.url, serviceToken: 'svc', ...(manifest ? { manifest } : {}), ...appExtra }],
  })
  await registry.ensureManifests()
  if (manifest) assert.ok(registry.get('room-booking').manifest(), 'the test manifest is valid')
  const im = mockDshIm()
  const ctx = makeCtx({ dshIm: im.dshIm, bridgeApps: registryService(registry) })
  apply(ctx, { guideIntervalSeconds: 0, linkGuard: { webUrl: WEB }, ...config })
  return { api, im, ctx, close: async () => { await ctx.dispose(); await api.close() } }
}

test('en: the link guide, the link replies, the group chat guide and the link guard mark are English', async () => {
  // the profile template writes the Japanese default of messages.groupChat: it counts as the default
  const s = await setup('en-US', { config: { messages: { groupChat: '業務の内容は個別チャットでお尋ねください。' } } })
  try {
    const guide = await s.im.state.resolver(makeSource({ userId: 'U-new' }), { text: '' })
    assert.ok(guide.deny)
    assert.equal(guide.reply, linkGuide('link', 'en'))
    assert.match(guide.reply, /send “link 123456” here/)
    assert.equal((await s.im.reply('link 000000', makeSource({ userId: 'U-new' })))[0], 'That link code is not valid or has expired (codes are valid for 10 minutes). Please issue a new code in the business web app and send it again.')
    assert.equal((await s.im.reply('link 123456', makeSource({ userId: 'U-new' })))[0], 'Your account is linked as Alex. From now on I will tell you in this chat when something needs your check or action. Talk to me any time.')
    // every language's keyword works when linkKeywords is not configured
    assert.ok(await s.im.reply('連携 123456', makeSource({ userId: 'U-ja' })))
    assert.ok(await s.im.reply('绑定 123456', makeSource({ userId: 'U-zh' })))
    const group = await s.im.state.resolver(makeSource({ userId: 'U-linked', conversationKind: 'group', conversationId: 'G1' }))
    assert.equal(group.reply, 'Please ask about business matters in a one-to-one chat.')
    const out = await s.im.state.answerFilter({ sessionId: 's', source: makeSource({ userId: 'U-linked' }), text: `See ${WEB}/elsewhere now` })
    assert.equal(out, 'See (link removed) now')
  } finally {
    await s.close()
  }
})

test('en: an unlinked how-to question is answered in the [How to] frame with the English greeting (manifest timezone) and signature', async () => {
  const s = await setup('en-US', { timezone: 'America/New_York' })
  try {
    const r = await s.im.state.resolver(makeSource({ userId: 'U-new' }), { text: 'How do I sign in?' })
    const lines = r.reply.split('\n')
    assert.equal(lines[0], '[How to] Sign in')
    assert.match(lines[1], /^(Good morning\.|Good afternoon\.|Good evening\.|Sorry for the late message\.) Sign in to the web app\.$/)
    assert.ok(lines.includes(`Open: ${WEB}/rooms`))
    assert.ok(lines.includes(`Step by step: ${WEB}/help#login`))
    assert.ok(lines.includes(linkGuide('link', 'en')))
    assert.equal(lines.at(-1), '— Room Booking AI assistant')
  } finally {
    await s.close()
  }
})

test('zh: the link guide and replies, the help frame and the group chat guide are Chinese', async () => {
  const s = await setup('zh-CN', { timezone: 'Asia/Shanghai' })
  try {
    const guide = await s.im.state.resolver(makeSource({ userId: 'U-new' }), { text: '' })
    assert.match(guide.reply, /发送「绑定 123456」/)
    assert.equal((await s.im.reply('绑定 123456', makeSource({ userId: 'U-new' })))[0], '绑定完成，身份为 Alex，现在可以使用了。之后需要您确认或处理的事项，我会在这个聊天里通知您。有任何问题，随时找我。')
    const group = await s.im.state.resolver(makeSource({ userId: 'U-linked', conversationKind: 'group', conversationId: 'G1' }))
    assert.equal(group.reply, '业务相关的问题请在一对一聊天中询问。')
    const help = await s.im.state.resolver(makeSource({ userId: 'U-other' }), { text: '怎么登录？' })
    const lines = help.reply.split('\n')
    assert.equal(lines[0], '【使用说明】Sign in')
    assert.ok(lines.includes(`点此打开：${WEB}/rooms`))
    assert.ok(lines.includes(`详细步骤：${WEB}/help#login`))
    assert.equal(lines.at(-1), '— Room Booking AI 助理')
    const out = await s.im.state.answerFilter({ sessionId: 's', source: makeSource({ userId: 'U-linked' }), text: `看 ${WEB}/elsewhere` })
    assert.equal(out, '看 （已省略链接）')
  } finally {
    await s.close()
  }
})

test('ja (no manifest, the default): the replies stay exactly the Japanese ones; a configured override is kept', async () => {
  const s = await setup(null, { config: { messages: { invalidCode: 'コードを確かめてください。' } } })
  try {
    const guide = await s.im.state.resolver(makeSource({ userId: 'U-new' }), { text: '' })
    assert.equal(guide.reply, LINK_GUIDE_JA)
    assert.equal((await s.im.reply('連携 000000', makeSource({ userId: 'U-new' })))[0], 'コードを確かめてください。')
    assert.match((await s.im.reply('連携 123456', makeSource({ userId: 'U-new' })))[0], /^連携が完了しました。Alex さんとしてご利用いただけます。/)
    const group = await s.im.state.resolver(makeSource({ userId: 'U-linked', conversationKind: 'group', conversationId: 'G1' }))
    assert.equal(group.reply, '業務の内容は個別チャットでお尋ねください。')
  } finally {
    await s.close()
  }
})

test('the shared bot switch replies per language (ja default unchanged)', () => {
  assert.equal(switchMessages().listTitle, SWITCH_MESSAGES.listTitle)
  assert.equal(SWITCH_MESSAGES.listTitle, '【アプリ一覧】このチャットで使える業務アプリ：')
  const app = { id: 'room-booking', name: 'Room Booking', manifest: () => ({ system: { locale: 'en-US', timezone: 'UTC' } }) }
  const en = switchMessages({}, { locale: 'en' })
  assert.equal(en.switched(app), '[Room Booking] Switched to Room Booking. From here on this is the Room Booking conversation (separate from the other apps).')
  assert.equal(en.notLinked(app), 'You have not linked your account with Room Booking yet. Issue a link code in Room Booking and send “link 123456”.')
  assert.match(en.help('#rooms'), /^\[Help\] In this chat you can switch between several business apps\.\n・#list {3}the apps you can use\n・#app name \(e\.g\. #rooms\)/)
  const zhApp = { ...app, name: '会议室预约', manifest: () => ({ system: { locale: 'zh-CN', timezone: 'Asia/Shanghai' } }) }
  const zh = switchMessages({}, { locale: 'zh' })
  assert.equal(zh.current(zhApp), '【会议室预约】当前应用是会议室预约。发送「#列表」可以查看其他应用。')
  assert.equal(zh.unknown('x'), '【应用列表】这个聊天中没有名为「#x」的应用。发送「#列表」查看可用的应用。')
  // an override identical to the Japanese default counts as the default; another override is kept
  assert.equal(switchMessages({ listTitle: SWITCH_MESSAGES.listTitle }, { locale: 'en' }).listTitle, '[Apps] The business apps you can use in this chat:')
  assert.equal(switchMessages({ listTitle: 'Rooms:' }, { locale: 'en' }).listTitle, 'Rooms:')
})
