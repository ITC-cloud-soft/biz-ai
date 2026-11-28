// The words of bridge-assistant that a person sees in the assistant panel of the business web app, in the three languages
// of the framework (ja / en / zh): the default question for a message with files only, the errors of a turn, the default
// AI employee's name and description, and the DSH session title. The language is the business system's (its manifest's
// system.locale, @dsh-bridge/dsh-core localeOf(app)); no manifest → ja. What only the model reads (the attachment and
// context blocks of the prompt) stays as it is.
import { frameLocale } from '@dsh-bridge/dsh-core'

const ja = Object.freeze({
  attachmentText: '添付した資料について説明してください。',
  sessionTitle: 'AIアシスタント（{application}・職員 {user}）',
  agents: Object.freeze({ assistant: Object.freeze({ name: 'AI アシスタント', description: '業務の質問に、あなたの権限の範囲で答えます。確定・承認はしません。' }) }),
  errors: Object.freeze({
    noResponse: 'AI の応答がありませんでした。もう一度お試しください。',
    noImages: 'この AI のモデルは画像を読めません。画像を外して送ってください。',
    attachmentRefused: '添付ファイルを AI に渡せませんでした（大きさ・形式）。',
    sendFailed: 'AI に送信できませんでした。しばらくしてからもう一度お試しください。',
    stopped: '回答を停止しました。',
    aborted: 'AI の処理が途中で終了しました。もう一度お試しください。',
  }),
  emptyAnswer: '（回答の本文はありませんでした）',
})

const en = Object.freeze({
  attachmentText: 'Please explain the attached files.',
  sessionTitle: 'AI assistant ({application}, employee {user})',
  agents: Object.freeze({ assistant: Object.freeze({ name: 'AI assistant', description: 'Answers your business questions within your permissions. It never finalizes or approves anything.' }) }),
  errors: Object.freeze({
    noResponse: 'The AI did not respond. Please try again.',
    noImages: 'The AI model cannot read images. Please remove the images and send again.',
    attachmentRefused: 'The attached files could not be passed to the AI (size or format).',
    sendFailed: 'The message could not be sent to the AI. Please try again in a little while.',
    stopped: 'The answer was stopped.',
    aborted: 'The AI stopped before finishing. Please try again.',
  }),
  emptyAnswer: '(The answer had no text.)',
})

const zh = Object.freeze({
  attachmentText: '请说明附件中的资料。',
  sessionTitle: 'AI 助理（{application}・员工 {user}）',
  agents: Object.freeze({ assistant: Object.freeze({ name: 'AI 助理', description: '在您的权限范围内回答业务问题。不做确定或审批。' }) }),
  errors: Object.freeze({
    noResponse: 'AI 没有响应。请再试一次。',
    noImages: '此 AI 模型无法读取图片。请移除图片后再发送。',
    attachmentRefused: '附件无法交给 AI（大小或格式）。',
    sendFailed: '无法发送给 AI。请稍后再试。',
    stopped: '已停止回答。',
    aborted: 'AI 的处理中途结束了。请再试一次。',
  }),
  emptyAnswer: '（回答没有正文）',
})

export const MESSAGES = Object.freeze({ ja, en, zh })
export const messagesFor = (locale) => MESSAGES[frameLocale(locale)]
