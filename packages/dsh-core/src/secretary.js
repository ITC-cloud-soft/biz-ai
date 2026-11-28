// secretary.js — IM の文面を「AI 秘書」の形にそろえる共通部品（docs/GUIDELINE.md の IM 文面の節）。
//
// どの通知も 1 行目に意図のラベルを付ける（ja / en / zh）：
//   【ご報告】       [FYI]                【通知】     情報だけ（最後に「ご対応は不要です」の一言）
//   【対応のお願い】 [Action needed]      【请处理】   具体的な対応をお願いする（▶ お願いしたいこと：何を・どこで・いつまでに）
//   【至急】         [Urgent]             【紧急】     急ぎの対応（安否確認・未打刻など）
//   【承認のお願い】 [For your approval]  【请审批】   承認のお願い（intent approval）。承認カード（@dsh-bridge/plugin-approvals）と、ボタンの無い文字の通知
//                                                     （承認できる人が依頼者本人しかいないので別の人に回すときなど。判断は業務 Web で）
//   【ご相談】       [Your input needed]  【请商议】   判断を一緒に考えてほしいこと（intent consult。期限を過ぎて片付かないもののお知らせ、判断材料の確認など）
//   【定時のご報告】 [Daily report]       【定时报告】 定時業務報告
//   【ご案内】       [How to]             【使用说明】 システムの使い方の質問への答え（AI 秘書がマニュアルの節から書く。intent は info）
// 2 行目は送る時刻に合わせたあいさつ（名前は使わない）、最後に短い署名「— <アプリ名> AI 秘書」（アプリ名が無ければ「— AI 秘書」）。
// 言語と時間帯は業務システムの manifest の system.locale / system.timezone（messages.js の frameSettingsOf。manifest が無ければ
// 日本語・日本時間）。文言はすべて messages.js。各関数の locale / timeZone を省くと日本語・日本時間（従来どおり）。
// ここは文面の枠だけを作る。中身（件数・月・日付）は各テンプレートが数値と日付だけで作る。氏名・金額・記録の内容は扱わない。
import { ALL_LABELS, DEFAULT_TIME_ZONE, FRAME_MESSAGES, frameLocale, messagesOf } from './messages.js'

const JA = FRAME_MESSAGES.ja
export const APPROVAL_LABEL = JA.labels.approval
export const CONSULT_LABEL = JA.labels.consult
export const REPORT_LABEL = JA.labels.report
export const HELP_LABEL = JA.labels.help
/** 意図。info 以外（action / urgent / approval / consult）は「▶ お願いしたいこと」で結ぶ。 */
export const INTENTS = Object.freeze(['info', 'action', 'urgent', 'approval', 'consult'])
const INTENT_LABELS_BY_LOCALE = Object.freeze(Object.fromEntries(Object.entries(FRAME_MESSAGES)
  .map(([locale, m]) => [locale, Object.freeze(Object.fromEntries(INTENTS.map((i) => [i, m.labels[i]])))])))
/** 日本語の意図のラベル（従来の定数）。言語ごとは intentLabels(locale)。 */
export const INTENT_LABELS = INTENT_LABELS_BY_LOCALE.ja
/** その言語の意図のラベル（{ info, action, urgent, approval, consult }）。 */
export const intentLabels = (locale) => INTENT_LABELS_BY_LOCALE[frameLocale(locale)]
/** その言語のラベル一式（意図の 5 つに report・help を加えたもの）。 */
export const frameLabels = (locale) => messagesOf(locale).labels
const escapeRe = (text) => String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
/**
 * 秘書のラベルで始まる文（【アプリ名】の付け忘れ判定で「既に【…】で始まる」とみなさない）。3 つの言語のどのラベルも：
 * 【ご報告】…【ご案内】、[FYI] [Action needed] … [How to]、【通知】【请处理】…【使用说明】。
 */
export const SECRETARY_LABEL_RE = new RegExp(`^(${ALL_LABELS.map(escapeRe).join('|')})`)
export const DEFAULT_INFO_NOTE = JA.infoNote
export const DEFAULT_ASK = JA.defaultAsk
/** 署名のアプリ名の既定（空：「— AI 秘書」）。各プラグインはレジストリのアプリケーション名（app.name）を signatureOf に渡す。 */
export const DEFAULT_SECRETARY_NAME = ''
export const LINK_LEAD = JA.linkLead

export const normalizeIntent = (intent) => (INTENTS.includes(intent) ? intent : 'info')

/** 1 行目のラベルから意図を引く（【承認のお願い】/ [For your approval] / 【请审批】→ approval など。定時の報告・ラベル無しは info）。 */
export function intentOfHead(head) {
  const text = String(head ?? '')
  for (const labels of Object.values(INTENT_LABELS_BY_LOCALE)) {
    const hit = INTENTS.find((intent) => intent !== 'info' && text.startsWith(labels[intent]))
    if (hit) return hit
  }
  return 'info'
}

/** ラベルと件名をつなぐ（英語のラベル「[…]」の後ろには空白を 1 つ。【…】はそのまま続ける）。 */
export function labelled(label, title) {
  const head = String(label ?? '')
  const rest = title ? String(title) : ''
  return rest && /\]$/.test(head) && !/^\s/.test(rest) ? `${head} ${rest}` : `${head}${rest}`
}

/** timeZone の壁時計の時（0〜23）。 */
export function wallHour(nowMs, timeZone = DEFAULT_TIME_ZONE) {
  const at = Number.isFinite(nowMs) ? nowMs : Date.now()
  let hour
  try {
    hour = new Intl.DateTimeFormat('en-US', { timeZone, hour: '2-digit', hourCycle: 'h23' }).format(new Date(at))
  } catch {
    hour = new Intl.DateTimeFormat('en-US', { timeZone: DEFAULT_TIME_ZONE, hour: '2-digit', hourCycle: 'h23' }).format(new Date(at))
  }
  return Number(hour) % 24
}

/**
 * 送る時刻（timeZone の壁時計。既定は日本時間）のあいさつ。名前は使わない。
 *   ja：5:00〜9:59 おはようございます、10:00〜20:59 お疲れさまです、21:00〜4:59 夜分に失礼します（夜に届くのは、おやすみ時間
 *       （通知を控える時間帯）の対象外の通知か、おやすみ時間を設定していない人だけ）
 *   en：5:00〜11:59 Good morning.、12:00〜17:59 Good afternoon.、18:00〜20:59 Good evening.、21:00〜4:59 Sorry for the late message.
 *   zh：5:00〜9:59 早上好。、10:00〜17:59 您好。、18:00〜20:59 晚上好。、21:00〜4:59 抱歉这么晚打扰您。
 */
export function greetingAt(nowMs, { timeZone = DEFAULT_TIME_ZONE, locale } = {}) {
  return messagesOf(locale).greeting(wallHour(nowMs, timeZone))
}

const optionsArg = (value) => (typeof value === 'string' ? { locale: value } : value && typeof value === 'object' ? value : {})

/**
 * 署名（1 行）：`— <アプリ名> AI 秘書`。アプリ名が無ければ `— AI 秘書`。
 * AI 社員の呼び名（プロフィール、docs/AI_EMPLOYEE_PROFILE.md）があれば `— <呼び名>（<アプリ名> AI 秘書）`（AI であることは常に示す、D8）。
 * en：`— <name> AI assistant` / `— <nickname> (<name> AI assistant)`、zh：`— <名称> AI 助理` / `— <昵称>（<名称> AI 助理）`。
 * @param options  { locale } か locale の文字列（既定 ja）
 */
export const signatureOf = (appName, nickname, options) => {
  const m = messagesOf(optionsArg(options).locale)
  const name = String(appName || DEFAULT_SECRETARY_NAME || '').trim()
  const nick = String(nickname ?? '').replace(/\s+/g, ' ').trim().slice(0, 20)
  return m.signature(nick, m.role(name))
}

/** まとめ送信の一言（1 件なら ''）。 */
export const bundleLine = (count, locale) => (Number.isInteger(count) && count > 1 ? messagesOf(locale).bundle(count) : '')

/** ISO 時刻 → timeZone の 'MM/DD HH:MM'（読めなければ undefined）。 */
export function monthDayTime(value, timeZone = DEFAULT_TIME_ZONE) {
  const t = typeof value === 'number' ? value : Date.parse(String(value ?? ''))
  if (!Number.isFinite(t)) return undefined
  let parts
  try {
    parts = new Intl.DateTimeFormat('en-US', { timeZone, month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(t))
  } catch {
    return undefined
  }
  const p = Object.fromEntries(parts.map((x) => [x.type, x.value]))
  return `${p.month}/${p.day} ${String(Number(p.hour) % 24).padStart(2, '0')}:${p.minute}`
}

/** 「▶ お願いしたいこと（<due>）：<ask>」の行（en「▶ What I'd like you to do (<due>): 」、zh「▶ 需要您做的（<due>）：」）。 */
export const askLine = (ask, { due, locale } = {}) => {
  const m = messagesOf(locale)
  return `${m.ask(due)}${String(ask || m.defaultAsk)}`
}

/** あいさつと続きの文を 1 行に（en は空白を挟む）。 */
export const greetAnd = (hello, text, locale) => (hello && text ? `${hello}${messagesOf(locale).space}${text}` : `${hello ?? ''}${text ?? ''}`)

/**
 * 1 通の文面を組み立てる。
 * @param input.intent   'info' | 'action' | 'urgent' | 'approval' | 'consult'（それ以外は info）
 * @param input.title    件名（ラベルの後ろ。例：訪問記録の承認待ち）
 * @param input.lead     事実の文（件数・日付だけ）
 * @param input.ask      info 以外：お願いしたいこと（何を・どこで）
 * @param input.due      目安・期限（例：本日中 / 期限 10/28 / 10/26 18:00 まで）。日付を作らない：params にあるものだけ
 * @param input.note     info の結びの一言（既定「ご対応は不要です。ご確認だけお願いします。」）
 * @param input.count    束ねた件数（2 以上なら「N 件まとめてお知らせします」）
 * @param input.locale   枠の言語（'ja' | 'en' | 'zh' か BCP 47。既定 ja）。timeZone はあいさつの時刻（既定 Asia/Tokyo）
 * @returns {{ intent, label, title, text, body, url, lines, signature }}  title = ラベル付きの件名（カードの件名）、
 *   text = あいさつ〜署名、body = 文字だけで送るときの全文（件名・リンク・署名を含む）、
 *   lines = カードの本文の行（署名なし）、signature = 署名（カードでは footer。dsh-im は文字だけのプラットフォームでも
 *   件名 / 本文 / リンク / footer の順に出すので、同じ文を textFallback に重ねない）
 */
export function frameMessage({ intent, title, lead, ask, due, note, url = null, count = 1, now = Date.now(), timeZone = DEFAULT_TIME_ZONE, locale, signature, label } = {}) {
  const m = messagesOf(locale)
  const kind = normalizeIntent(intent)
  const tag = label ?? m.labels[kind]
  const head = labelled(tag, title)
  const hello = greetingAt(now, { timeZone, locale })
  const bundle = bundleLine(count, locale)
  const fact = String(lead ?? '').trim()
  const opening = bundle ? [greetAnd(hello, bundle, locale), fact] : [greetAnd(hello, fact, locale)]
  const close = kind === 'info' ? String(note || m.infoNote) : askLine(ask, { due, locale })
  const sign = signature ?? signatureOf(undefined, undefined, { locale })
  const lines = [...opening, close].filter(Boolean)
  return {
    intent: kind,
    label: tag,
    title: head,
    text: [...lines, sign].join('\n'),
    body: [head, ...lines, url ? `${m.linkLead}${url}` : '', sign].filter(Boolean).join('\n'),
    url: url || null,
    lines,
    signature: sign,
  }
}

/**
 * dsh-im のカード（ボタン無しの通知）：件名・本文（署名なし）・リンク（ボタン）・footer（署名）。textFallback は付けない
 * （dsh-im は Lark（飛書）と文字だけのプラットフォームで textFallback を本文の後ろに足すため、同じ文が 2 回出る）。
 * @param message  frameMessage / frameAiText の返り値（lines・signature が無い古い形は text を本文、body を textFallback に）
 * @param options.locale  リンクのボタンの言語（既定 ja）
 */
export function noticeCard(message, { linkLabel, locale } = {}) {
  const hasLines = Array.isArray(message?.lines)
  const words = messagesOf(locale).linkLabel
  const label = linkLabel ?? (message?.intent && message.intent !== 'info' ? words.action : words.info)
  return {
    title: String(message?.title ?? ''),
    fields: [],
    body: hasLines ? message.lines.join('\n') : String(message?.text ?? ''),
    actions: [],
    ...(message?.url ? { link: { label, url: message.url } } : {}),
    ...(hasLines && message.signature ? { footer: message.signature } : { textFallback: String(message?.body ?? message?.text ?? '') }),
  }
}

/**
 * AI（LLM）が書いた報告を同じ形にそろえる（自動タスクの summary など）。先頭が秘書のラベル（どの言語でも）ならその行を件名にし、
 * 無ければ status（needsDecision → 対応のお願い、それ以外 → ご報告）と fallbackTitle で件名を作る。
 * 本文の前にあいさつ、最後に署名（既にあれば足さない）。本文の中身は変えない。locale はラベル・あいさつ・署名の言語（既定 ja）。
 */
export function frameAiText(text, { status, fallbackTitle = '', now = Date.now(), timeZone = DEFAULT_TIME_ZONE, locale, signature } = {}) {
  const m = messagesOf(locale)
  const raw = String(text ?? '').replace(/\r\n/g, '\n').trim()
  const sign = signature ?? signatureOf(undefined, undefined, { locale })
  let head
  let rest
  if (SECRETARY_LABEL_RE.test(raw)) {
    const nl = raw.indexOf('\n')
    head = (nl < 0 ? raw : raw.slice(0, nl)).trim()
    rest = nl < 0 ? '' : raw.slice(nl + 1).trim()
  } else {
    head = labelled(m.labels[status === 'needsDecision' ? 'action' : 'info'], fallbackTitle)
    rest = raw
  }
  // AI が署名まで書いていたら外して、最後に 1 回だけ付ける
  rest = rest.split('\n').filter((line) => line.trim() !== sign).join('\n').trim()
  // AI が自分であいさつを書いていたら重ねない
  const hello = m.greetingRe.test(rest) ? '' : greetingAt(now, { timeZone, locale })
  // 本文が「▶ お願いしたいこと」から始まるときは、あいさつを 1 行にする
  const lines = !rest ? [hello || greetingAt(now, { timeZone, locale })] : rest.startsWith('▶') && hello ? [hello, rest] : [greetAnd(hello, rest, locale)]
  const intent = intentOfHead(head)
  return { intent, title: head, text: [...lines, sign].join('\n'), body: [head, ...lines, sign].join('\n'), lines, signature: sign, url: null }
}
