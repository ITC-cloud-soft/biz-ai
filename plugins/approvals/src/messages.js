// messages.js — every user-facing word of bridge-approvals in the three languages of the framework (ja / en / zh).
// The language and the time zone are the business system's (its manifest's system.locale / system.timezone, read with
// @dsh-bridge/dsh-core localeOf / timeZoneOf). Without a manifest: Japanese (the words below under ja, as before).
// The same keys in every language. Reply words (w) are { approve: string[], reject: string[] }: the first word of each is shown.
import { frameLocale, intentLabels, labelled } from '@dsh-bridge/dsh-core'

/** The default words of text replies and of the buttons, per language (a configured replyWords wins). */
export const REPLY_WORDS = Object.freeze({
  ja: Object.freeze({ approve: Object.freeze(['承認']), reject: Object.freeze(['差戻']) }),
  en: Object.freeze({ approve: Object.freeze(['Approve']), reject: Object.freeze(['Reject']) }),
  zh: Object.freeze({ approve: Object.freeze(['批准']), reject: Object.freeze(['驳回']) }),
})

/** The words that cancel a pending 差戻 (any language: the reply that follows a reject button). */
export const CANCEL_WORDS = Object.freeze(new Set([
  '取消', '取り消し', '取消し', 'キャンセル', 'やめる', 'cancel',
  'never mind', '算了', '不驳回', '撤销',
]))

const ja = {
  approved: '承認しました。ありがとうございます。結果はカードにも反映します。',
  rejected: '差戻しました。ありがとうございます。理由とともに申請者へ戻します。',
  reasonDialogTitle: '差戻しの理由',
  reasonDialogLabel: '差戻しの理由を入力してください',
  reasonCancelled: '差戻しを取りやめました。依頼はそのまま残っています。',
  askReason: (code, w = REPLY_WORDS.ja) =>
    `差戻しの理由を、このチャットにそのまま送ってください（10 分以内）。やめるときは「取消」と送ってください。\n（「${w.reject[0]} ${code} 理由」の形で送っても差戻しできます。例：${w.reject[0]} ${code} 金額を確認してください）`,
  reasonRequired: (code, w = REPLY_WORDS.ja) =>
    `差戻しには理由が必要です。番号のあとに理由を続けて送ってください。\n例：${w.reject[0]} ${code} 金額を確認してください`,
  reasonInputLabel: '差戻しの理由',
  reasonInputPlaceholder: '例：金額を確認してください',
  notFound: 'この承認依頼は見つかりませんでした。既に処理済みか期限切れの可能性があります。業務Webをご確認ください。',
  notYours: 'この承認依頼はあなた宛てではありません。',
  unknownAction: '不明な操作です。',
  finished: {
    approved: 'この承認依頼は既に承認されています。',
    rejected: 'この承認依頼は既に差戻されています。',
    cancelled: 'この承認依頼は取り消されました。',
    expired: 'この承認依頼は期限切れです。',
    decided: 'この承認依頼は既に処理済みです。',
  },
  /** after an override of invalid_reply_code: the attempts left */
  remaining: (n) => (Number.isInteger(n) ? `（あと ${n} 回まで）` : ''),
  code: {
    token_or_reply_code_required: '入力内容に誤りがあります（ボタンまたは返信コードが必要です）。',
    comment_required: '差戻しには理由が必要です。',
    identity_not_linked: 'このアカウントは職員と連携されていません。業務Webで SNS 連携をしてください。',
    delivery_not_found: 'この承認依頼の送付先が見つかりません。業務Webをご確認ください。',
    identity_mismatch: 'この承認依頼はあなた宛てではありません。',
    invalid_reply_code: (remaining) => `返信コードが正しくありません。${Number.isInteger(remaining) ? `（あと ${remaining} 回まで）` : ''}`,
    role_not_permitted: 'この承認に必要な役割を持っていないため、決定できません。',
    self_approval_forbidden: '申請者本人は承認・差戻しできません。',
    delivery_locked: '返信コードの誤りが続いたため、この依頼は IM から操作できなくなりました。業務Webで操作してください。',
    too_many_attempts: '試行回数が多すぎます。しばらく時間をおいてから再度お試しください。',
    delivery_used: 'このボタン・返信コードは既に使用されています。',
    delivery_revoked: 'この依頼は無効になりました（他の方が決定したか、取り消されました）。',
    expired: '承認の期限が切れています。業務Webをご確認ください。',
    delegation_not_permitted: 'システム設定の問題で処理できませんでした。管理者に連絡してください。',
  },
  error: {
    unreachable: '業務システムに接続できませんでした。時間をおいて再度お試しください。',
    badRequest: '入力内容に誤りがあります。',
    commentRequired: '差戻しには理由が必要です。',
    unauthorized: 'システム設定の問題で処理できませんでした（認証エラー）。管理者に連絡してください。',
    forbidden: 'この承認を行う権限がありません（申請者本人、または必要な役割を持たない場合は決定できません）。',
    notFound: 'この承認依頼は見つかりません。',
    conflict: 'この承認依頼は既に処理済みです。',
    gone: '承認の期限が切れているか、このボタン・コードは既に使用されています。',
    server: '業務システムでエラーが発生しました。時間をおいて再度お試しください。',
  },
  footer: (code, w = REPLY_WORDS.ja) => `文字で返信する場合：「${w.approve[0]} ${code}」／「${w.reject[0]} ${code} 理由」`,
  statusFooter: {
    approved: '状態：承認済み',
    rejected: '状態：差戻し済み',
    expired: '状態：期限切れ',
    cancelled: '状態：取消',
    replaced: '状態：無効（送り直し済み）',
  },
  /** 更新したカードの件名の（状態）。 */
  statusLabel: { approved: '承認済み', rejected: '差戻し済み', expired: '期限切れ', cancelled: '取消', replaced: '無効', decided: '処理済み' },
  /** 更新したカードの本文（結果と、まだ何かすることがあるか）。 */
  statusBody: {
    approved: 'この承認依頼は承認されました。ご対応は不要です。',
    rejected: 'この承認依頼は差し戻されました。申請者に戻っていますので、ご対応は不要です。',
    expired: 'この承認依頼は期限が切れました。必要な場合は、業務Webから依頼し直してください。',
    cancelled: 'この承認依頼は取り消されました。ご対応は不要です。',
    replaced: 'この依頼は別の連絡先に送り直されました。新しいメッセージから操作してください。',
    decided: 'この承認依頼は処理済みです。ご対応は不要です。',
  },
  /** 依頼カードの本文。 */
  request: {
    lead: (what) => `${what ? `${what}の` : ''}承認をお願いします。`,
    ask: (deadline, w = REPLY_WORDS.ja) => `▶ お願いしたいこと${deadline ? `（期限 ${deadline}）` : ''}：内容を確認し、「${w.approve[0]}」か「${w.reject[0]}」を選んでください。`,
    buttons: (w = REPLY_WORDS.ja) => [`・${w.approve[0]}：この内容で確定します`, `・${w.reject[0]}：理由を添えて申請者に戻します`],
  },
  /** the due of the ▶ line (dsh-core askLine due) */
  due: (deadline) => `期限 ${deadline}`,
  /** one line per button of a business system's own wording */
  buttonLine: (word, text) => `・${word}：${text}`,
  /** the business system's card body, kept as a reference */
  reference: (body) => `ご参考：${body}`,
  /** card titles: what = the kind of approval (approvalSubject), '' when unknown */
  requestTitle: (what) => `${intentLabels('ja').approval}${what || '承認依頼'}`,
  finalTitle: (what, state) => `${intentLabels('ja').info}${what ? `${what}の承認依頼` : '承認依頼'}（${state}）`,
  detailLink: '業務Webで詳細を見る',
  noApplication: 'このボットはどの業務システムにも割り当てられていません。管理者に連絡してください。',
}

const en = {
  approved: 'Approved. Thank you. The card shows the result too.',
  rejected: 'Sent back. Thank you. It goes back to the requester with your reason.',
  reasonDialogTitle: 'Reason for sending back',
  reasonDialogLabel: 'Enter the reason for sending it back',
  reasonCancelled: 'Not sent back. The request is still waiting.',
  askReason: (code, w = REPLY_WORDS.en) =>
    `Send the reason for sending it back in this chat (within 10 minutes). To stop, send "cancel".\n(You can also send "${w.reject[0]} ${code} reason". Example: ${w.reject[0]} ${code} Please check the amount)`,
  reasonRequired: (code, w = REPLY_WORDS.en) =>
    `A reason is needed to send it back. Send the reason after the number.\nExample: ${w.reject[0]} ${code} Please check the amount`,
  reasonInputLabel: 'Reason for sending back',
  reasonInputPlaceholder: 'e.g. Please check the amount',
  notFound: 'This approval request was not found. It may already be decided or expired. Please check the web app.',
  notYours: 'This approval request is not addressed to you.',
  unknownAction: 'Unknown action.',
  finished: {
    approved: 'This approval request is already approved.',
    rejected: 'This approval request was already sent back.',
    cancelled: 'This approval request was cancelled.',
    expired: 'This approval request has expired.',
    decided: 'This approval request is already decided.',
  },
  remaining: (n) => (Number.isInteger(n) ? ` (${n} attempt${n === 1 ? '' : 's'} left)` : ''),
  code: {
    token_or_reply_code_required: 'Something is wrong with the input (a button or a reply code is needed).',
    comment_required: 'A reason is needed to send it back.',
    identity_not_linked: 'This account is not linked to an employee. Please link your chat account in the web app.',
    delivery_not_found: 'The recipient of this approval request was not found. Please check the web app.',
    identity_mismatch: 'This approval request is not addressed to you.',
    invalid_reply_code: (remaining) => `The reply code is not correct.${Number.isInteger(remaining) ? ` (${remaining} attempt${remaining === 1 ? '' : 's'} left)` : ''}`,
    role_not_permitted: 'You do not have the role this approval needs, so you cannot decide it.',
    self_approval_forbidden: 'The requester cannot approve or send back their own request.',
    delivery_locked: 'Too many wrong reply codes: this request can no longer be decided in chat. Please use the web app.',
    too_many_attempts: 'Too many attempts. Please wait a while and try again.',
    delivery_used: 'This button or reply code has already been used.',
    delivery_revoked: 'This request is no longer valid (someone else decided it, or it was cancelled).',
    expired: 'The approval has expired. Please check the web app.',
    delegation_not_permitted: 'It could not be processed because of a system setting. Please contact your administrator.',
  },
  error: {
    unreachable: 'Could not reach the business system. Please try again later.',
    badRequest: 'Something is wrong with the input.',
    commentRequired: 'A reason is needed to send it back.',
    unauthorized: 'It could not be processed because of a system setting (authentication error). Please contact your administrator.',
    forbidden: 'You are not allowed to decide this approval (the requester, or someone without the needed role, cannot decide it).',
    notFound: 'This approval request was not found.',
    conflict: 'This approval request is already decided.',
    gone: 'The approval has expired, or this button or code has already been used.',
    server: 'An error occurred in the business system. Please try again later.',
  },
  footer: (code, w = REPLY_WORDS.en) => `Reply in text: “${w.approve[0]} ${code}” / “${w.reject[0]} ${code} reason”`,
  statusFooter: {
    approved: 'Status: approved',
    rejected: 'Status: sent back',
    expired: 'Status: expired',
    cancelled: 'Status: cancelled',
    replaced: 'Status: no longer valid (sent again)',
  },
  statusLabel: { approved: 'Approved', rejected: 'Sent back', expired: 'Expired', cancelled: 'Cancelled', replaced: 'No longer valid', decided: 'Decided' },
  statusBody: {
    approved: 'This approval request was approved. No action needed.',
    rejected: 'This approval request was sent back to the requester. No action needed.',
    expired: 'This approval request has expired. If it is still needed, request it again in the web app.',
    cancelled: 'This approval request was cancelled. No action needed.',
    replaced: 'This request was sent again to another chat. Please use the new message.',
    decided: 'This approval request is decided. No action needed.',
  },
  request: {
    lead: (what) => (what ? `Your approval is requested: ${what}.` : 'Your approval is requested.'),
    ask: (deadline, w = REPLY_WORDS.en) => `▶ What I'd like you to do${deadline ? ` (due ${deadline})` : ''}: check the details and choose “${w.approve[0]}” or “${w.reject[0]}”.`,
    buttons: (w = REPLY_WORDS.en) => [`• ${w.approve[0]}: confirms it as it is`, `• ${w.reject[0]}: sends it back to the requester with your reason`],
  },
  due: (deadline) => `due ${deadline}`,
  buttonLine: (word, text) => `• ${word}: ${text}`,
  reference: (body) => `For reference: ${body}`,
  requestTitle: (what) => labelled(intentLabels('en').approval, what || 'Approval request'),
  finalTitle: (what, state) => labelled(intentLabels('en').info, `${what || 'Approval request'} (${state})`),
  detailLink: 'View details in the web app',
  noApplication: 'This bot is not assigned to any business system. Please contact your administrator.',
}

const zh = {
  approved: '已批准，谢谢。结果也会显示在卡片上。',
  rejected: '已驳回，谢谢。将连同理由退回给申请人。',
  reasonDialogTitle: '驳回理由',
  reasonDialogLabel: '请输入驳回理由',
  reasonCancelled: '已取消驳回，申请仍在等待处理。',
  askReason: (code, w = REPLY_WORDS.zh) =>
    `请直接在此聊天中发送驳回理由（10 分钟内）。如要取消，请发送「取消」。\n（也可以发送「${w.reject[0]} ${code} 理由」来驳回。例：${w.reject[0]} ${code} 请确认金额）`,
  reasonRequired: (code, w = REPLY_WORDS.zh) =>
    `驳回需要填写理由。请在编号后面接着发送理由。\n例：${w.reject[0]} ${code} 请确认金额`,
  reasonInputLabel: '驳回理由',
  reasonInputPlaceholder: '例：请确认金额',
  notFound: '未找到该审批申请。可能已处理或已过期，请在业务系统中确认。',
  notYours: '该审批申请不是发给您的。',
  unknownAction: '未知的操作。',
  finished: {
    approved: '该审批申请已被批准。',
    rejected: '该审批申请已被驳回。',
    cancelled: '该审批申请已被撤销。',
    expired: '该审批申请已过期。',
    decided: '该审批申请已处理。',
  },
  remaining: (n) => (Number.isInteger(n) ? `（还剩 ${n} 次）` : ''),
  code: {
    token_or_reply_code_required: '输入内容有误（需要按钮或回复码）。',
    comment_required: '驳回需要填写理由。',
    identity_not_linked: '此账号尚未与员工关联。请在业务系统中完成聊天账号关联。',
    delivery_not_found: '未找到该审批申请的接收人。请在业务系统中确认。',
    identity_mismatch: '该审批申请不是发给您的。',
    invalid_reply_code: (remaining) => `回复码不正确。${Number.isInteger(remaining) ? `（还剩 ${remaining} 次）` : ''}`,
    role_not_permitted: '您没有该审批所需的角色，无法做出决定。',
    self_approval_forbidden: '申请人本人不能批准或驳回。',
    delivery_locked: '回复码多次错误，此申请已无法在聊天中操作。请在业务系统中操作。',
    too_many_attempts: '尝试次数过多。请稍后再试。',
    delivery_used: '此按钮或回复码已被使用。',
    delivery_revoked: '此申请已失效（其他人已做出决定，或已被撤销）。',
    expired: '审批已过期。请在业务系统中确认。',
    delegation_not_permitted: '由于系统设置问题，无法处理。请联系管理员。',
  },
  error: {
    unreachable: '无法连接业务系统。请稍后再试。',
    badRequest: '输入内容有误。',
    commentRequired: '驳回需要填写理由。',
    unauthorized: '由于系统设置问题，无法处理（认证错误）。请联系管理员。',
    forbidden: '您没有执行此审批的权限（申请人本人或没有所需角色的人无法做出决定）。',
    notFound: '未找到该审批申请。',
    conflict: '该审批申请已处理。',
    gone: '审批已过期，或此按钮・回复码已被使用。',
    server: '业务系统发生错误。请稍后再试。',
  },
  footer: (code, w = REPLY_WORDS.zh) => `文字回复：「${w.approve[0]} ${code}」／「${w.reject[0]} ${code} 理由」`,
  statusFooter: {
    approved: '状态：已批准',
    rejected: '状态：已驳回',
    expired: '状态：已过期',
    cancelled: '状态：已撤销',
    replaced: '状态：已失效（已重新发送）',
  },
  statusLabel: { approved: '已批准', rejected: '已驳回', expired: '已过期', cancelled: '已撤销', replaced: '已失效', decided: '已处理' },
  statusBody: {
    approved: '该审批申请已被批准，无需处理。',
    rejected: '该审批申请已被驳回并退回给申请人，无需处理。',
    expired: '该审批申请已过期。如仍需要，请在业务系统中重新发起。',
    cancelled: '该审批申请已被撤销，无需处理。',
    replaced: '此申请已重新发送到其他聊天，请在新消息中操作。',
    decided: '该审批申请已处理，无需处理。',
  },
  request: {
    lead: (what) => `请审批${what ? `这份${what}` : '这份申请'}。`,
    ask: (deadline, w = REPLY_WORDS.zh) => `▶ 需要您做的${deadline ? `（截止 ${deadline}）` : ''}：确认内容后，选择「${w.approve[0]}」或「${w.reject[0]}」。`,
    buttons: (w = REPLY_WORDS.zh) => [`• ${w.approve[0]}：按此内容确定`, `• ${w.reject[0]}：附上理由退回给申请人`],
  },
  due: (deadline) => `截止 ${deadline}`,
  buttonLine: (word, text) => `• ${word}：${text}`,
  reference: (body) => `参考：${body}`,
  requestTitle: (what) => `${intentLabels('zh').approval}${what || '审批申请'}`,
  finalTitle: (what, state) => `${intentLabels('zh').info}${what || '审批申请'}（${state}）`,
  detailLink: '在业务系统中查看详情',
  noApplication: '此机器人未分配给任何业务系统。请联系管理员。',
}

export const MESSAGES = Object.freeze({ ja, en, zh })

/** The words of a language ('ja' | 'en' | 'zh' or a BCP 47 locale; missing → ja). */
export const messagesFor = (locale) => MESSAGES[frameLocale(locale)]
/** The default reply words of a language. */
export const replyWordsFor = (locale) => REPLY_WORDS[frameLocale(locale)]
