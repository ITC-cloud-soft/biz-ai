// bridge-identity: 共用ボット（個人 WeChat）の同じ窓口内のアプリケーション切り替え。
//
// レジストリ（ctx.bridgeApps）で multiApp: true のボットだけが対象。それ以外のボット（WeCom（企業微信）・Slack・LINE・Teams は
// 1 アプリケーション 1 ボット）には何もしない。
//
//   dsh-im の会話ルーター（ctx.dshIm.setConversationRouter）
//     route           発言ごとに「いまのアプリ」（通知の引用・通知直後の返信ならその通知のアプリ）→ source.applicationId
//                     → dsh-im はその会話をアプリケーションごとの DSH セッションに分ける（p2p:<user>:app:<id>）
//     decorateReply   返信の先頭に【アプリ名】（通知への返信で切り替えたときは 1 回だけ一言添える）
//     decorateOutbound 共用ボットへの通知（dshIm.send / sendCard。applicationId 付き。無ければ共用ボットの既定）に【アプリ名】、
//                     返信の結び付けのために記録
//   claimReplies     「#一覧」「#いま」「#ヘルプ」「#<アプリ名>」（agent に渡さない。未連携でも使える。語は設定 switchWords）
//   レジストリの selector 発信元に applicationId が無い照会（古い呼び出し元）でも「いまのアプリ」で解決させる
//
// 「いまのアプリ」と通知の記録は $DSH_HOME/integrations/bridge-identity/app-switch.json（switchStatePath）に保存する。
import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import {
  SECRETARY_LABEL_RE, SWITCH_CURRENT_WORDS, SWITCH_HELP_WORDS, SWITCH_LIST_WORDS, createAppSwitch, localeOf, normalizeText, withAppPrefix,
} from '@dsh-bridge/dsh-core'
import { MESSAGES, messagesFor } from './messages.js'

/** 「#一覧」に出す切り替え名（aliases の最初、無ければ name）。 */
export function switchLabel(app) {
  return `#${app.aliases?.[0] ?? app.name ?? app.id}`
}

/**
 * 共用ボットの返事。文字列のもの（listTitle / listFooter / helpTitle / helpExample）は設定 switchMessages で上書きできる
 * （日本語の既定と同じ文は既定とみなす）。helpExample は使い方の「#アプリ名（例 …）」の例（既定はこのチャットの最初のアプリの切り替え名）。
 * linkKeyword は未連携の案内に使う連携キーワード（既定はその言語の語：連携 / link / 绑定）。
 * locale は返事の言語（ja / en / zh。そのアプリケーションの manifest の system.locale。既定 ja。文言は src/messages.js）。
 */
export function switchMessages(overrides = {}, { linkKeyword, locale } = {}) {
  const m = messagesFor(locale)
  const t = m.switch
  const keyword = linkKeyword ?? m.linkKeyword
  const pick = (key, fallback) => (typeof overrides?.[key] === 'string' && overrides[key] && overrides[key] !== MESSAGES.ja.switch[key] ? overrides[key] : fallback)
  const listTitle = pick('listTitle', t.listTitle)
  const listFooter = pick('listFooter', t.listFooter)
  const helpTitle = pick('helpTitle', t.helpTitle)
  const helpExample = pick('helpExample', null)
  return Object.freeze({
    listTitle,
    listItem: (app, label, current) => t.listItem(app.name, label, current),
    listFooter,
    switched: (app) => withAppPrefix(app, t.switched(app.name)),
    already: (app) => withAppPrefix(app, t.already(app.name)),
    current: (app) => withAppPrefix(app, t.current(app.name)),
    unknown: (query) => t.unknown(query),
    /** example = 例に出す切り替え名（このチャットのアプリの「#一覧」の名前） */
    help: (example) => [helpTitle, ...t.helpLines(helpExample ?? example)].join('\n'),
    notLinked: (app) => t.notLinked(app.name, keyword),
    switchedByReply: (app, reason) => t.switchedByReply(app.name, reason),
  })
}
export const SWITCH_MESSAGES = switchMessages()

const folded = (list, fallback) => {
  const words = (Array.isArray(list) && list.length ? list : fallback).map((w) => String(w ?? '').normalize('NFKC').trim().toLowerCase()).filter(Boolean)
  return new Set(words)
}

/**
 * 切り替えコマンドの解釈（「#」＋1 語。全角の ＃ ？ も可）。語は words で変えられる（既定は日本語＋英語）。
 * どの語にも当たらない「#<語>」は切り替え（アプリ名）。
 * @returns {(text: string) => ({kind: 'list'|'current'|'help'} | {kind: 'switch', query: string} | null)}
 */
export function createSwitchParser(words = {}) {
  const list = folded(words?.list, SWITCH_LIST_WORDS)
  const current = folded(words?.current, SWITCH_CURRENT_WORDS)
  const help = folded(words?.help, SWITCH_HELP_WORDS)
  return (text) => {
    const body = normalizeText(text)
    const match = /^#\s*([^\s#]{1,32})$/u.exec(body)
    if (!match) return null
    const word = match[1]
    const lower = word.toLowerCase()
    if (list.has(lower)) return { kind: 'list' }
    if (current.has(lower)) return { kind: 'current' }
    if (help.has(lower)) return { kind: 'help' }
    return { kind: 'switch', query: word }
  }
}

function renameRetry(from, to) {
  for (let attempt = 0; ; attempt += 1) {
    try {
      renameSync(from, to)
      return
    } catch (error) {
      if (process.platform !== 'win32' || !['EPERM', 'EBUSY', 'EACCES'].includes(error?.code) || attempt >= 20) throw error
      const until = Date.now() + 10
      while (Date.now() < until) { /* 短い待ち（Windows で他プロセスがファイルを開いている間） */ }
    }
  }
}

/** 小さな JSON の保存（遅延書き込み・原子的な置き換え）。path が無ければ何もしない。 */
export function createSwitchStore(path, { logger = console, delayMs = 300 } = {}) {
  let timer = null
  let pending = null
  function write(data) {
    if (!path) return
    try {
      mkdirSync(dirname(path), { recursive: true })
      const tmp = `${path}.${process.pid}.tmp`
      writeFileSync(tmp, `${JSON.stringify(data)}\n`, 'utf8')
      renameRetry(tmp, path)
    } catch (error) {
      logger.warn?.('bridge-identity: could not save the application switch state: %s', error?.message ?? error)
    }
  }
  return {
    path,
    load() {
      if (!path) return null
      try { return JSON.parse(readFileSync(path, 'utf8')) } catch { return null }
    },
    schedule(snapshot) {
      if (!path) return
      pending = snapshot
      if (timer) return
      timer = setTimeout(() => {
        timer = null
        const get = pending
        pending = null
        if (get) write(get())
      }, delayMs)
      timer.unref?.()
    },
    flush() {
      if (timer) clearTimeout(timer)
      timer = null
      const get = pending
      pending = null
      if (get) write(get())
    },
  }
}

/** 既定の保存先：$DSH_HOME/integrations/bridge-identity/app-switch.json（DSH_HOME が無ければ保存しない）。 */
export function defaultSwitchStatePath(env = process.env) {
  const home = env.DSH_HOME
  return home ? resolve(join(home, 'integrations', 'bridge-identity', 'app-switch.json')) : null
}

/**
 * 切り替えの本体と、dsh-im・レジストリへの取り付け。
 * @param {object} deps
 * @param {() => object} deps.registry   watchRegistry の結果（呼び出しごとに評価）
 * @param {object} deps.dshIm
 * @param {object} deps.identity          createIdentityService の結果（切り替え先で未連携なら案内を添える）
 * @param {object} [deps.words]           切り替えコマンドの語 { list, current, help }
 * @param {object} [deps.messages]        返事の上書き（listTitle / listFooter / helpTitle）
 * @param {(app) => string} [deps.linkKeyword] 未連携の案内に使う連携キーワード（そのアプリケーションの。既定はその言語の語）
 * @returns {{ appSwitch, router, handleCommand, parse, attachSelector, dispose }}
 */
export function installAppSwitch({
  registry, dshIm, identity, logger = console, replyWindowMs, statePath = null, now = Date.now, words = {}, messages = {}, linkKeyword = () => undefined,
}) {
  const store = createSwitchStore(statePath, { logger })
  const parse = createSwitchParser(words)
  // 返事の言語はそのアプリケーションの言語（manifest の system.locale）。ボット全体の返事（一覧・使い方）は「いまのアプリ」の言語
  const texts = (app) => switchMessages(messages, { linkKeyword: linkKeyword(app), locale: localeOf(app) })
  let appSwitch = null
  appSwitch = createAppSwitch({
    registry,
    now,
    ...(Number.isFinite(replyWindowMs) ? { replyWindowMs } : {}),
    onChange: () => store.schedule(() => appSwitch.snapshot()),
  })
  const saved = store.load()
  if (saved) appSwitch.restore(saved)

  const platformOfBot = (botId) => registry()?.sharedBots?.().find((bot) => bot.botId === String(botId ?? ''))?.platform ?? null

  const router = Object.freeze({
    route: ({ source, text, replyTo }) => {
      const routed = appSwitch.route({ source, text, replyTo })
      if (routed?.switched) logger.info?.('bridge-identity: %s/%s conversation switched to %s (%s)', source.platform, source.botId, routed.applicationId, routed.reason)
      return routed ? { applicationId: routed.applicationId } : null
    },
    decorateReply: (source, text) => {
      // 【アプリ一覧】【使い方】【アプリ名】などで始まる返事はそのまま。AI 秘書のラベル（【ご報告】【対応のお願い】…）はアプリ名ではないので付ける
      if (!appSwitch.isShared(source) || typeof text !== 'string') return text
      const lead = text.trimStart()
      if (lead.startsWith('【') && !SECRETARY_LABEL_RE.test(lead)) return text
      const app = registry()?.get?.(source.applicationId)
      if (!app) return text
      // en のアプリケーションは [Apps] [Help] [アプリ名] で始まる返事もそのまま（ラベル [FYI] … には付ける）
      if (localeOf(app) === 'en' && /^\[[^\]\n]{1,40}\]/.test(lead) && !SECRETARY_LABEL_RE.test(lead)) return text
      const notice = appSwitch.takeNotice(source, app.id)
      return withAppPrefix(app, notice ? `${texts(app).switchedByReply(app, notice.reason)}\n${text}` : text)
    },
    decorateOutbound: ({ botId, to, text, applicationId }) => {
      const platform = platformOfBot(botId)
      if (!platform || typeof text !== 'string') return text
      return appSwitch.noteNotification({ applicationId, platform, botId, to: to ?? undefined, text }).text
    },
  })

  async function linkedIn(app, source) {
    try {
      const result = await identity.resolve({ ...source, applicationId: app.id })
      return result?.linked === true
    } catch {
      return true // 照会できないときは案内を付けない（次の発言で通常の案内が出る）
    }
  }

  async function handleCommand({ text, source, reply }) {
    const command = parse(text)
    if (!command) return
    const apps = appSwitch.list(source)
    const current = appSwitch.current(source)
    const t = texts(current ?? apps[0]?.app ?? null)
    if (command.kind === 'help') return reply(t.help(apps[0] ? switchLabel(apps[0].app) : ''))
    if (command.kind === 'list') {
      const lines = [t.listTitle]
      for (const { app, current: isCurrent } of apps) lines.push(t.listItem(app, switchLabel(app), isCurrent))
      lines.push(t.listFooter)
      return reply(lines.join('\n'))
    }
    if (command.kind === 'current') return reply(current ? t.current(current) : t.help(apps[0] ? switchLabel(apps[0].app) : ''))
    const target = appSwitch.find(source, command.query)
    if (!target) return reply(t.unknown(command.query))
    if (current?.id === target.id) return reply(texts(target).already(target))
    appSwitch.select(source, target.id)
    logger.info?.('bridge-identity: %s/%s conversation switched to %s (command)', source.platform, source.botId, target.id)
    const linked = await linkedIn(target, source)
    const tt = texts(target)
    return reply(linked ? tt.switched(target) : `${tt.switched(target)}\n${tt.notLinked(target)}`)
  }

  const disposers = []
  if (typeof dshIm?.setConversationRouter === 'function') {
    disposers.push(dshIm.setConversationRouter(router))
  } else if ((registry()?.sharedBots?.() ?? []).length > 0) {
    logger.warn?.('bridge-identity: ctx.dshIm.setConversationRouter is missing (the bridge fork of dsh-im with setConversationRouter is required); shared bots answer as their default application only')
  }
  if (typeof dshIm?.claimReplies === 'function') {
    disposers.push(dshIm.claimReplies((body, source) => appSwitch.isShared(source) && parse(body) !== null, handleCommand))
  }

  return {
    appSwitch,
    router,
    handleCommand,
    parse,
    /** レジストリサービス（ctx.bridgeApps）に「いまのアプリ」の selector を付ける。返り値は解除。 */
    attachSelector(bridgeApps) {
      if (typeof bridgeApps?.setApplicationSelector !== 'function') return () => {}
      return bridgeApps.setApplicationSelector((source) => appSwitch.current(source)?.id ?? null)
    },
    dispose() {
      for (const dispose of disposers.splice(0)) {
        try { typeof dispose === 'function' ? dispose() : dispose?.dispose?.() } catch { /* ignore */ }
      }
      store.flush()
    },
  }
}
