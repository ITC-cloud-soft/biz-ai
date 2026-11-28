// The words of purchase-requests in its three languages (en / ja / zh). The instance has one language (createPurchaseApp
// { locale }): its manifest (system name, event labels, notification templates), the approval card and the chat replies to
// a decision are written in it. Only numbers, dates and request numbers are filled in: never names, never reasons.
export const LOCALES = Object.freeze(['en', 'ja', 'zh'])

const yen = (n) => Number(n).toLocaleString('en-US')

export const MESSAGES = Object.freeze({
  en: {
    systemName: 'Purchase Requests',
    systemLocale: 'en-US',
    amount: (n) => `¥${yen(n)}`,
    item: (item, quantity) => `${item} × ${quantity}`,
    days: (n) => `${n} day${n === 1 ? '' : 's'}`,
    card: {
      title: 'Purchase request',
      fields: { request: 'Request', item: 'Item', amount: 'Amount', waiting: 'Waiting' },
      lead: (no, days) => `${no} has waited ${days} day${days === 1 ? '' : 's'} for your decision.`,
      ask: 'Approve or reject it here. The decision is recorded in Purchase Requests.',
      buttons: { approve: 'approved, and the requester is told', reject: 'sent back to the requester' },
      replies: { approved: 'Approved. Recorded in Purchase Requests; the requester is being told.', rejected: 'Sent back. Recorded in Purchase Requests; the requester is being told.' },
      statusBody: {
        approved: 'Approved in Purchase Requests. Nothing more to do.',
        rejected: 'Sent back to the requester in Purchase Requests. Nothing more to do.',
        expired: 'This approval expired. Open Purchase Requests to decide.',
        cancelled: 'This request was cancelled. Nothing more to do.',
      },
      body: 'Details are in Purchase Requests.',
    },
    events: { 'purchase.unanswered': 'Purchase request waiting', 'purchase.decided': 'Purchase request decided' },
    templates: {
      'purchase.unanswered': {
        title: 'Purchase request waiting',
        description: 'Purchase request PR-{requestNumber} has waited {daysWaiting} day(s) for your decision.',
        action: 'Approve or reject it with the card in this chat (or in Purchase Requests).',
      },
      'purchase.approved': { title: 'Purchase request approved', description: 'Your purchase request PR-{requestNumber} was approved.', note: 'Nothing more to do.' },
      'purchase.rejected': {
        title: 'Purchase request sent back',
        description: 'Your purchase request PR-{requestNumber} was sent back.',
        action: 'Check the comment in Purchase Requests and submit it again if needed.',
      },
    },
    im: { labels: { info: '[Update] ', action: '[Action needed] ' }, ask: '▶ ', signature: (name) => `— ${name} AI assistant`, openLink: 'Open: ' },
  },

  ja: {
    systemName: '購買申請',
    systemLocale: 'ja-JP',
    amount: (n) => `${yen(n)}円`,
    item: (item, quantity) => `${item} × ${quantity}`,
    days: (n) => `${n} 日`,
    card: {
      title: '購買申請',
      fields: { request: '申請番号', item: '品目', amount: '金額', waiting: '待ち日数' },
      lead: (no, days) => `${no} が ${days} 日間、あなたの判断を待っています。`,
      ask: 'ここで承認か差戻を選んでください。結果は購買申請に記録されます。',
      buttons: { approve: '承認し、申請者に知らせます', reject: '申請者に戻します' },
      replies: { approved: '承認しました。購買申請に記録し、申請者にお知らせします。', rejected: '差戻しました。購買申請に記録し、申請者にお知らせします。' },
      statusBody: {
        approved: '購買申請で承認されました。ご対応は不要です。',
        rejected: '購買申請で申請者に戻しました。ご対応は不要です。',
        expired: 'この承認依頼は期限が切れました。購買申請の画面で判断してください。',
        cancelled: 'この申請は取り消されました。ご対応は不要です。',
      },
      body: '詳しい内容は購買申請の画面にあります。',
    },
    events: { 'purchase.unanswered': '購買申請の判断待ち', 'purchase.decided': '購買申請の結果' },
    templates: {
      'purchase.unanswered': {
        title: '購買申請の判断待ち',
        description: '購買申請 PR-{requestNumber} が {daysWaiting} 日間、あなたの判断を待っています。',
        action: 'このチャットのカード（または購買申請の画面）で承認か差戻を選んでください。',
      },
      'purchase.approved': { title: '購買申請の承認', description: 'あなたの購買申請 PR-{requestNumber} が承認されました。', note: 'ご対応は不要です。' },
      'purchase.rejected': {
        title: '購買申請の差戻し',
        description: 'あなたの購買申請 PR-{requestNumber} が差し戻されました。',
        action: '購買申請の画面でコメントを確認し、必要なら申請し直してください。',
      },
    },
    // ja uses the framework's own frame (bridge-notify renders the manifest templates): no template module text
    im: null,
  },

  zh: {
    systemName: '采购申请',
    systemLocale: 'zh-CN',
    amount: (n) => `¥${yen(n)}`,
    item: (item, quantity) => `${item} × ${quantity}`,
    days: (n) => `${n} 天`,
    card: {
      title: '采购申请',
      fields: { request: '申请编号', item: '物品', amount: '金额', waiting: '已等待' },
      lead: (no, days) => `${no} 已经等待你的决定 ${days} 天了。`,
      ask: '请在这里批准或驳回，结果会记录到采购申请系统。',
      buttons: { approve: '批准，并通知申请人', reject: '退回给申请人' },
      replies: { approved: '已批准。已记录到采购申请系统，正在通知申请人。', rejected: '已驳回。已记录到采购申请系统，正在通知申请人。' },
      statusBody: {
        approved: '已在采购申请系统中批准，无需其他操作。',
        rejected: '已在采购申请系统中退回给申请人，无需其他操作。',
        expired: '这个审批已过期，请在采购申请系统中处理。',
        cancelled: '这个申请已取消，无需其他操作。',
      },
      body: '详细内容请在采购申请系统中查看。',
    },
    events: { 'purchase.unanswered': '采购申请待审批', 'purchase.decided': '采购申请已处理' },
    templates: {
      'purchase.unanswered': {
        title: '采购申请待审批',
        description: '采购申请 PR-{requestNumber} 已经等待你的决定 {daysWaiting} 天了。',
        action: '请用这个对话里的卡片（或在采购申请系统中）批准或驳回。',
      },
      'purchase.approved': { title: '采购申请已批准', description: '你的采购申请 PR-{requestNumber} 已批准。', note: '无需其他操作。' },
      'purchase.rejected': {
        title: '采购申请已退回',
        description: '你的采购申请 PR-{requestNumber} 被退回了。',
        action: '请在采购申请系统中查看意见，需要时重新提交。',
      },
    },
    im: { labels: { info: '【通知】', action: '【待处理】' }, ask: '▶ ', signature: (name) => `— ${name} AI 助理`, openLink: '打开：' },
  },
})

/** The messages of a locale ('en' when unknown). */
export const messagesFor = (locale) => MESSAGES[LOCALES.includes(locale) ? locale : 'en']

/** The locale of a manifest system.locale ('en-US' → 'en'). */
export const localeOf = (systemLocale) => {
  const short = String(systemLocale ?? '').slice(0, 2).toLowerCase()
  return LOCALES.includes(short) ? short : 'en'
}
