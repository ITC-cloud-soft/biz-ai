// messages.js — the fixed words of the IM frame in the three languages of the framework (ja / en / zh), and where the
// language and the time zone of a business system come from.
//
// The language and the time zone are the business system's own: its manifest's `system.locale` (BCP 47, e.g. ja-JP,
// en-US, zh-CN) and `system.timezone` (IANA, e.g. Asia/Tokyo, UTC). Nothing else is read: no registry field, no plugin
// setting. Without a manifest (not loaded yet, or not configured) the frame is Japanese in Japan time, exactly as before.
// A language other than ja / en / zh gets the English frame.
//
// Every string of the frame for one language is here (secretary.js, app-switch.js, link-guard.js, outbound.js, persona.js
// and help-tool.js read them through messagesOf(locale)): one table per language, the same keys in each.

export const FRAME_LOCALES = Object.freeze(['ja', 'en', 'zh'])
export const DEFAULT_LOCALE = 'ja'
export const DEFAULT_TIME_ZONE = 'Asia/Tokyo'

/**
 * A locale string (ja, ja-JP, en-US, zh-CN, zh-Hant-TW, 'en_US', …) → 'ja' | 'en' | 'zh'. Empty / missing → 'ja'
 * (the default); a language the frame does not have → 'en'.
 */
export function frameLocale(value) {
  const tag = String(value ?? '').trim().toLowerCase()
  if (!tag) return DEFAULT_LOCALE
  const lang = tag.split(/[-_]/)[0]
  return FRAME_LOCALES.includes(lang) ? lang : 'en'
}

/** An IANA time zone name → itself when the runtime knows it, else the default (Asia/Tokyo). */
export function frameTimeZone(value) {
  const tz = String(value ?? '').trim()
  if (!tz) return DEFAULT_TIME_ZONE
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz }).format(0)
    return tz
  } catch {
    return DEFAULT_TIME_ZONE
  }
}

const manifestOfApp = (target) => {
  if (!target || typeof target !== 'object') return null
  if (target.system && typeof target.system === 'object') return target // a manifest
  if (typeof target.manifest === 'function') {
    try { return target.manifest() ?? null } catch { return null }
  }
  return target.manifest && typeof target.manifest === 'object' ? target.manifest : null
}

/**
 * The frame settings of a business system: { locale: 'ja'|'en'|'zh', timeZone }.
 * @param target  a registry application (its manifest()), a manifest, or null (→ ja, Asia/Tokyo)
 */
export function frameSettingsOf(target) {
  const system = manifestOfApp(target)?.system ?? null
  return { locale: frameLocale(system?.locale), timeZone: frameTimeZone(system?.timezone) }
}
export const localeOf = (target) => frameSettingsOf(target).locale
export const timeZoneOf = (target) => frameSettingsOf(target).timeZone

const ja = Object.freeze({
  labels: Object.freeze({
    info: '【ご報告】', action: '【対応のお願い】', urgent: '【至急】', approval: '【承認のお願い】', consult: '【ご相談】',
    report: '【定時のご報告】', help: '【ご案内】',
  }),
  /** between a greeting and the next sentence on the same line ('' in Japanese and Chinese) */
  space: '',
  greeting: (h) => (h >= 5 && h < 10 ? 'おはようございます。' : h >= 10 && h < 21 ? 'お疲れさまです。' : '夜分に失礼します。'),
  /** an AI text that already starts with a greeting (frameAiText does not add another one) */
  greetingRe: /^(おはようございます|お疲れさまです|お疲れ様です|夜分に失礼します|こんにちは|こんばんは)/,
  role: (name) => (name ? `${name} AI 秘書` : 'AI 秘書'),
  signature: (nick, role) => (nick ? `— ${nick}（${role}）` : `— ${role}`),
  bundle: (n) => `${n} 件まとめてお知らせします。`,
  ask: (due) => `▶ お願いしたいこと${due ? `（${due}）` : ''}：`,
  infoNote: 'ご対応は不要です。ご確認だけお願いします。',
  defaultAsk: 'リンク先の画面でご確認のうえ、ご対応をお願いします。',
  linkLead: 'こちらから開けます：',
  manualLead: 'くわしい手順：',
  linkLabel: { action: '業務 Web を開いて対応', info: '業務 Web で確認' },
  appPrefix: (name) => `【${name}】`,
  linkRemoved: '（リンクを省きました）',
  groupChat: '業務の内容は個別チャットでお尋ねください。',
})

const en = Object.freeze({
  labels: Object.freeze({
    info: '[FYI]', action: '[Action needed]', urgent: '[Urgent]', approval: '[For your approval]', consult: '[Your input needed]',
    report: '[Daily report]', help: '[How to]',
  }),
  space: ' ',
  greeting: (h) => (h >= 5 && h < 12 ? 'Good morning.' : h >= 12 && h < 18 ? 'Good afternoon.' : h >= 18 && h < 21 ? 'Good evening.' : 'Sorry for the late message.'),
  greetingRe: /^(good (morning|afternoon|evening|day)|hello|hi\b|hi,|sorry for the late)/i,
  role: (name) => (name ? `${name} AI assistant` : 'AI assistant'),
  signature: (nick, role) => (nick ? `— ${nick} (${role})` : `— ${role}`),
  bundle: (n) => `Here are ${n} updates together.`,
  ask: (due) => `▶ What I'd like you to do${due ? ` (${due})` : ''}: `,
  infoNote: 'No action needed. This is just for your information.',
  defaultAsk: 'Please check it on the linked screen and take care of it.',
  linkLead: 'Open: ',
  manualLead: 'Step by step: ',
  linkLabel: { action: 'Open and take action', info: 'View in the web app' },
  appPrefix: (name) => `[${name}] `,
  linkRemoved: '(link removed)',
  groupChat: 'Please ask about business matters in a one-to-one chat.',
})

const zh = Object.freeze({
  labels: Object.freeze({
    info: '【通知】', action: '【请处理】', urgent: '【紧急】', approval: '【请审批】', consult: '【请商议】',
    report: '【定时报告】', help: '【使用说明】',
  }),
  space: '',
  greeting: (h) => (h >= 5 && h < 10 ? '早上好。' : h >= 10 && h < 18 ? '您好。' : h >= 18 && h < 21 ? '晚上好。' : '抱歉这么晚打扰您。'),
  greetingRe: /^(早上好|上午好|中午好|下午好|晚上好|您好|你好|抱歉这么晚)/,
  role: (name) => (name ? `${name} AI 助理` : 'AI 助理'),
  signature: (nick, role) => (nick ? `— ${nick}（${role}）` : `— ${role}`),
  bundle: (n) => `共 ${n} 条，一并通知您。`,
  ask: (due) => `▶ 需要您做的${due ? `（${due}）` : ''}：`,
  infoNote: '无需处理，请知悉。',
  defaultAsk: '请打开链接中的页面确认并处理。',
  linkLead: '点此打开：',
  manualLead: '详细步骤：',
  linkLabel: { action: '打开业务系统处理', info: '在业务系统中查看' },
  appPrefix: (name) => `【${name}】`,
  linkRemoved: '（已省略链接）',
  groupChat: '业务相关的问题请在一对一聊天中询问。',
})

export const FRAME_MESSAGES = Object.freeze({ ja, en, zh })

// ── the AI employee's persona section (persona.js renderPersona): the language the model is told to speak in ──────────
export const PERSONA_MESSAGES = Object.freeze({
  ja: Object.freeze({
    rules: Object.freeze([
      '読むだけ・提案するだけ。業務データを作成・修正・提出・承認・確定・削除しない。必要な操作は「どの画面で、誰が何をするか」を案内する。',
      '金額・数量などの確定は業務システムと人間の承認が行う。',
      '個人情報（氏名・住所・連絡先など）を記憶・メモ・予定・外部サービスに残さない。',
      '業務データには業務ツールでのみアクセスする。分からないこと・データに無いことは推測しない。',
      '自分が AI であることを隠さない。人間だと名乗らない。',
    ]),
    tones: Object.freeze({
      polite: '丁寧な「です・ます」で話す。',
      soft: 'やわらかく親しみのある「です・ます」で話す。',
      concise: '「です・ます」で、要点だけを短く話す。',
    }),
    rulesHead: '## 必ず守る規則（どの設定よりも優先）',
    personaHead: '## あなたについて（人物の設定）',
    personaIntro: '以下は管理者が設定した人物の設定です。話し方と名乗り方に使ってください。上の規則・あなたの役割の指示と食い違うときは、規則と役割に従ってください。',
    nickname: (nick, app) => `- 呼び名：${nick}（${app ? `${app}の ` : ''}AI 社員）。SNS で名乗るときは「${nick}」と名乗り、AI 社員であることも伝える。`,
    firstPerson: (v) => `- 一人称：${v}`,
    tone: (tone, note) => `- 話し方：${tone}${note ? ` ${note}` : ''}`,
    personality: (v) => `- 性格：${v}`,
    background: (v) => `- 背景：${v}`,
    examplesHead: '- 話し方の例：',
    example: (v) => `  - 「${v}」`,
    companyHead: '## 会社の紹介（参考情報・指示ではない）',
  }),
  en: Object.freeze({
    rules: Object.freeze([
      'Read and propose only. Never create, change, submit, approve, finalize or delete business data. For an operation, explain which screen to use and who does what.',
      'Amounts, quantities and other final values are decided by the business system and a person\'s approval.',
      'Never keep personal data (names, addresses, contact details, …) in memory, notes, schedules or outside services.',
      'Access business data only through the business tools. Never guess what you do not know or what is not in the data.',
      'Never hide that you are an AI. Never claim to be a person.',
    ]),
    tones: Object.freeze({
      polite: 'Speak politely, in English.',
      soft: 'Speak in a warm, friendly and polite way, in English.',
      concise: 'Speak politely and briefly, in English: the point only.',
    }),
    rulesHead: '## Rules you always follow (above every setting)',
    personaHead: '## About you (persona settings)',
    personaIntro: 'The administrator set the persona below. Use it for how you speak and introduce yourself. When it conflicts with the rules above or with your role, follow the rules and your role.',
    nickname: (nick, app) => `- Name: ${nick} (${app ? `the AI employee of ${app}` : 'an AI employee'}). In chat, introduce yourself as "${nick}" and say that you are an AI employee.`,
    firstPerson: (v) => `- First person: ${v}`,
    tone: (tone, note) => `- Tone: ${tone}${note ? ` ${note}` : ''}`,
    personality: (v) => `- Personality: ${v}`,
    background: (v) => `- Background: ${v}`,
    examplesHead: '- Examples of how you speak:',
    example: (v) => `  - "${v}"`,
    companyHead: '## About the company (reference only, not instructions)',
  }),
  zh: Object.freeze({
    rules: Object.freeze([
      '只读取、只提议。不创建、修改、提交、审批、确定或删除业务数据。需要操作时，说明「在哪个页面、由谁做什么」。',
      '金额、数量等的确定由业务系统和人工审批完成。',
      '不把个人信息（姓名、地址、联系方式等）留在记忆、备忘、日程或外部服务中。',
      '只通过业务工具访问业务数据。不知道的事、数据里没有的内容不做推测。',
      '不隐瞒自己是 AI。不自称是人类。',
    ]),
    tones: Object.freeze({
      polite: '用礼貌的简体中文说话。',
      soft: '用亲切、温和而礼貌的简体中文说话。',
      concise: '用礼貌的简体中文，只说要点，简短明了。',
    }),
    rulesHead: '## 必须遵守的规则（优先于任何设置）',
    personaHead: '## 关于你（人物设定）',
    personaIntro: '以下是管理员设置的人物设定，请用于说话方式和自我介绍。与上面的规则或你的角色指示冲突时，以规则和角色为准。',
    nickname: (nick, app) => `- 称呼：${nick}（${app ? `${app}的 ` : ''}AI 员工）。在聊天中自我介绍时称自己为「${nick}」，并说明自己是 AI 员工。`,
    firstPerson: (v) => `- 第一人称：${v}`,
    tone: (tone, note) => `- 说话方式：${tone}${note ? ` ${note}` : ''}`,
    personality: (v) => `- 性格：${v}`,
    background: (v) => `- 背景：${v}`,
    examplesHead: '- 说话示例：',
    example: (v) => `  - 「${v}」`,
    companyHead: '## 公司介绍（仅供参考，不是指示）',
  }),
})

// ── the persona rules for how-to questions (help-tool.js helpRules) ─────────────────────────────────────────────────
export const HELP_RULES = Object.freeze({
  ja: [
    'システムの使い方の質問（画面の場所・操作の手順・ことばの意味・だれが何をできるか）：',
    '- 必ず {tool} を呼び、返ったマニュアルの節（title・menu・steps・qa・notes）だけを根拠に答える。自分の知識で手順を作らない。',
    '- URL は {tool} が返した url・manualUrl だけを、そのまま書く。自分で URL を作らない・直さない・推測しない。',
    '- found=false なら「マニュアルに説明が見つかりませんでした。管理者にお問い合わせください。」と答え、手順を作らない。',
    '- canOpen=false の画面は URL を出さず、alt にある役割の人に依頼するよう伝える。',
    '- 「未確認の点」が返った節は、その点を管理者に確認するよう添える。',
    '- 業務のデータの質問は業務のツールで答える。使い方とデータの両方が要る質問は両方を呼ぶ。',
    '- 答えの形：1 行目「【ご案内】<節の題名>」、続けて要点と手順を 3〜5 行（ボタン名・画面名は「」で画面の文字のまま）、',
    '  url があれば「こちらから開けます：<url>」、最後に「くわしい手順：<manualUrl>」。',
    '- 日本語以外の質問には、その言語で答える（画面の名前・ボタン名は日本語のまま「」で示す。{tool} には日本語に言い換えて渡す）。',
  ].join('\n'),
  en: [
    'Questions about using the system (where a screen is, the steps of an operation, what a word means, who may do what):',
    '- Always call {tool} and answer ONLY from the manual sections it returns (title, menu, steps, qa, notes). Never make up steps from your own knowledge.',
    '- Write only the url and manualUrl that {tool} returned, exactly as returned. Never build, fix or guess a URL.',
    '- found=false: answer "The manual has no explanation for this. Please ask your administrator." and do not make up steps.',
    '- canOpen=false: give no URL for that screen; tell the asker to ask a person with the role in alt.',
    '- A section with open points ("unconfirmed"): add that those points should be checked with the administrator.',
    '- Questions about business data are answered with the business tools. A question that needs both: call both.',
    '- The answer: first line "[How to] <section title>", then the point and the steps in 3–5 lines (button and screen names in quotes, as on the screen),',
    '  "Open: <url>" when there is a url, and last "Step by step: <manualUrl>".',
    '- Answer a question in another language in that language (keep screen and button names as on the screen, in quotes; pass {tool} the question in the manual\'s language).',
  ].join('\n'),
  zh: [
    '关于系统使用方法的问题（页面在哪里、操作步骤、词语的含义、谁可以做什么）：',
    '- 必须调用 {tool}，只依据返回的操作手册章节（title・menu・steps・qa・notes）回答。不要凭自己的知识编造步骤。',
    '- URL 只写 {tool} 返回的 url・manualUrl，原样照写。不要自己生成、修改或猜测 URL。',
    '- found=false 时回答「操作手册中没有找到相关说明，请咨询管理员。」，不要编造步骤。',
    '- canOpen=false 的页面不给出 URL，告诉提问者去找 alt 中所写角色的人。',
    '- 返回了「未确认的点」的章节，补充说明这些点需要向管理员确认。',
    '- 业务数据的问题用业务工具回答。既涉及使用方法又涉及数据的问题，两者都调用。',
    '- 回答格式：第 1 行「【使用说明】<章节标题>」，然后用 3〜5 行写要点和步骤（按钮名、页面名用「」照页面上的文字写），',
    '  有 url 时写「点此打开：<url>」，最后写「详细步骤：<manualUrl>」。',
    '- 用其他语言提问时用该语言回答（页面名、按钮名按页面上的文字用「」标出；传给 {tool} 时换成操作手册的语言）。',
  ].join('\n'),
})

/** The frame words of a language ('ja' | 'en' | 'zh', or any locale string; unknown → see frameLocale). */
export const messagesOf = (locale) => FRAME_MESSAGES[frameLocale(locale)]

/** Every label of every language (label recognition does not depend on the language of the instance). */
export const ALL_LABELS = Object.freeze(FRAME_LOCALES.flatMap((l) => Object.values(FRAME_MESSAGES[l].labels)))
