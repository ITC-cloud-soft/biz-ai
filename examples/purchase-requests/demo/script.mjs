// What the people of the demo say, per language, and how the scripted model words its answers from the tool results.
// Fictional data only. The model never invents a fact: every number and status in an answer comes from the business
// system's tool result (purchase_list_requests / purchase_get_request, run with the asker's own delegation).
const PR = /\bPR-\d{4,6}\b/

export const SCRIPTS = {
  en: {
    item: 'Laptop stand',
    otherItem: 'Whiteboard markers',
    mine: 'Where is my request?',
    other: (no) => `Where is ${no}?`,
    isMine: (text) => /where is my request/i.test(text),
    title: 'Purchase request question',
    answer: (r, m, today) => `I checked Purchase Requests with your access: ${r.no} (${m.item(r.item, r.quantity)}, ${m.amount(r.amount)}) `
      + `${{ pending: 'is waiting for a decision', approved: 'was approved', rejected: 'was sent back', cancelled: 'was cancelled' }[r.status]}`
      + `${r.decidedOn ? (r.decidedOn === today ? ' today' : ` on ${r.decidedOn}`) : ''}.${r.status === 'approved' ? ' Nothing more is needed from you.' : ''}`,
    none: 'I could not find any purchase request of yours.',
    refuse: (no) => `I can't see ${no} with your access — you can only see your own requests. The requester or their approver can check it.`,
    failed: (detail) => `I could not read Purchase Requests (${detail}).`,
  },
  ja: {
    item: 'ノートPCスタンド',
    otherItem: 'ホワイトボードマーカー',
    mine: '私の申請、どうなっていますか？',
    other: (no) => `${no} はどうなっていますか？`,
    isMine: (text) => /私の申請/.test(text),
    title: '購買申請の確認',
    answer: (r, m, today) => `あなたの権限で購買申請を確認しました。${r.no}（${m.item(r.item, r.quantity)}、${m.amount(r.amount)}）は`
      + `${r.decidedOn ? (r.decidedOn === today ? '本日' : `${r.decidedOn} に`) : ''}`
      + `${{ pending: '判断待ちです', approved: '承認されました', rejected: '差し戻されました', cancelled: '取り消されました' }[r.status]}。`
      + `${r.status === 'approved' ? 'ご対応は不要です。' : ''}`,
    none: 'あなたの購買申請は見つかりませんでした。',
    refuse: (no) => `${no} はあなたの権限では見られません（見られるのはご自身の申請だけです）。申請者か承認者に確認してください。`,
    failed: (detail) => `購買申請を読み取れませんでした（${detail}）。`,
  },
  zh: {
    item: '笔记本支架',
    otherItem: '白板笔',
    mine: '我的申请到哪一步了？',
    other: (no) => `${no} 现在到哪一步了？`,
    isMine: (text) => /我的申请/.test(text),
    title: '采购申请查询',
    answer: (r, m, today) => `已用你的权限查询采购申请：${r.no}（${m.item(r.item, r.quantity)}，${m.amount(r.amount)}）`
      + `${r.decidedOn ? (r.decidedOn === today ? '今天' : `于 ${r.decidedOn} `) : ''}`
      + `${{ pending: '还在等待审批', approved: '已批准', rejected: '被退回了', cancelled: '已取消' }[r.status]}。`
      + `${r.status === 'approved' ? '你无需其他操作。' : ''}`,
    none: '没有找到你的采购申请。',
    refuse: (no) => `以你的权限看不到 ${no}（你只能查看自己的申请）。请向申请人或其审批人确认。`,
    failed: (detail) => `无法读取采购申请（${detail}）。`,
  },
}

export const requestNoIn = (text) => PR.exec(String(text ?? ''))?.[0] ?? null
