#!/usr/bin/env node
// The "speaks first" demo of purchase-requests on the REAL framework path: this example business system + the framework
// profile (profile/template made into a product profile) + the framework plugins on a real DeepSeek Harness (DSH), with
// the scripted model and the mock LINE of @dsh-bridge/testing. Nothing real: fictional data, test secrets per run.
//
//   node examples/purchase-requests/demo/run.mjs [--lang en|ja|zh|all] [--keep] [--reuse-home]
//
// Three moments, each checked (PASS / FAIL) and written to demo-view/transcript.<lang>.json (what the people did and what
// DSH sent them through the mock LINE API, as it was sent; no ids, tokens, hosts or ports):
//   1. a request has waited 3 days → the business system (scanUnanswered) emits purchase.unanswered + approval.requested →
//      bridge-events → bridge-notify / bridge-approvals → ONLY the approver it names gets the notice and the card
//      [Approve] [Reject] (the other approver, the requester and the other staff member get nothing);
//   2. the approver taps Approve (a LINE postback) → bridge-approvals → the business API decides (recorded, channel im) →
//      the card is updated; purchase.decided → the requester is told;
//   3. the requester asks "Where is my request?" → the AI calls purchase_list_requests with the requester's own delegation
//      and answers; another staff member asking about the same request → purchase_get_request is "not found" for them →
//      the AI says it cannot see it.
//
// DSH: $DSH_BIN, else the local pinned copy in <framework>/.dsh-cli/<version> (packages/testing/src/dsh-cli.mjs: installed
// with npm on first use). Home: <framework>/.dsh-home-purchase-demo (never ~/.dsh). Ports: PURCHASE_DEMO_PORTS
// (default app=19761,dsh=3261,llm=3262,line=3263,gateway=3264). Exit 0 = every check passed.
import http from 'node:http'
import { randomBytes } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { listen, todayIn } from '@dsh-bridge/server-kit'
import { createDshGateway, fromValue } from '../../../packages/gateway/src/index.mjs'
import { pickDshBin } from '../../../packages/testing/src/dsh-cli.mjs'
import { assertIsolatedHome, assertPortsUsable, redactor, startDsh } from '../../../packages/testing/src/dsh-home.mjs'
import { flexSummary, lineWebhookSender, randomLineUserId, startMockLine } from '../../../packages/testing/src/mock-line.mjs'
import { startMockLlm } from '../../../packages/testing/src/mock-llm.mjs'
import { sleep, waitFor } from '../../../packages/testing/src/procs.mjs'
import { createPurchaseApp } from '../src/app.mjs'
import { messagesFor } from '../src/messages.mjs'
import { requestNoIn, SCRIPTS } from './script.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const EXAMPLE = resolve(here, '..')
const FRAMEWORK = resolve(EXAMPLE, '..', '..')
const WORK = join(here, '.work')
const VIEW = join(EXAMPLE, 'demo-view')
const argv = process.argv.slice(2)
const KEEP = argv.includes('--keep')
const REUSE_HOME = argv.includes('--reuse-home')
const langArg = argv.includes('--lang') ? argv[argv.indexOf('--lang') + 1] : 'all'
const LANGS = langArg === 'all' ? ['en', 'ja', 'zh'] : [langArg]
if (!LANGS.every((l) => SCRIPTS[l])) { console.error(`--lang must be en, ja, zh or all (got ${langArg})`); process.exit(2) }

const PORTS = { app: 19761, dsh: 3261, llm: 3262, line: 3263, gateway: 3264 }
for (const part of String(process.env.PURCHASE_DEMO_PORTS ?? '').split(',').filter(Boolean)) {
  const [k, v] = part.split('=')
  if (!(k in PORTS) || !/^\d{2,5}$/.test(v ?? '')) { console.error(`PURCHASE_DEMO_PORTS: bad entry ${part}`); process.exit(2) }
  PORTS[k] = Number(v)
}
const FORBIDDEN_PORTS = [3080, 3180, 8790, 3010, 19720, 19730, 19741, 3241, 3242, 3243, 3244, 3245]
const HOME = resolve(FRAMEWORK, '.dsh-home-purchase-demo')
const PROFILE = 'purchase-demo'
const APP_ID = 'purchase-requests'
const APP = `http://127.0.0.1:${PORTS.app}`
const GATEWAY = `http://127.0.0.1:${PORTS.gateway}`
const slash = (p) => p.replace(/\\/g, '/')

// ── the product profile: profile/template with this application (the way profile/README.md describes) ───────────
function makeProductProfile(lang) {
  const m = messagesFor(lang)
  const src = join(WORK, 'profile-src')
  rmSync(src, { recursive: true, force: true })
  cpSync(join(FRAMEWORK, 'profile', 'template'), src, { recursive: true })
  const file = join(src, 'cordis.patch.yml')
  let text = readFileSync(file, 'utf8')
  const replace = (from, to, label) => {
    if (!text.includes(from)) throw new Error(`profile template changed: ${label} not found`)
    text = text.replace(from, to)
  }
  const start = text.indexOf('    applications:\n')
  const end = text.indexOf('    # compat:', start)
  if (start < 0 || end < 0) throw new Error('profile template changed: bridge-apps applications block not found')
  text = text.slice(0, start) + [
    '    applications:',
    `      - id: ${APP_ID}`,
    `        name: ${m.systemName}`,
    '        namespace: purchase',
    '        default: true',
    '        paths: v1',
    '        apiUrlEnv: PURCHASE_API_URL',
    '        serviceTokenEnv: PURCHASE_SERVICE_TOKEN',
    '        manifestUrl: /bridge/v1/manifest',
    `        manifestFile: ${JSON.stringify(slash(join(EXAMPLE, 'bridge.manifest.yaml')))}`,
    '        generateTools: true',
    '        bots: []',
    '',
  ].join('\n') + text.slice(end)
  text = text.split('<アプリ名>').join(m.systemName).split('<namespace>').join('purchase')
  // demo timings: no digest windows, no quiet hours (independent of the clock)
  replace('    digestMinutes: 30 ', '    digestMinutes: 0\n    honorQuietHours: false\n    # ', 'bridge-notify digestMinutes')
  replace('    # linkGuard:\n', `    linkGuard:\n      webUrl: ${APP}\n`, 'bridge-identity linkGuard')
  // the card: the application's own explanation (its wording) instead of the business body. No language settings: the
  // framework frames every message (and picks the button / reply words) in the language of the served manifest.
  replace("- id: bridge-approvals\n  name: '@dsh-bridge/plugin-approvals'\n  config:\n",
    "- id: bridge-approvals\n  name: '@dsh-bridge/plugin-approvals'\n  config:\n    showBusinessBody: false\n", 'bridge-approvals config')
  const presetAt = text.indexOf('- insert:\n    - id: preset-business-assistant')
  if (presetAt < 0) throw new Error('profile template changed: preset-business-assistant not found')
  text = `${text.slice(0, presetAt)}# ── demo product settings ──\n- id: bridge-events\n  config:\n    pollIntervalSeconds: 1\n    maxBackoffSeconds: 5\n\n${text.slice(presetAt)}`
  if (/:\s*<[^>]+>/.test(text.split('\n').filter((l) => !/^\s*#/.test(l)).join('\n'))) throw new Error('placeholders left in the demo product profile')
  writeFileSync(file, text, 'utf8')
  return src
}

function runInstall(src, redact) {
  const r = spawnSync(process.execPath, [join(FRAMEWORK, 'profile', 'scripts', 'install.mjs'), '--source', src, '--home', HOME, '--profile', PROFILE, '--framework-root', FRAMEWORK], {
    cwd: FRAMEWORK, encoding: 'utf8', env: { ...process.env, DSH_HOME: HOME }, timeout: 600_000, windowsHide: true,
  })
  const out = `${r.stdout ?? ''}\n${r.stderr ?? ''}`
  writeFileSync(join(WORK, 'install.log'), redact(out), { flag: 'a' })
  if (r.status !== 0) throw new Error(`install.mjs failed (exit ${r.status}): ${redact(out).slice(-800)}`)
}

function writeOverlay() {
  const file = join(WORK, 'overlay.yml')
  writeFileSync(file, `# demo overlay (written per run): the scripted model
- id: llm-pi-ai
  config:
    providers:
      demo-mock:
        displayName: demo mock (OpenAI compatible)
        apiKeyEnv: PURCHASE_DEMO_MOCK_LLM_KEY
        api: openai-completions
        baseURL: http://127.0.0.1:${PORTS.llm}/v1
        compat:
          supportsDeveloperRole: false
          maxTokensField: max_tokens
        models:
          - id: mock-bridge
            name: mock-bridge
- id: agent-default-model
  config:
    provider: demo-mock
    model: mock-bridge
`, 'utf8')
  return file
}

// ── the transcript: LINE messages as people see them (title, fields, text, buttons), without ids / tokens / URLs ──────
function cardOf(message) {
  const bubble = message.contents ?? {}
  const body = bubble.body?.contents ?? []
  const fields = []
  const texts = []
  for (const node of body) {
    if (node.type === 'text') texts.push({ text: node.text, bold: node.weight === 'bold' })
    if (node.type === 'box') {
      for (const row of node.contents ?? []) {
        const cells = (row.contents ?? []).filter((c) => c.type === 'text')
        if (row.layout === 'baseline' && cells.length === 2) fields.push({ label: cells[0].text, value: cells[1].text })
        else for (const c of cells) texts.push({ text: c.text })
      }
    }
  }
  const footer = flexSummary({ contents: bubble.footer ?? {} })
  const title = texts.find((t) => t.bold)?.text ?? message.altText ?? ''
  return {
    kind: 'card',
    title,
    fields,
    text: texts.filter((t) => !t.bold).map((t) => t.text).join('\n'),
    buttons: footer.buttons.filter((b) => b.label).map((b) => ({ label: b.label, kind: b.type === 'postback' ? 'action' : 'link' })),
    footer: footer.texts.join('\n').replace(/\b\d{6}\b/g, '••••••'), // the one-time reply code is not kept
  }
}
const viewOf = (messages) => (messages ?? []).map((msg) => (msg.type === 'text' ? { kind: 'text', text: msg.text } : msg.type === 'flex' ? cardOf(msg) : { kind: msg.type }))
const plain = (entry) => (entry?.messages ?? []).map((msg) => (msg.type === 'text' ? msg.text : msg.type === 'flex' ? [msg.altText, ...flexSummary(msg).texts].join('\n') : '')).join('\n')

async function runLanguage(lang) {
  const S = SCRIPTS[lang]
  const m = messagesFor(lang)
  const SECRETS = {
    service: `demo-svc-${randomBytes(24).toString('hex')}`, bff: `demo-bff-${randomBytes(24).toString('hex')}`, password: `Demo-${randomBytes(12).toString('hex')}`,
    llmKey: `demo-mock-llm-${randomBytes(8).toString('hex')}`, lineSecret: randomBytes(16).toString('hex'), lineToken: `demoMockLineToken${randomBytes(24).toString('base64url')}`,
  }
  const redact = redactor(Object.values(SECRETS))
  const LINE_BOT = randomLineUserId()
  const LINE = { approver: randomLineUserId(), otherApprover: randomLineUserId(), requester: randomLineUserId(), other: randomLineUserId() }
  const results = []
  const timeline = [] // the transcript: { at, chat, from: 'person' | 'system' | 'business', ... }
  const record = (step, ok, evidence = {}) => {
    results.push({ step, status: ok ? 'pass' : 'fail', evidence })
    console.log(`${ok ? 'PASS' : 'FAIL'}  [${lang}] ${step}`)
  }
  const cleanups = []
  const cleanup = async () => { for (const fn of cleanups.splice(0).reverse()) { try { await fn() } catch (error) { console.log(`cleanup: ${error.message}`) } } }

  try {
    await assertPortsUsable(PORTS, { forbidden: FORBIDDEN_PORTS })
    assertIsolatedHome(HOME)
    mkdirSync(WORK, { recursive: true })
    for (const f of ['dsh.log', 'install.log']) rmSync(join(WORK, f), { force: true })
    const dshBin = pickDshBin({ framework: FRAMEWORK }).bin

    // 1. the business system (in this process, so that the demo can let 3 days pass) — every AI read is recorded
    const app = await createPurchaseApp({ serviceToken: SECRETS.service, bffSecret: SECRETS.bff, locale: lang })
    const aiReads = []
    const server = await listen((req, res) => {
      if (req.headers['x-delegation-token']) {
        const read = { at: Date.now(), method: req.method, path: req.url.split('?')[0], status: null }
        aiReads.push(read)
        res.on('finish', () => { read.status = res.statusCode })
      }
      return app.handler(req, res)
    }, { port: PORTS.app, host: '127.0.0.1' })
    cleanups.push(() => server.stop())
    const users = {}
    users.admin = await app.createUser({ loginId: 'admin', password: SECRETS.password, role: 'admin', displayName: 'Demo Admin' })
    users.approver = await app.createUser({ loginId: 'approver1', password: SECRETS.password, role: 'manager', displayName: 'Demo Approver One' })
    users.otherApprover = await app.createUser({ loginId: 'approver2', password: SECRETS.password, role: 'manager', displayName: 'Demo Approver Two' })
    users.requester = await app.createUser({ loginId: 'staff1', password: SECRETS.password, role: 'staff', displayName: 'Demo Staff One', approverId: users.approver.id })
    users.other = await app.createUser({ loginId: 'staff2', password: SECRETS.password, role: 'staff', displayName: 'Demo Staff Two', approverId: users.otherApprover.id })
    const cookies = {}
    for (const [who, u] of Object.entries(users)) {
      const res = await fetch(`${APP}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ loginId: u.loginId, password: SECRETS.password }) })
      if (res.status !== 200) throw new Error(`login ${u.loginId}: ${res.status}`)
      cookies[who] = res.headers.get('set-cookie').split(';')[0]
    }
    const { purchaseRequest } = await app.requestPurchase(users.requester, { item: S.item, quantity: 2, amount: 12800 })
    await app.requestPurchase(users.other, { item: S.otherItem, quantity: 10, amount: 1500 })
    app.data.requests.get(purchaseRequest.id).createdAt = new Date(Date.now() - 3 * 86_400_000) // 3 days ago
    const no = purchaseRequest.no

    // 2. the scripted model: it only calls the business tools and words what they returned
    const llmScript = ({ body, userText, toolResults, findTool }) => {
      if (!Array.isArray(body.tools) || body.tools.length === 0) return { text: S.title }
      const asked = requestNoIn(userText)
      const tool = asked ? 'purchase_get_request' : S.isMine(userText) ? 'purchase_list_requests' : null
      if (!tool) return { text: S.title }
      const name = findTool(tool)
      if (!name) return { text: S.failed(`${tool} missing`) }
      if (toolResults.length === 0) return { toolCall: { name, arguments: asked ? { requestNo: asked } : {} } }
      const content = toolResults.at(-1).content
      let data = null
      try { data = JSON.parse(content) } catch { /* an error text */ }
      const today = todayIn('UTC')
      if (asked) return data?.ok && data.purchaseRequest ? { text: S.answer(data.purchaseRequest, m, today) } : (/not.?found|404/i.test(content) ? { text: S.refuse(asked) } : { text: S.failed(content.slice(0, 120)) })
      if (!data?.ok) return { text: S.failed(content.slice(0, 120)) }
      const latest = [...(data.purchaseRequests ?? [])].sort((a, b) => b.no.localeCompare(a.no))[0]
      return { text: latest ? S.answer(latest, m, today) : S.none }
    }
    const llm = await startMockLlm({ port: PORTS.llm, script: llmScript, expectKey: SECRETS.llmKey, model: 'mock-bridge' })
    cleanups.push(() => llm.close())
    const line = await startMockLine({ port: PORTS.line, channelAccessToken: SECRETS.lineToken, botUserId: LINE_BOT })
    cleanups.push(() => line.close())

    // 3. the product profile on a real DSH, behind the gateway
    const src = makeProductProfile(lang)
    const installed = existsSync(join(HOME, 'profiles', PROFILE, 'node_modules', '@dsh-bridge', 'plugin-tools'))
    if (!REUSE_HOME || !installed) rmSync(HOME, { recursive: true, force: true, maxRetries: 5, retryDelay: 500 })
    else for (const name of ['sessions', 'storages', 'integrations', 'im', 'auto-tasks', 'proactive', 'logs', 'workspace', 'agents', '.credentials.yaml', 'INSTALLED.json']) rmSync(join(HOME, name), { recursive: true, force: true })
    cleanups.push(() => {
      if (KEEP) return console.log(`kept ${HOME}`)
      if (REUSE_HOME) for (const name of ['sessions', 'storages', 'integrations', 'im', 'auto-tasks', 'proactive', 'logs', 'workspace', 'agents', '.credentials.yaml']) rmSync(join(HOME, name), { recursive: true, force: true })
      else rmSync(HOME, { recursive: true, force: true, maxRetries: 5, retryDelay: 500 })
    })
    runInstall(src, redact)
    const { proc, token } = await startDsh({
      bin: dshBin, home: HOME, profile: PROFILE, port: PORTS.dsh, patch: writeOverlay(), publicUrl: `${GATEWAY}/dsh/`, logFile: join(WORK, 'dsh.log'), secrets: Object.values(SECRETS),
      env: { PURCHASE_API_URL: APP, PURCHASE_SERVICE_TOKEN: SECRETS.service, BRIDGE_WEB_PUBLIC_URL: GATEWAY, CARE_DSH_IM_LINE_API_BASE: `http://127.0.0.1:${PORTS.line}`, PURCHASE_DEMO_MOCK_LLM_KEY: SECRETS.llmKey },
    })
    cleanups.push(() => proc.stop())
    const gateway = createDshGateway({
      target: `http://127.0.0.1:${PORTS.dsh}`, mountPath: '/dsh', getSessionUser: async () => null, isAllowed: () => false, launchToken: fromValue(token),
      logger: { info() {}, warn: (...a) => console.log('[gateway]', ...a.map(redact)), error: (...a) => console.log('[gateway]', ...a.map(redact)) },
      publicPaths: ['/dsh-hooks/line'], rpcAllowlist: [{ channel: '/line', methods: ['connection.status', 'bot.bind-credentials'] }],
    })
    const gw = http.createServer(async (req, res) => {
      if (await gateway.handleRequest(req, res)) return
      res.writeHead(404, { 'content-type': 'application/json' })
      res.end('{"error":"not_found"}')
    })
    await new Promise((r) => gw.listen(PORTS.gateway, '127.0.0.1', r))
    cleanups.push(() => new Promise((r) => { gw.closeAllConnections?.(); gw.close(() => r()) }))
    await waitFor(async () => (await gateway.rpc('/line', 'connection.status', {})).ok, { timeoutMs: 90_000, stepMs: 1000, label: 'dsh-im /line RPC' })
    const bound = await gateway.rpc('/line', 'bot.bind-credentials', { channelSecret: SECRETS.lineSecret, channelAccessToken: SECRETS.lineToken }, { timeoutMs: 60_000 })
    if (!bound.ok) throw new Error(`LINE bind failed: ${JSON.stringify(bound.error)}`)
    await waitFor(async () => { const s = await gateway.rpc('/line', 'connection.status', {}); return s.ok && s.value?.bots?.some((b) => b.connected) }, { timeoutMs: 30_000, stepMs: 500, label: 'LINE bot connected' })
    const webhook = lineWebhookSender({ url: `${GATEWAY}/dsh-hooks/line`, channelSecret: SECRETS.lineSecret, botUserId: LINE_BOT })
    const toUser = (event, userId) => (e) => (e.kind === 'reply' && e.replyToken === event.replyToken) || (e.kind === 'push' && e.to === userId)

    // everyone links their own chat (setup, not part of the story): a link code from the business web, then "link 123456" (連携 / 绑定)
    for (const who of ['approver', 'otherApprover', 'requester', 'other']) {
      const r = await fetch(`${APP}/bridge/v1/me/link-codes`, { method: 'POST', headers: { cookie: cookies[who] } })
      const { code } = await r.json()
      const at = Date.now()
      const sent = await webhook.text(LINE[who], `${{ en: 'link', ja: '連携', zh: '绑定' }[lang]} ${code}`)
      if (!(await line.waitForMessage(toUser(sent.event, LINE[who]), { since: at, timeoutMs: 30_000 }))) throw new Error(`linking ${who}: no answer`)
    }
    await sleep(1500)
    const storyStart = Date.now()
    const sentSince = (t, who) => line.log.filter((e) => (e.kind === 'push' || e.kind === 'reply') && e.at >= t && (e.to === LINE[who] || timeline.some((x) => x.replyToken && x.replyToken === e.replyToken && x.chat === who)))

    // ── moment 1: the request has waited 3 days — the business system speaks first, to the approver it names ─────────
    timeline.push({ at: Date.now(), chat: 'approver', from: 'business', kind: 'note', note: 'waited', facts: { requestNo: no, days: 3 } })
    const scan = await app.scanUnanswered()
    const notice = await line.waitForMessage((e) => e.kind === 'push' && e.to === LINE.approver && e.messages.every((x) => x.type !== 'flex' || !flexSummary(x).buttons.some((b) => b.type === 'postback')) && plain(e).includes(no), { since: storyStart, timeoutMs: 60_000 })
    const card = await line.waitForMessage((e) => e.kind === 'push' && e.to === LINE.approver && e.messages.some((x) => x.type === 'flex' && flexSummary(x).buttons.some((b) => b.type === 'postback')), { since: storyStart, timeoutMs: 60_000 })
    await sleep(3000) // anything for anyone else would have arrived by now
    const others = ['otherApprover', 'requester', 'other'].map((who) => [who, sentSince(storyStart, who).length])
    for (const e of [notice, card].filter(Boolean).sort((a, b) => a.at - b.at)) timeline.push({ at: e.at, chat: 'approver', from: 'system', messages: viewOf(e.messages) })
    record('1 a request waited 3 days → purchase.unanswered + approval.requested → only the named approver gets the notice and the card [Approve] [Reject]',
      scan.length === 1 && Boolean(notice) && Boolean(card) && others.every(([, n]) => n === 0), { scanned: scan.length, notice: Boolean(notice), card: Boolean(card), others: Object.fromEntries(others) })

    // ── moment 2: the approver taps Approve — decided in the business system, the card is updated, the requester is told ─
    const approve = card ? flexSummary(card.messages.find((x) => x.type === 'flex')).buttons.find((b) => b.type === 'postback' && /approve/.test(b.data ?? '')) : null
    let decided = false
    if (approve) {
      const at = Date.now()
      const pressed = await webhook.postback(LINE.approver, approve.data)
      timeline.push({ at, chat: 'approver', from: 'person', kind: 'tap', label: approve.label, replyToken: pressed.event.replyToken })
      const ack = await line.waitForMessage(toUser(pressed.event, LINE.approver), { since: at, timeoutMs: 30_000 })
      if (ack) timeline.push({ at: ack.at, chat: 'approver', from: 'system', messages: viewOf(ack.messages) })
      decided = await waitFor(() => app.data.requests.get(purchaseRequest.id).status === 'approved', { timeoutMs: 20_000, label: 'approved' }).then(() => true, () => false)
      const r = app.data.requests.get(purchaseRequest.id)
      if (decided) timeline.push({ at: Date.now(), chat: 'approver', from: 'business', kind: 'note', note: 'recorded', facts: { requestNo: no, status: r.status, channel: r.channel } })
      const updated = await line.waitForMessage((e) => e.kind === 'push' && e.to === LINE.approver && e.at > at && e.messages.some((x) => x.type === 'flex' && !flexSummary(x).buttons.some((b) => b.type === 'postback')), { since: at, timeoutMs: 30_000 })
      if (updated) timeline.push({ at: updated.at, chat: 'approver', from: 'system', update: true, messages: viewOf(updated.messages) })
      const told = await line.waitForMessage((e) => e.kind === 'push' && e.to === LINE.requester && plain(e).includes(no), { since: at, timeoutMs: 60_000 })
      if (told) timeline.push({ at: told.at, chat: 'requester', from: 'system', messages: viewOf(told.messages) })
      record('2 the approver taps Approve → recorded in the business system (approved, by the approver, channel im) → card updated → the requester is told',
        Boolean(ack && updated && told) && decided && r.decidedBy === users.approver.id && r.channel === 'im', { ack: Boolean(ack), updated: Boolean(updated), told: Boolean(told), status: r.status, channel: r.channel })
    } else record('2 the approver taps Approve', false, { reason: 'no Approve button on the card' })

    // ── moment 3: "Where is my request?" with the requester's own rights; another staff member is refused ──────────
    const ask = async (who, text) => {
      const at = Date.now()
      const sent = await webhook.text(LINE[who], text)
      timeline.push({ at, chat: who, from: 'person', kind: 'text', text, replyToken: sent.event.replyToken })
      // the AI's answer is a text (notifications and cards are flex messages)
      const reply = await line.waitForMessage((e) => toUser(sent.event, LINE[who])(e) && e.messages.some((x) => x.type === 'text'), { since: at, timeoutMs: 90_000 })
      if (reply) timeline.push({ at: reply.at, chat: who, from: 'ai', messages: viewOf(reply.messages) })
      const reads = aiReads.filter((x) => x.at >= at)
      const issued = (await app.store.listAudit({ action: 'delegation.issued' })).filter((a) => new Date(a.at).getTime() >= at).map((a) => a.target)
      return { reply: reply ? plain(reply) : '', reads, issued }
    }
    const mine = await ask('requester', S.mine)
    record('3a the requester asks → purchase_list_requests with the requester\'s own delegation → the answer has the request and its status',
      mine.reply.includes(no) && mine.reads.some((x) => x.path === '/api/purchase-requests' && x.status === 200) && mine.issued.length > 0 && mine.issued.every((id) => id === users.requester.id),
      { reply: mine.reply, reads: mine.reads.map((x) => `${x.method} ${x.path} ${x.status}`), delegationFor: mine.issued.map((id) => (id === users.requester.id ? 'requester' : 'someone else')) })
    timeline.push({ at: Date.now(), chat: 'requester', from: 'business', kind: 'note', note: 'own-rights', facts: { reads: mine.reads.map((x) => `${x.method} ${x.path.replace(/\/PR-\d+$/, '/{requestNo}')} → ${x.status}`) } })
    const theirs = await ask('other', S.other(no))
    record('3b another staff member asks about the same request → purchase_get_request is "not found" for them (404) → the AI says it cannot see it',
      theirs.reads.some((x) => x.path === `/api/purchase-requests/${no}` && x.status === 404) && !theirs.reply.includes(S.item) && theirs.reply.includes(no) && theirs.issued.every((id) => id === users.other.id),
      { reply: theirs.reply, reads: theirs.reads.map((x) => `${x.method} ${x.path} ${x.status}`) })
    timeline.push({ at: Date.now(), chat: 'other', from: 'business', kind: 'note', note: 'refused', facts: { reads: theirs.reads.map((x) => `${x.method} ${x.path.replace(/\/PR-\d+$/, '/{requestNo}')} → ${x.status}`) } })
    const transcript = {
      lang, generatedAt: new Date().toISOString().slice(0, 10), product: 'purchase-requests (examples/purchase-requests)',
      how: 'real DSH + framework plugins, scripted model, mock LINE (examples/purchase-requests/demo/run.mjs)',
      systemName: m.systemName, requestNo: no, ok: results.every((r) => r.status === 'pass'), checks: results.map(({ step, status }) => ({ step, status })),
      timeline: timeline.sort((a, b) => a.at - b.at).map(({ at, replyToken, ...rest }) => ({ t: at - storyStart, ...rest })),
    }
    mkdirSync(VIEW, { recursive: true })
    writeFileSync(join(VIEW, `transcript.${lang}.json`), `${redact(JSON.stringify(transcript, null, 2))}\n`, 'utf8')
    writeFileSync(join(WORK, `result.${lang}.json`), `${redact(JSON.stringify({ results, llmRequests: llm.requests.length }, null, 2))}\n`, 'utf8')
    const whoIs = (id) => Object.keys(LINE).find((k) => LINE[k] === id) ?? id
    writeFileSync(join(WORK, `line-api.${lang}.json`), `${redact(JSON.stringify(line.log.map((e) => ({ ...e, ...(e.to ? { to: whoIs(e.to) } : {}) })), null, 2))}\n`, 'utf8')
    return transcript.ok
  } catch (error) {
    record('setup / run', false, { error: redact(error.stack ?? error.message) })
    console.error(redact(error.stack ?? error.message))
    return false
  } finally {
    await cleanup()
  }
}

let ok = true
for (const lang of LANGS) ok = (await runLanguage(lang)) && ok
console.log(ok ? `\nall checks passed (${LANGS.join(', ')}) → ${VIEW}` : '\nsome checks FAILED')
process.exit(ok ? 0 : 1)
