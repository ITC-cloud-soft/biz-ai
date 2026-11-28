// messages.js — every fixed word bridge-notify writes to people, in the three languages of the framework (ja / en / zh).
// The language is the business system's (its manifest's system.locale, @dsh-bridge/dsh-core localeOf / frameSettingsOf);
// without a manifest it is Japanese, exactly as before. The frame itself (labels, greeting, signature, link line) is
// @dsh-bridge/dsh-core's; here are only the sentences bridge-notify adds.
import { frameLocale, frameLabels, signatureOf } from '@dsh-bridge/dsh-core'

/** The default keyword of the AI report command per language (all three are accepted while the setting is the default). */
export const REPORT_COMMANDS = Object.freeze({ ja: '定時報告', en: 'daily report', zh: '定时报告' })

/** The words after the keyword (any language): on / off / test, the rest (and nothing) = status. */
export const COMMAND_WORDS = Object.freeze({
  on: Object.freeze(['オン', 'on', '開始', '有効', '开启', '打开', '开始']),
  off: Object.freeze(['オフ', 'off', '停止', '無効', '关闭']),
  test: Object.freeze(['テスト', 'test', '测试']),
  status: Object.freeze(['状態', '確認', 'status', '状态', '查看']),
})

const tzJa = (tz) => (tz === 'Asia/Tokyo' ? '日本時間' : tz)

const ja = Object.freeze({
  fallback: Object.freeze({ title: 'お知らせ', text: '業務 Web に新しいお知らせがあります。' }),
  reportOpening: '現在の業務状況をご報告します。',
  audience: Object.freeze({
    needsDecision: Object.freeze({ lead: 'AI が自動処理で、確認していただきたい内容をまとめました。', ask: '業務 Web で内容をご確認のうえ、ご対応をお願いします。' }),
    failed: Object.freeze({ lead: 'AI の自動処理を完了できませんでした。', note: '詳しい内容は業務 Web でご確認ください。' }),
    done: Object.freeze({ lead: 'AI の自動処理が完了しました。' }),
  }),
  report: Object.freeze({
    templateLead: '定時業務報告の時刻になりました。最新の状況は業務 Web のダッシュボードでご確認ください。',
    targetName: '定時業務報告（AI 社員）',
    prompt: ({ namespace, name, signature }) => `定時業務報告の時刻です。${namespace}_* のツールで最新の業務状況を確認し、必ず 1 通だけ、${name}の AI 秘書として担当者への簡潔な報告を日本語で返してください。`
      + '1 行目は「【定時のご報告】」と日時、次に時刻に合ったあいさつ（名前は書かない）。「■ 対応が必要なこと」（件数が 1 以上で誰かが対応するものだけ。役割名と、何をするかをお願いの形で）と'
      + `「■ ご参考」（情報だけ）を分け、対応が必要なものが無ければそう一言添える。最後の行は「${signature}」。`
      + '氏名・個人の情報・自由記述は書かない。件数はツールの結果どおりに書き、推測で補わない。この報告では proactive_reclaim を使わない。',
    systemName: '業務システム',
  }),
  // 会話の返事（ラベルは付けない。AI 秘書の口調で、次にできることを添える）
  replies: Object.freeze({
    enabled: (times, delivery, tz, k) => `承知しました。定時業務報告をオンにしました（毎日 ${times.join('・')}、${tzJa(tz)}）。この会話にご報告します。`
      + (delivery === 'im' ? '' : '（このチャンネルでは報告を自動で転送できないため、DSH の会話にだけ残ります）')
      + `止めるときは「${k} オフ」、今すぐ試すときは「${k} テスト」と送ってください。`,
    disabled: (n, k) => (n ? `承知しました。定時業務報告をオフにしました。また必要になったら「${k} オン」と送ってください。` : `定時業務報告は設定されていません。始めるときは「${k} オン」と送ってください。`),
    status: (times, k) => (times.length ? `定時業務報告はオンです（毎日 ${times.join('・')}）。この時刻にこの会話へご報告します。` : `定時業務報告はオフです。「${k} オン」で始められます。`),
    fired: '定時業務報告を今すぐ 1 回起動しました。まとまり次第、この会話にお届けします。',
    notEnabled: (k) => `定時業務報告がオフになっています。先に「${k} オン」と送ってください。`,
    notLinked: 'このアカウントはまだ業務システムと連携していません。お手数ですが、業務Webで SNS 連携をしてから、もう一度お試しください。',
    role: '申し訳ありません。定時業務報告は、設定された役割（管理者・責任者など）の方だけが設定できます。',
    direct: '定時業務報告の設定は、ボットとの個別チャットでお願いします。',
    noSession: (k) => `お手数ですが、まずこの会話で AI 社員に一度話しかけてから、もう一度「${k} オン」と送ってください。`,
    noTimes: '報告の時刻がまだ設定されていません（業務システムの定時報告の設定、または manifest の reports）。管理者に設定をご依頼ください。',
    unavailable: '申し訳ありません。この環境では定時の呼び出し（dsh-proactive）が使えません。管理者にご連絡ください。',
    failed: '申し訳ありません。定時業務報告の設定に失敗しました。時間をおいて再度お試しいただくか、管理者にご連絡ください。',
    noApplication: '申し訳ありません。このボットはどの業務システムにも割り当てられていません。管理者にご連絡ください。',
  }),
})

const en = Object.freeze({
  fallback: Object.freeze({ title: 'Update', text: 'There is a new update in the web app.' }),
  reportOpening: 'Here is the current status.',
  audience: Object.freeze({
    needsDecision: Object.freeze({ lead: 'An automatic AI task put together something for you to check.', ask: 'Please review it in the web app and take care of it.' }),
    failed: Object.freeze({ lead: 'An automatic AI task could not be completed.', note: 'See the details in the web app.' }),
    done: Object.freeze({ lead: 'An automatic AI task has finished.' }),
  }),
  report: Object.freeze({
    templateLead: 'It is time for the daily report. Please check the latest status on the dashboard of the web app.',
    targetName: 'Daily report (AI employee)',
    prompt: ({ namespace, name, signature, label }) => `It is time for the daily business report. Check the latest status with the ${namespace}_* tools and reply with exactly one short report to the person in charge, as the AI assistant of ${name}, in English. `
      + `First line: "${label}" and the date and time; then a greeting for the time of day (no names). Separate "■ Needs action" (only items with a count of 1 or more that someone must handle: the role and what to do, as a request) `
      + `from "■ FYI" (information only); if nothing needs action, say so in one sentence. The last line is "${signature}". `
      + 'Never write names, personal data or free text. Write the counts exactly as the tools return them; never guess. Do not use proactive_reclaim in this report.',
    systemName: 'the business system',
  }),
  replies: Object.freeze({
    enabled: (times, delivery, tz, k) => `Done. The daily report is on (every day at ${times.join(', ')}, ${tz}). I will report in this chat.`
      + (delivery === 'im' ? '' : ' (This channel cannot receive reports automatically, so they stay in the DSH conversation only.)')
      + ` To stop, send "${k} off"; to try it now, send "${k} test".`,
    disabled: (n, k) => (n ? `Done. The daily report is off. Send "${k} on" when you need it again.` : `The daily report is not set up. Send "${k} on" to start it.`),
    status: (times, k) => (times.length ? `The daily report is on (every day at ${times.join(', ')}). I report in this chat at those times.` : `The daily report is off. Send "${k} on" to start it.`),
    fired: 'The daily report has started once now. I will send it to this chat when it is ready.',
    notEnabled: (k) => `The daily report is off. Send "${k} on" first.`,
    notLinked: 'This account is not linked to the business system yet. Please link your chat account in the web app and try again.',
    role: 'Sorry, only people with the configured roles (such as administrators and managers) can set up the daily report.',
    direct: 'Please set up the daily report in a one-to-one chat with the bot.',
    noSession: (k) => `Please send any message to the AI employee in this chat first, then send "${k} on" again.`,
    noTimes: 'No report times are set yet (the report settings of the business system, or the reports of its manifest). Please ask your administrator to set them.',
    unavailable: 'Sorry, scheduled wake-ups (dsh-proactive) are not available here. Please contact your administrator.',
    failed: 'Sorry, the daily report could not be set up. Please try again later or contact your administrator.',
    noApplication: 'Sorry, this bot is not assigned to any business system. Please contact your administrator.',
  }),
})

const zh = Object.freeze({
  fallback: Object.freeze({ title: '通知', text: '业务系统中有新的通知。' }),
  reportOpening: '以下是当前的业务状况。',
  audience: Object.freeze({
    needsDecision: Object.freeze({ lead: 'AI 自动处理整理了需要您确认的内容。', ask: '请在业务系统中确认内容并处理。' }),
    failed: Object.freeze({ lead: 'AI 自动处理未能完成。', note: '详细内容请在业务系统中查看。' }),
    done: Object.freeze({ lead: 'AI 自动处理已完成。' }),
  }),
  report: Object.freeze({
    templateLead: '定时业务报告的时间到了。最新状况请在业务系统的仪表盘中查看。',
    targetName: '定时业务报告（AI 员工）',
    prompt: ({ namespace, name, signature, label }) => `现在是定时业务报告的时间。请用 ${namespace}_* 工具确认最新的业务状况，以${name}的 AI 助理的身份，用简体中文给负责人回复且只回复 1 条简洁的报告。`
      + `第 1 行写「${label}」和日期时间，接着写与时间相符的问候（不写姓名）。把「■ 需要处理的事项」（只写件数为 1 以上、需要有人处理的事项：写角色名，并以请求的方式写要做什么）和`
      + `「■ 供参考」（仅信息）分开；如果没有需要处理的事项，用一句话说明。最后一行写「${signature}」。`
      + '不写姓名、个人信息或自由记述。件数按工具的结果照写，不做推测。本报告中不使用 proactive_reclaim。',
    systemName: '业务系统',
  }),
  replies: Object.freeze({
    enabled: (times, delivery, tz, k) => `好的，已开启定时业务报告（每天 ${times.join('、')}，${tz}）。我会在这个聊天中报告。`
      + (delivery === 'im' ? '' : '（此频道无法自动转发报告，报告只会保留在 DSH 的会话中。）')
      + `要停止请发送「${k} 关闭」，要立即试一次请发送「${k} 测试」。`,
    disabled: (n, k) => (n ? `好的，已关闭定时业务报告。需要时请再发送「${k} 开启」。` : `尚未设置定时业务报告。要开始请发送「${k} 开启」。`),
    status: (times, k) => (times.length ? `定时业务报告已开启（每天 ${times.join('、')}）。我会在这些时间向这个聊天报告。` : `定时业务报告已关闭。发送「${k} 开启」即可开始。`),
    fired: '已立即启动一次定时业务报告。整理好后会发到这个聊天。',
    notEnabled: (k) => `定时业务报告处于关闭状态。请先发送「${k} 开启」。`,
    notLinked: '此账号尚未与业务系统关联。请先在业务系统中完成 SNS 关联，然后再试一次。',
    role: '抱歉，只有设置的角色（管理员、负责人等）才能设置定时业务报告。',
    direct: '请在与机器人的一对一聊天中设置定时业务报告。',
    noSession: (k) => `请先在这个聊天中给 AI 员工发一条消息，然后再发送「${k} 开启」。`,
    noTimes: '尚未设置报告时间（业务系统的定时报告设置，或 manifest 的 reports）。请联系管理员设置。',
    unavailable: '抱歉，此环境无法使用定时唤醒（dsh-proactive）。请联系管理员。',
    failed: '抱歉，定时业务报告设置失败。请稍后再试或联系管理员。',
    noApplication: '抱歉，此机器人未分配给任何业务系统。请联系管理员。',
  }),
})

export const MESSAGES = Object.freeze({ ja, en, zh })

/** The words of a language ('ja' | 'en' | 'zh' or a BCP 47 locale; missing → ja). */
export const messagesFor = (locale) => MESSAGES[frameLocale(locale)]

/** The default AI report instructions in the language of the application (namespace, name, signature from the app). */
export function reportPrompt({ locale, namespace = 'app', name, nickname } = {}) {
  const m = messagesFor(locale)
  const sysName = name ?? m.report.systemName
  return m.report.prompt({ namespace, name: sysName, signature: signatureOf(sysName, nickname, { locale }), label: frameLabels(locale).report })
}
