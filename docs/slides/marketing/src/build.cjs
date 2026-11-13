// Builds docs/slides/marketing/biz-assistant-for-executives.pptx
// (Bizアシスタント (Biz Assistant Framework, @dsh-bridge/*) — marketing deck for executives of small and mid-sized companies, Japanese).
//
//   node build.cjs [out.pptx]        default: ../biz-assistant-for-executives.pptx
//
// Needs pptxgenjs (4.x) resolvable from here or through NODE_PATH. See README.md.
// Same visual family as docs/slides/biz-assistant-framework.pptx (theme "DSH Bridge Ink", Yu Gothic UI / Meiryo UI).
// All names, numbers and messages on the slides are fictional examples; the ROI slide is labelled as an estimate.
// Storyline: a general-purpose framework that turns ANY existing business system into one that works with AI 社員 (an AI
// assistant for every employee, in their own chat), by adding the bridge listed on slide 18 (docs/GUIDELINE.md「既存の業務システムを
// つなぐ：チェックリスト」); everything else is provided. A new system can be built the same way. Never claim that no change is needed.
// The AI 社員 has the name and personality the company sets and always says it is an AI (slide 12), remembers each person's
// preferences and answers how-to questions from the system's manual with a link to the right screen (slide 13).
const path = require('path')
const fs = require('fs')
const pptxgen = require('pptxgenjs')

const OUT = path.resolve(process.argv[2] || path.join(__dirname, '..', 'biz-assistant-for-executives.pptx'))

const THEME = {
  name: 'DSH Bridge Ink',
  colors: {
    dk1: '1B2A2F', lt1: 'FFFFFF', dk2: '0E4B57', lt2: 'EEF3F2',
    accent1: '0E7C86', accent2: 'F2A541', accent3: 'C8553D', accent4: '4F8A5B', accent5: '6B7C80', accent6: '2F4858',
    hlink: '0E7C86', folHlink: '6B7C80',
  },
}
const F = { head: 'Yu Gothic UI', body: 'Meiryo UI' }

const pres = new pptxgen()
pres.layout = 'LAYOUT_16x9' // 10 x 5.625 in
pres.title = 'Bizアシスタント — どの業務システムも、AI 社員と働くシステムに。'
pres.subject = '経営者・事業責任者向けご紹介'
pres.author = 'Bizアシスタント'
pres.theme = { headFontFace: F.head, bodyFontFace: F.body }
const C = pres.SchemeColor
const S = pres.shapes

// ── layouts ───────────────────────────────────────────────────────────────
pres.defineSlideMaster({
  title: 'TITLE_DARK',
  background: { color: C.text2 },
  objects: [
    { placeholder: { options: { name: 'title', type: 'title', x: 0.6, y: 1.4, w: 5.3, h: 2.0, fontFace: F.head, fontSize: 36, bold: true, color: C.background1, valign: 'bottom', align: 'left', margin: 0 }, text: '' } },
    { placeholder: { options: { name: 'body', type: 'body', x: 0.6, y: 3.6, w: 5.3, h: 1.2, fontFace: F.body, fontSize: 16, color: C.background2, valign: 'top', align: 'left', margin: 0 }, text: '' } },
  ],
})
pres.defineSlideMaster({
  title: 'SECTION_DARK',
  background: { color: C.text2 },
  objects: [
    { placeholder: { options: { name: 'title', type: 'title', x: 0.6, y: 0.45, w: 8.8, h: 0.75, fontFace: F.head, fontSize: 32, bold: true, color: C.background1, valign: 'middle', align: 'left', margin: 0 }, text: '' } },
    { text: { text: 'Bizアシスタント', options: { x: 0.6, y: 5.25, w: 4, h: 0.25, fontFace: F.body, fontSize: 9, color: C.background2, margin: 0 } } },
  ],
  slideNumber: { x: 8.9, y: 5.25, w: 0.5, h: 0.25, fontFace: F.body, fontSize: 9, color: C.background2, align: 'right' },
})
pres.defineSlideMaster({
  title: 'CONTENT',
  background: { color: C.background1 },
  margin: [0.3, 0.5, 0.4, 0.5],
  objects: [
    { placeholder: { options: { name: 'title', type: 'title', x: 0.5, y: 0.28, w: 9.0, h: 0.62, fontFace: F.head, fontSize: 26, bold: true, color: C.text2, valign: 'middle', align: 'left', margin: 0 }, text: '' } },
    { text: { text: 'Bizアシスタント', options: { x: 0.5, y: 5.25, w: 4, h: 0.25, fontFace: F.body, fontSize: 9, color: C.accent5, margin: 0 } } },
  ],
  slideNumber: { x: 9.0, y: 5.25, w: 0.5, h: 0.25, fontFace: F.body, fontSize: 9, color: C.accent5, align: 'right' },
})

// ── helpers ───────────────────────────────────────────────────────────────
let objCount = 0
const oid = (p) => `${p}-${++objCount}`

function T(slide, text, o = {}) {
  slide.addText(text, { isTextBox: true, lang: 'ja-JP', fontFace: F.body, fontSize: 14, color: C.text1, margin: 0.04, valign: 'top', objectName: oid('text'), ...o })
}
function box(slide, x, y, w, h, fill, o = {}) {
  const shape = o.shape ?? S.ROUNDED_RECTANGLE
  slide.addShape(shape, {
    x, y, w, h,
    fill: { color: fill, ...(o.transparency ? { transparency: o.transparency } : {}) },
    line: { color: o.line ?? fill, width: o.lw ?? 0.75, ...(o.dash ? { dashType: o.dash } : {}) },
    ...(shape === S.ROUNDED_RECTANGLE ? { rectRadius: o.r ?? 0.1 } : {}),
    ...(o.shadow ? { shadow: { type: 'outer', color: '1B2A2F', opacity: 0.18, blur: 6, offset: 2, angle: 90 } } : {}),
    objectName: oid(o.name ?? 'box'),
  })
}
function chip(slide, x, y, w, h, text, { fill = C.accent1, color = C.background1, size = 12, bold = true, line, font = F.body, align = 'center' } = {}) {
  box(slide, x, y, w, h, fill, { r: Math.min(0.12, h / 2), line, name: 'chip' })
  T(slide, text, { x, y, w, h, fontSize: size, color, bold, align, valign: 'middle', margin: 0.03, fontFace: font })
}
/** the deck's motif: one kanji in a coloured circle */
function kanji(slide, x, y, d, ch, { fill = C.accent1, color = C.background1, size } = {}) {
  slide.addShape(S.OVAL, { x, y, w: d, h: d, fill: { color: fill }, line: { color: fill, width: 0.75 }, objectName: oid('kanji') })
  T(slide, ch, { x, y, w: d, h: d, fontSize: size ?? Math.round(d * 34), color, bold: true, align: 'center', valign: 'middle', margin: 0, fontFace: F.head })
}
function arrow(slide, x1, y1, x2, y2, { color = C.accent5, width = 2, dash, both = false } = {}) {
  slide.addShape(S.LINE, {
    x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.max(Math.abs(x2 - x1), 0.001), h: Math.max(Math.abs(y2 - y1), 0.001),
    flipH: x2 < x1, flipV: y2 < y1,
    line: { color, width, endArrowType: 'triangle', ...(both ? { beginArrowType: 'triangle' } : {}), ...(dash ? { dashType: dash } : {}) },
    objectName: oid('arrow'),
  })
}
function content(sectionTitle, title) {
  const slide = pres.addSlide({ masterName: 'CONTENT', sectionTitle })
  slide.addText(title, { placeholder: 'title', fontFace: F.head, lang: 'ja-JP' })
  return slide
}

// message labels of the AI 秘書 (IM_MESSAGE_STYLE.md)
const LABEL = {
  info: { text: '【ご報告】', fill: C.accent1, color: C.background1, meaning: '読むだけで OK' },
  action: { text: '【対応のお願い】', fill: C.accent2, color: C.text1, meaning: '動いてほしい' },
  urgent: { text: '【至急】', fill: C.accent3, color: C.background1, meaning: 'すぐ動いてほしい' },
  approval: { text: '【承認のお願い】', fill: C.accent6, color: C.background1, meaning: '決めてほしい' },
  report: { text: '【定時のご報告】', fill: C.accent4, color: C.background1, meaning: '朝夕のまとめ' },
  help: { text: '【ご案内】', fill: C.accent1, color: C.background1, meaning: '使い方の案内' },
}

/** phone frame with a chat header; returns the inner content area */
function phone(slide, x, y, w, h, { name = 'AI 秘書', sub = 'ケアビリング', onDark = false } = {}) {
  box(slide, x, y, w, h, C.text1, { r: 0.28, line: onDark ? C.accent1 : C.text1, lw: onDark ? 1.5 : 0.75, shadow: !onDark, name: 'phone' })
  const ix = x + 0.1, iy = y + 0.14, iw = w - 0.2, ih = h - 0.28
  box(slide, ix, iy, iw, ih, C.background2, { r: 0.2, name: 'screen' })
  // header
  box(slide, ix, iy, iw, 0.5, C.background1, { r: 0.2, name: 'header' })
  box(slide, ix, iy + 0.3, iw, 0.2, C.background1, { shape: S.RECTANGLE, name: 'header-fill' })
  kanji(slide, ix + 0.12, iy + 0.08, 0.34, 'AI', { fill: C.accent1, size: 10 })
  T(slide, [
    { text: name, options: { bold: true, fontSize: 11, color: C.text2, breakLine: true } },
    { text: sub, options: { fontSize: 9, color: C.accent5 } },
  ], { x: ix + 0.52, y: iy + 0.05, w: iw - 0.6, h: 0.42, margin: 0, valign: 'middle' })
  return { x: ix + 0.12, y: iy + 0.62, w: iw - 0.24, bottom: iy + ih - 0.1 }
}

/** rough height of wrapped Japanese text (Meiryo UI: a full-width character is ~0.9 em, half-width ~0.5 em) */
function textHeight(paras, w, size) {
  const perLine = w / ((size / 72) * 0.92)
  let lines = 0
  for (const p of paras) {
    let units = 0
    for (const ch of p) units += ch.charCodeAt(0) < 0x2000 ? 0.55 : 1
    lines += Math.max(1, Math.ceil(units / perLine))
  }
  return (lines * size * 1.22 + paras.length * 2.5) / 72
}
/**
 * a chat bubble from the AI 秘書; returns its bottom edge.
 * lines: string | { t, b, c, s, label } — label: a LABEL key; the first line of a message starts with its label.
 * h: null = sized to the text.
 */
function bubble(slide, x, y, w, h, lines, { fill = C.background1, size = 12, me = false } = {}) {
  if (h == null) {
    const paras = lines.map((l) => (typeof l === 'string' ? l : (l.label ? LABEL[l.label].text : '') + l.t))
    h = textHeight(paras, w - 0.2, size) + 0.16
  }
  box(slide, x, y, w, h, me ? C.accent1 : fill, { r: 0.1, line: me ? C.accent1 : 'D5DFDD', name: me ? 'bubble-me' : 'bubble' })
  const runs = []
  lines.forEach((l, i) => {
    const it = typeof l === 'string' ? { t: l } : l
    const last = i === lines.length - 1
    if (it.label) {
      const L = LABEL[it.label]
      runs.push({ text: L.text, options: { bold: true, color: it.label === 'action' ? 'B36A00' : L.fill, fontSize: size + 0.5 } })
      runs.push({ text: it.t, options: { bold: true, color: C.text1, fontSize: size + 0.5, breakLine: !last, paraSpaceAfter: 2 } })
    } else {
      runs.push({ text: it.t, options: { bold: !!it.b, color: me ? C.background1 : (it.c ?? C.text1), fontSize: it.s ?? size, breakLine: !last, paraSpaceAfter: 2 } })
    }
  })
  T(slide, runs, { x: x + 0.08, y: y + 0.05, w: w - 0.16, h: h - 0.1, fontSize: size, margin: 0.02, lineSpacingMultiple: 1.0, valign: me ? 'middle' : 'top' })
  return y + h
}
function button(slide, x, y, w, h, text, { fill = C.background1, color = C.accent1 } = {}) {
  box(slide, x, y, w, h, fill, { r: 0.08, line: C.accent1, lw: 1, name: 'button' })
  T(slide, text, { x, y, w, h, fontSize: 12, color, bold: true, align: 'center', valign: 'middle', margin: 0 })
}
/** a small reassurance note with a kanji, under the bullets of a "一日" slide */
function note(slide, x, y, w, ch, text) {
  box(slide, x, y, w, 0.62, C.background2, { r: 0.1 })
  kanji(slide, x + 0.12, y + 0.11, 0.4, ch, { fill: C.accent6, size: 14 })
  T(slide, text, { x: x + 0.62, y, w: w - 0.72, h: 0.62, fontSize: 13, color: C.text2, valign: 'middle', margin: 0 })
}

/** the day strip on the "一日" slides: 4 times, the current one highlighted */
const DAY = [['08:30', '定時のご報告'], ['09:20', '至急の知らせ'], ['14:00', 'チャットで承認'], ['16:00', 'AI の提案']]
function dayStrip(slide, x, y, current) {
  DAY.forEach(([t], i) => {
    const on = i === current
    chip(slide, x + i * 1.02, y, 0.92, 0.34, t, { fill: on ? C.accent1 : C.background2, color: on ? C.background1 : C.accent5, size: 12, line: on ? C.accent1 : C.background2 })
  })
}
function bulletList(slide, x, y, w, h, items, { size = 15, color = C.text1 } = {}) {
  T(slide, items.map((t, i) => ({ text: t, options: { bullet: { indent: 14 }, breakLine: i < items.length - 1, paraSpaceAfter: 9 } })), { x, y, w, h, fontSize: size, color })
}

// ════════════════════════════════════════════════════════════════════════
// 1. Title
pres.addSection({ title: 'はじめに' })
{
  const s = pres.addSlide({ masterName: 'TITLE_DARK', sectionTitle: 'はじめに' })
  chip(s, 0.6, 0.8, 2.6, 0.38, '経営者・事業責任者の方へ', { fill: C.accent2, color: C.text1, size: 12 })
  s.addText([
    { text: 'どの業務システムも、', options: { breakLine: true } },
    { text: 'AI 社員と働く', options: { breakLine: true } },
    { text: 'システムに。' },
  ], { placeholder: 'title', fontFace: F.head, fontSize: 34, lang: 'ja-JP' })
  s.addText([
    { text: 'どの IT システムも、AI エージェント', options: { breakLine: true } },
    { text: '（AI 社員・AI アシスタント）に。', options: { breakLine: true, paraSpaceAfter: 10 } },
    { text: 'Bizアシスタントのご紹介', options: { fontSize: 13, color: C.accent2 } },
  ], { placeholder: 'body', fontFace: F.body, lang: 'ja-JP' })

  const p = phone(s, 6.35, 0.7, 3.15, 4.2, { onDark: true })
  let y = bubble(s, p.x, p.y, p.w, null, [
    { label: 'report', t: '08:30' },
    'おはようございます。現在の業務状況をご報告します。',
    { t: '■ 対応が必要なこと　2 件', b: true, c: C.text2 },
  ], { size: 11.5 })
  y = bubble(s, p.x, y + 0.14, p.w, null, [
    { label: 'action', t: '承認待ちの記録' },
    'お疲れさまです。未承認の訪問記録が 3 件あります。',
    { t: '▶ お願いしたいこと（本日中）：承認の判断をお願いします。', c: C.text2, b: true },
  ], { size: 11.5 })
  bubble(s, p.x + 1.25, y + 0.14, p.w - 1.25, 0.4, ['確認します'], { me: true, size: 11.5 })
  s.addNotes([
    '本日は、経営者・事業責任者の皆さまに向けて「Bizアシスタント」をご紹介します。',
    'ひとことで言うと、どんな IT システムでも、AI エージェント、つまり AI 社員・AI アシスタントとして働く形に変える、本当に汎用の仕組みです。いまお使いの業務システムを「AI 社員と一緒に働く」システムに変えます。業種も、システムの作り方も選びません。',
    'これまでの業務システムは、人が画面を開いて入力し、確認し、担当者を追いかけることで回っていました。Bizアシスタントをつなぐと、AI 社員がシステムの中の変化を見守り、LINE や Teams、Slack など、職員一人ひとりがふだん使っているチャットで知らせ、動くべき人にお願いし、下書きまで用意します。人はチャットで確認して決めます。',
    'そのために業務システムの側に足すのは、決まった形の「つなぐ部分」だけです。AI 社員の仕組みそのものは、Bizアシスタントが用意します。',
    '右の画面は、その AI 社員から届くメッセージのイメージです（内容は架空の例です）。',
  ].join('\n'))
}

// 2. Pains
{
  const s = content('はじめに', '現場の時間が、「確認」と「催促」に消えていませんか')
  const rows = [
    ['人', '人手が足りない', '採用は難しく、今いる人で回すしかない'],
    ['追', '確認・承認・催促に追われる', '管理者の一日が「見に行く・聞く・追いかける」で終わる'],
    ['埋', '情報がシステムに埋もれる', '大事な変化も、画面を開かなければ誰も気づかない'],
    ['同', '替えても、仕事は同じ', '画面が新しくなっても、見に行く・追いかけるは残る'],
    ['懸', 'AI は便利そうだが、不安', '勝手に動かないか、情報が漏れないか'],
  ]
  rows.forEach(([k, head, body], i) => {
    const y = 1.12 + i * 0.8
    box(s, 0.5, y, 9.0, 0.68, C.background2, { r: 0.1 })
    kanji(s, 0.65, y + 0.1, 0.48, k, { fill: i === 4 ? C.accent3 : C.accent1, size: 17 })
    T(s, head, { x: 1.3, y, w: 3.4, h: 0.68, fontSize: 16, bold: true, color: C.text2, valign: 'middle', fontFace: F.head })
    T(s, body, { x: 4.7, y, w: 4.7, h: 0.68, fontSize: 14, color: C.text1, valign: 'middle' })
  })
  s.addNotes([
    '多くの中小企業で共通して伺うお悩みを 5 つ挙げました。',
    'とくに大きいのが 2 つ目です。管理者の方の一日が、システムを見に行く、担当者に聞きに行く、承認や提出を追いかける、ということで終わってしまう。',
    '情報はすでにシステムの中にあります。ただ、画面を開かなければ誰も気づきません。',
    '4 つ目も大事な点です。システムを新しいものに替えても、「人が画面を見に行き、入力し、追いかける」という仕事の形が同じなら、忙しさは変わりません。',
    'そして、AI は気になるけれど不安だ、というお声もよく伺います。今日はこの 5 つにお答えしていきます。',
  ].join('\n'))
}

// 3. The paradigm shift: old way vs new way
{
  const s = content('はじめに', '人が画面を回す仕事から、AI 社員と働く仕事へ')
  const sides = [
    { x: 0.5, head: 'これまで：人がシステムを回す', fill: C.background2, line: C.background2, headColor: C.accent5, k: C.accent5, rows: [
      ['開', '人が画面を開いて、見に行く'],
      ['入', '人が入力して、確認する'],
      ['追', '人が担当者を追いかける'],
      ['集', '人が数字を集めて報告する'],
    ] },
    { x: 5.4, head: 'これから：AI 社員と一緒に回す', fill: C.background1, line: C.accent1, headColor: C.accent1, k: C.accent1, rows: [
      ['見', 'AI 社員が見守り、知らせる'],
      ['頼', 'AI 社員が動くべき人に頼む'],
      ['案', 'AI 社員が下書きし、まとめる'],
      ['決', '人はチャットで確認し、決める'],
    ] },
  ]
  sides.forEach(({ x, head, fill, line, headColor, k, rows }) => {
    box(s, x, 1.1, 4.1, 3.0, fill, { r: 0.12, line, lw: 1.25 })
    T(s, head, { x: x + 0.2, y: 1.2, w: 3.7, h: 0.42, fontSize: 15, bold: true, color: headColor, valign: 'middle', fontFace: F.head, margin: 0 })
    rows.forEach(([ch, t], i) => {
      const y = 1.72 + i * 0.58
      const last = i === 3 && k === C.accent1
      kanji(s, x + 0.2, y + 0.04, 0.42, ch, { fill: last ? C.accent2 : k, color: last ? C.text1 : C.background1, size: 15 })
      T(s, t, { x: x + 0.75, y, w: 3.25, h: 0.5, fontSize: 14, bold: last, color: last ? C.text2 : C.text1, valign: 'middle', margin: 0 })
    })
  })
  arrow(s, 4.7, 2.6, 5.3, 2.6, { color: C.accent2, width: 3 })
  box(s, 0.5, 4.3, 9.0, 0.72, C.text2, { r: 0.12 })
  T(s, 'いまの業務システムを、AI 社員と一緒に回す形に変えます', { x: 0.7, y: 4.3, w: 8.6, h: 0.72, fontSize: 16, bold: true, color: C.background1, valign: 'middle', align: 'center' })
  s.addNotes([
    'ここが今日いちばんお伝えしたい点です。業務システムの「回し方」そのものが変わります。',
    '左がこれまでの形です。人が画面を開いて見に行き、入力して確認し、担当者を追いかけ、数字を集めて報告する。システムは、人が見に来るのを待っています。',
    '右が新しい形です。AI 社員がシステムの中の変化を見守って知らせ、動くべき人にお願いし、下書きやまとめを用意します。人はチャットで内容を確かめて、決めるだけです。',
    '大事なのは下の一文です。いまお使いの業務システムに AI 社員の仕組みをつなぎ、システムの回し方そのものを変えます。画面を新しくするのではなく、仕事の回り方を変える、ということです。新しく業務システムを作る場合も、同じ仕組みを使えます。',
  ].join('\n'))
}

// 4. The new system as a whole
{
  const s = content('はじめに', 'いまの業務システムに、AI 社員をつなぐ')
  // the customer's business system
  box(s, 0.5, 1.2, 2.45, 2.75, C.background2, { r: 0.12 })
  T(s, [
    { text: '御社の業務システム', options: { bold: true, fontSize: 16, color: C.text2, fontFace: F.head, breakLine: true, paraSpaceAfter: 6 } },
    { text: '請求・記録・点検', options: { fontSize: 14, color: C.text1, breakLine: true } },
    { text: '勤怠・予約 など', options: { fontSize: 14, color: C.text1 } },
  ], { x: 0.65, y: 1.35, w: 2.15, h: 1.2 })
  chip(s, 0.65, 2.75, 2.15, 0.42, '「つなぐ部分」を足す', { fill: C.background1, color: C.text2, size: 12, line: C.accent1 })
  chip(s, 0.65, 3.3, 2.15, 0.42, 'データ・規則・承認は中に', { fill: C.background1, color: C.text2, size: 12, line: C.accent1 })
  // the AI employee
  arrow(s, 3.05, 2.55, 3.95, 2.55, { color: C.accent1, width: 2.5 })
  T(s, '見守る', { x: 2.95, y: 2.1, w: 1.1, h: 0.35, fontSize: 13, bold: true, color: C.accent1, align: 'center', margin: 0 })
  kanji(s, 4.05, 1.75, 1.6, 'AI 社員', { fill: C.accent1, size: 20 })
  T(s, '24 時間・休まず', { x: 3.85, y: 3.42, w: 2.0, h: 0.32, fontSize: 13, color: C.accent5, align: 'center', margin: 0 })
  arrow(s, 5.75, 2.55, 6.6, 2.55, { color: C.accent1, width: 2.5 })
  T(s, '知らせる\nお願いする', { x: 5.6, y: 1.85, w: 1.15, h: 0.6, fontSize: 13, bold: true, color: C.accent1, align: 'center', margin: 0 })
  // chat apps
  const apps = ['LINE', 'Teams', 'Slack', 'WeChat', 'WeCom', '飛書（Lark）']
  apps.forEach((a, i) => chip(s, 6.7, 1.2 + i * 0.47, 1.4, 0.38, a, { fill: C.text1, color: C.background1, size: 12 }))
  // people
  arrow(s, 8.2, 2.55, 8.55, 2.55, { color: C.accent5, width: 1.5 })
  kanji(s, 8.65, 1.85, 0.62, '人', { fill: C.accent2, color: C.text1, size: 20 })
  T(s, '職員\n管理者', { x: 8.45, y: 2.55, w: 1.05, h: 0.6, fontSize: 13, bold: true, color: C.text2, align: 'center', margin: 0 })
  // people decide, in the business system
  arrow(s, 8.95, 4.15, 1.75, 4.15, { color: C.accent2, width: 2, dash: 'dash' })
  arrow(s, 8.95, 3.25, 8.95, 4.15, { color: C.accent2, width: 2, dash: 'dash' })
  T(s, '決めるのは人。承認・確定は、業務システムの中に記録', { x: 2.2, y: 4.27, w: 6.6, h: 0.4, fontSize: 15, bold: true, color: C.text2, align: 'center', margin: 0 })
  s.addNotes([
    '全体像です。左が御社の業務システムです。請求や記録、点検、勤怠、予約など、業務の中身はいまのシステムのままの役割を持ちます。',
    'そこに「つなぐ部分」を足します。誰に何を知らせるか、誰が承認するか、AI がどこまで読めるかは、業務のデータ・規則・承認と一緒に、業務システムの側が決めます。',
    '真ん中の AI 社員が、システムの変化や期限を見守り、職員の皆さんがふだん使っているチャットに、報告やお願いを届けます。LINE、Teams、Slack、WeChat、飛書など、主要なチャットに対応しています。',
    '下の点線が大事な点です。最終的に決めるのは人で、承認や確定は業務システムの中に記録されます。AI が勝手に決めることはありません。',
  ].join('\n'))
}

// 5. Five jobs
{
  const s = content('はじめに', 'AI 社員の 6 つの仕事')
  const jobs = [
    ['見', '見守る', 'システムの変化や\n期限を、24 時間\n見張る'],
    ['知', '知らせる', 'いつものチャット\nに、ひと目でわか\nる形で届ける'],
    ['頼', 'お願いする', '動くべき人に、\nやることを\nはっきり伝える'],
    ['案', '下書きする', '提案の下書きを\n作り、人の確認に\n回す'],
    ['報', 'まとめる', '朝と夕方の\n「定時のご報告」\nを用意する'],
    ['覚', '覚えておく', '一人ひとりの\n好みや前の話を\n覚えておく'],
  ]
  jobs.forEach(([k, head, body], i) => {
    const x = 0.5 + i * 1.5
    box(s, x, 1.15, 1.42, 2.85, C.background2, { r: 0.12 })
    kanji(s, x + 0.36, 1.32, 0.7, k, { size: 24 })
    T(s, head, { x, y: 2.12, w: 1.42, h: 0.42, fontSize: 16, bold: true, color: C.text2, align: 'center', fontFace: F.head, margin: 0 })
    T(s, body, { x: x + 0.08, y: 2.62, w: 1.3, h: 1.3, fontSize: 12, color: C.text1, margin: 0 })
  })
  box(s, 0.5, 4.25, 9.0, 0.7, C.background1, { r: 0.12, line: C.accent1, lw: 1.25 })
  T(s, [
    { text: 'チャットで受け取り、答え、決める。', options: { bold: true, color: C.text2 } },
    { text: '画面を開くのは、必要なときだけです。', options: { color: C.text1, breakLine: true } },
    { text: '「〇〇はどこ？」と聞けば、システムのマニュアルから、その人が開ける画面のリンク付きで答えます。', options: { color: C.text1, fontSize: 12 } },
  ], { x: 0.7, y: 4.25, w: 8.6, h: 0.7, fontSize: 14, valign: 'middle', paraSpaceAfter: 0 })
  s.addNotes([
    'AI 社員の仕事を 6 つに分けるとこうなります。',
    '見守る、知らせる、お願いする、下書きする、まとめる、そして覚えておく。一人ひとりの好みや、前に話したことを覚えているので、毎回説明し直す必要がありません（名前や健康のことなど、個人の情報は覚えません）。いずれも、管理者や事務の方が今、手作業でされている仕事です。業務システムに Bizアシスタントをつなぐと、これが AI 社員の仕事になります。',
    '職員の皆さんは、ふだんのチャットで受け取り、答え、決めます。業務の画面を開くのは、詳しく確かめたいときや、まとまった入力をするときだけです。',
    'システムの使い方も、チャットで聞けます。「この操作はどこでするの？」と聞けば、AI 社員がそのシステムのマニュアルだけを根拠に、その人が開ける画面のリンクを付けて答えます。推測で答えることはありません。',
    '次のページから、実際の一日の流れでご覧いただきます。',
  ].join('\n'))
}

// 5b. General-purpose: what the system adds / what Bizアシスタント provides
{
  const s = content('はじめに', '業種もシステムも選ばない、汎用の仕組み')
  box(s, 0.5, 1.1, 4.3, 3.0, C.background2, { r: 0.12 })
  T(s, '業務システムに足すもの（つなぐ部分）', { x: 0.7, y: 1.18, w: 3.9, h: 0.42, fontSize: 15, bold: true, color: C.text2, valign: 'middle', fontFace: F.head, margin: 0 })
  const adds = [
    ['窓', '決まった形の「窓口」', 'AI が読む・提案を受け取る口'],
    ['紹', 'システムの「自己紹介」', '何を知らせ、誰が何をしてよいか'],
    ['鍵', 'いつものログインで本人連携', '職員が自分のチャットを結び付ける'],
    ['宛', '誰に知らせるかの規則', 'システムが判断する'],
  ]
  adds.forEach(([k, head, body], i) => {
    const y = 1.7 + i * 0.6
    kanji(s, 0.7, y + 0.04, 0.44, k, { fill: C.accent6, size: 15 })
    T(s, [
      { text: head, options: { bold: true, fontSize: 13.5, color: C.text2, breakLine: true } },
      { text: body, options: { fontSize: 12, color: C.text1 } },
    ], { x: 1.25, y, w: 3.45, h: 0.54, valign: 'middle', margin: 0 })
  })
  arrow(s, 4.9, 2.6, 5.3, 2.6, { color: C.accent2, width: 3 })
  box(s, 5.4, 1.1, 4.1, 3.0, C.text2, { r: 0.12 })
  T(s, 'Bizアシスタントが用意するもの', { x: 5.6, y: 1.18, w: 3.7, h: 0.42, fontSize: 15, bold: true, color: C.accent2, valign: 'middle', fontFace: F.head, margin: 0 })
  bulletList(s, 5.6, 1.7, 3.75, 2.35, [
    'チャットとの接続（LINE・Teams・Slack ほか）',
    'AI 社員が動く仕組みと、知らせ・承認・報告',
    '本人の権限だけで動く仕組み',
    '関係する人にだけ届ける守り',
    'AI 社員の名前・人柄の設定と、覚える仕組み',
    '確かめるための検査とテスト一式',
  ], { size: 13, color: C.background1 })
  box(s, 0.5, 4.3, 9.0, 0.75, C.background1, { r: 0.12, line: C.accent1, lw: 1.25 })
  T(s, [
    { text: 'つなぐ部分を足せば、どの IT システムも AI 社員と働けます。', options: { bold: true, color: C.text2 } },
    { text: '新しく作るときも同じ仕組みです。', options: { color: C.text1 } },
  ], { x: 0.7, y: 4.3, w: 8.6, h: 0.75, fontSize: 15, valign: 'middle', align: 'center' })
  s.addNotes([
    'Bizアシスタントは、特定の業種やシステム向けの製品ではなく、どの業務システムにも使える汎用の仕組みです。',
    '左が、業務システムの側に足していただくものです。AI が業務データを読み、提案を受け取るための決まった形の窓口。何を知らせ、誰が何をしてよいかを書いたシステムの自己紹介。職員がいつものログインのまま、自分のチャットを結び付ける画面。そして、誰に知らせるかを判断する規則です。どれも、業務システムが自分で持つべき判断で、AI には任せません。',
    '右が、Bizアシスタントの側で用意しているものです。チャットとの接続、AI 社員が動く仕組みと知らせ・承認・報告、本人の権限だけで動く仕組み、関係する人にだけ届ける守り、AI 社員の名前や人柄の設定と一人ひとりのことを覚える仕組み、そしてそれが守られているかを確かめる検査とテストです。',
    'つなぐ部分を足せば、どの IT システムにも、AI エージェントとして働く AI 社員が付きます。新しく業務システムを作る場合も、同じ仕組みを使います。',
  ].join('\n'))
}

// 6. Divider: a day with the AI employee
pres.addSection({ title: 'AI 社員のいる一日' })
{
  const s = pres.addSlide({ masterName: 'SECTION_DARK', sectionTitle: 'AI 社員のいる一日' })
  s.addText('AI 社員のいる一日', { placeholder: 'title', fontFace: F.head, lang: 'ja-JP' })
  T(s, '介護事業所（ケアビリング）での例。画面の内容はすべて架空です', { x: 0.6, y: 1.15, w: 8.8, h: 0.35, fontSize: 14, color: C.background2, margin: 0 })
  s.addShape(S.LINE, { x: 0.9, y: 2.42, w: 8.2, h: 0, line: { color: C.background2, width: 1.5 }, objectName: oid('timeline') })
  DAY.forEach(([t, cap], i) => {
    const cx = 1.6 + i * 2.25
    T(s, t, { x: cx - 0.9, y: 1.7, w: 1.8, h: 0.5, fontSize: 24, bold: true, color: C.background1, align: 'center', margin: 0, fontFace: F.head })
    s.addShape(S.OVAL, { x: cx - 0.14, y: 2.28, w: 0.28, h: 0.28, fill: { color: C.accent2 }, line: { color: C.accent2, width: 0.75 }, objectName: oid('dot') })
    T(s, cap, { x: cx - 1.0, y: 2.68, w: 2.0, h: 0.35, fontSize: 14, color: C.background2, align: 'center', margin: 0 })
  })
  T(s, '先頭のラベルで、「読むだけ」か「動くべき」かがひと目でわかります', { x: 0.6, y: 3.45, w: 8.8, h: 0.35, fontSize: 15, bold: true, color: C.background1, margin: 0 })
  const keys = ['info', 'action', 'urgent', 'approval', 'report']
  keys.forEach((k, i) => {
    const L = LABEL[k]
    const x = 0.6 + i * 1.78
    box(s, x, 3.95, 1.68, 0.85, C.background1, { r: 0.1 })
    T(s, [
      { text: L.text, options: { bold: true, fontSize: 12.5, color: k === 'action' ? 'B36A00' : L.fill, breakLine: true, paraSpaceAfter: 2 } },
      { text: L.meaning, options: { fontSize: 12, color: C.text1 } },
    ], { x, y: 3.95, w: 1.68, h: 0.85, align: 'center', valign: 'middle', margin: 0.02 })
  })
  s.addNotes([
    'ここからは、AI 社員のいる一日を、介護事業所の例で追っていきます。ケアビリングという介護の業務システムで、この仕組みで AI 社員と働いていて、実装済みでデモ環境で動いています。画面の内容は架空の例です。',
    '朝 8 時半の定時のご報告、9 時 20 分の至急の知らせ、14 時のチャットでの承認、16 時の AI 提案、の 4 つの場面です。',
    'AI 社員のメッセージには、先頭にラベルが付きます。読むだけでよい「ご報告」なのか、動いてほしい「対応のお願い」なのか、急ぎの「至急」なのかが、ひと目でわかります。',
  ].join('\n'))
}

// 7. 08:30 daily report
{
  const s = content('AI 社員のいる一日', '朝いちばんに、今日の状況が届く')
  dayStrip(s, 0.5, 1.1, 0)
  chip(s, 0.5, 1.7, 1.9, 0.38, '【定時のご報告】', { fill: C.accent4, size: 12.5 })
  T(s, '毎朝 08:30・夕方 17:30（時刻は変更可）', { x: 2.55, y: 1.7, w: 3.2, h: 0.38, fontSize: 12, color: C.accent5, valign: 'middle', margin: 0 })
  bulletList(s, 0.5, 2.35, 5.2, 1.9, [
    '数字を集めて日報を作る手間がなくなる',
    '「対応が必要なこと」と「ご参考」を分けて届く',
    '誰が・どこで動けばよいかまで書いてある',
    '問題がない日は「順調です」とひとこと',
  ])
  note(s, 0.5, 4.4, 5.2, '守', 'チャットには件数と日付だけ。氏名や記録の中身は書きません')
  const p = phone(s, 6.1, 0.98, 3.4, 4.2)
  bubble(s, p.x, p.y, p.w, null, [
    { label: 'report', t: '10/27 08:30' },
    'おはようございます。現在の業務状況をご報告します。',
    { t: '■ 対応が必要なこと', b: true, c: C.text2 },
    '・承認待ちの記録 3 件：承認の判断をお願いします',
    '・未提出の記録 2 件：担当職員の方は提出をお願いします',
    { t: '■ ご参考', b: true, c: C.text2 },
    '・本日の訪問予定 12 件',
    '・問題なし：未打刻・安否確認',
    { t: '— ケアビリング AI 秘書', c: C.accent5, s: 10 },
  ])
  s.addNotes([
    '朝 8 時半、管理者のチャットに「定時のご報告」が届きます。夕方 5 時半にも届きます。時刻は変えられます。',
    'これまで、朝いちばんに各画面を開いて数字を集め、日報や朝礼の資料を作っていた方も多いと思います。それを AI 社員が用意します。',
    '中身は「対応が必要なこと」と「ご参考」に分かれていて、誰に何をお願いしたいかまで書いてあります。問題がない日は「順調です」とひとことで終わります。',
    'なお、チャットには件数や日付だけを書き、利用者さんの氏名や記録の中身は書きません。',
  ].join('\n'))
}

// 8. 09:20 urgent
{
  const s = content('AI 社員のいる一日', '急ぎのことは、すぐ、必要な人にだけ')
  const p = phone(s, 0.5, 0.98, 3.4, 4.2)
  const yb = bubble(s, p.x, p.y, p.w, null, [
    { label: 'urgent', t: '未打刻の訪問' },
    'おはようございます。09:00 開始予定の訪問が、まだ開始されていません（20 分経過）。',
    { t: '▶ お願いしたいこと（至急）：担当職員に状況を確認し、必要なら代わりの手配をお願いします。', c: C.text2, b: true },
    { t: '— ケアビリング AI 秘書', c: C.accent5, s: 10 },
  ])
  button(s, p.x, yb + 0.14, p.w, 0.42, '業務 Web を開いて対応')
  dayStrip(s, 4.5, 1.1, 1)
  chip(s, 4.5, 1.7, 1.2, 0.38, '【至急】', { fill: C.accent3, size: 12.5 })
  bulletList(s, 4.5, 2.35, 5.0, 1.9, [
    '現場の異変を AI 社員が見つけ、責任者に直接知らせる',
    '「何をしてほしいか」まで、ひと目でわかる',
    'ボタンひとつで、該当の画面が開く',
  ])
  note(s, 4.5, 4.4, 5.0, '夜', '夜は急ぎのものだけ。通知を控える時間帯は本人が設定')
  s.addNotes([
    '9 時 20 分。9 時に始まるはずの訪問が、20 分たっても始まっていません。AI 社員はこれを見つけ、サービス責任者に【至急】で知らせます。',
    'メッセージには「何をしてほしいか」がはっきり書いてあります。担当職員に状況を確認し、必要なら代わりを手配してください、という具合です。ボタンを押せば該当の画面が開きます。',
    'すべてを知らせるとうるさくなるので、通知を控える時間帯を職員ごとに設定できます。夜間は安否確認など急ぎのものだけが届き、それ以外は朝にまとめて届きます。',
  ].join('\n'))
}

// 9. 14:00 approval from chat
{
  const s = content('AI 社員のいる一日', '外出先でも、チャットからワンタップで承認')
  dayStrip(s, 0.5, 1.1, 2)
  chip(s, 0.5, 1.7, 1.9, 0.38, '【承認のお願い】', { fill: C.accent6, size: 12.5 })
  bulletList(s, 0.5, 2.35, 5.2, 1.9, [
    '承認の依頼は、承認できる人にだけ届く',
    '1 人が決めれば、ほかの人のカードは自動で無効に',
    '決定はその場で業務システムに記録される',
    'ボタンが使えないチャットでは、返信で決定',
  ])
  note(s, 0.5, 4.4, 5.2, '守', '項目はシステムが決めたものだけ。AI は書き足しません')
  const p = phone(s, 6.1, 0.98, 3.4, 4.2)
  let y = bubble(s, p.x, p.y, p.w, null, [
    { label: 'approval', t: '請求確定' },
    '請求月：2026-10',
    '期限：10/28 17:00',
    'お疲れさまです。請求確定の承認をお願いします。',
    { t: '▶ 内容を確認し、「承認」か「差戻」を選んでください。', c: C.text2, b: true },
  ])
  button(s, p.x, y + 0.12, p.w / 2 - 0.05, 0.4, '承認', { fill: C.accent1, color: C.background1 })
  button(s, p.x + p.w / 2 + 0.05, y + 0.12, p.w / 2 - 0.05, 0.4, '差戻')
  bubble(s, p.x, y + 0.66, p.w, null, ['承認しました。ありがとうございます。結果はカードにも反映します。'])
  s.addNotes([
    '14 時。月末の請求確定の承認依頼が、承認できる管理者のチャットに届きます。',
    '外出先でも、カードの「承認」ボタンを押すだけで決まります。決定はその場で業務システムに記録されます。承認の規則は業務システムの中にあり、Web の画面で承認するときと同じ規則で判断されます。',
    '承認できる人が複数いる場合、誰か 1 人が決めると、ほかの人のカードは自動的に無効になります。二重に処理される心配はありません。',
    'ボタンが使えないチャットでは、カードに書かれた短いコードを返信して決定できます。金額などの項目はシステムが決めたものだけを載せ、AI が書き足すことはありません。',
  ].join('\n'))
}

// 10. 16:00 AI proposal, a person decides
{
  const s = content('AI 社員のいる一日', '下書きは AI、決めるのは人')
  const p = phone(s, 0.5, 0.98, 3.4, 4.2)
  const yb = bubble(s, p.x, p.y, p.w, null, [
    { label: 'action', t: 'AI 提案' },
    'お疲れさまです。AI 提案が 2 件届きました（請求の下書き 1・記録の整理 1）。',
    { t: '▶ お願いしたいこと：業務 Web の「AI 提案」で内容を確認し、採用か却下をお決めください。', c: C.text2, b: true },
    { t: '— ケアビリング AI 秘書', c: C.accent5, s: 10 },
  ])
  button(s, p.x, yb + 0.14, p.w, 0.42, '業務 Web を開いて対応')
  dayStrip(s, 4.5, 1.1, 3)
  const steps = [
    ['案', 'AI 社員が下書き', '資料や記録から、計画書・請求の下書きを作る', C.accent1],
    ['確', '担当者が確認・修正', '内容を見て、必要なら直す', C.accent2],
    ['決', '人が「採用」して初めて反映', '採用しなければ、システムは何も変わらない', C.accent4],
  ]
  steps.forEach(([k, head, body, fill], i) => {
    const y = 1.7 + i * 1.12
    box(s, 4.5, y, 5.0, 0.95, C.background2, { r: 0.1 })
    kanji(s, 4.65, y + 0.19, 0.57, k, { fill, color: fill === C.accent2 ? C.text1 : C.background1, size: 19 })
    T(s, [
      { text: head, options: { bold: true, fontSize: 15, color: C.text2, fontFace: F.head, breakLine: true, paraSpaceAfter: 2 } },
      { text: body, options: { fontSize: 13, color: C.text1 } },
    ], { x: 5.35, y: y + 0.05, w: 4.05, h: 0.85, valign: 'middle' })
    if (i < 2) arrow(s, 4.935, y + 0.95, 4.935, y + 1.12, { color: C.accent5, width: 1.5 })
  })
  s.addNotes([
    '16 時。AI 社員は、知らせるだけでなく下書きも作ります。たとえば、取り込んだ資料から訪問介護計画書の下書きを作る、請求の取り込みから抜けている請求書の下書きを作る、といった具合です。',
    'ただし、AI が作るのはあくまで「提案」です。担当者が中身を確認し、必要なら直して、「採用」を押して初めてシステムに反映されます。',
    '採用しなければ、システムの中身は何も変わりません。ここが「AI は提案する、決めるのは人」という考え方の一番わかりやすい場面です。',
  ].join('\n'))
}

// 10b. The AI employee's name and personality, set by the company (framework docs/AI_EMPLOYEE_PROFILE.md)
pres.addSection({ title: 'AI 社員の人柄' })
{
  const s = content('AI 社員の人柄', 'AI 社員に、会社が決めた名前と人柄を')
  box(s, 0.5, 1.08, 5.2, 1.95, C.background2, { r: 0.12 })
  T(s, '管理者が画面で決めます（例）', { x: 0.7, y: 1.14, w: 4.8, h: 0.36, fontSize: 13, bold: true, color: C.text2, valign: 'middle', fontFace: F.head, margin: 0 })
  const settings = [
    ['名', '呼び名', 'さくら'],
    ['話', '話し方', 'やわらかめ・です・ます'],
    ['社', '会社の紹介', '事業・拠点・大事にしていること'],
    ['性', '性格・背景', '落ち着いて、先回りして確かめる'],
  ]
  settings.forEach(([k, head, v], i) => {
    const y = 1.56 + i * 0.36
    kanji(s, 0.7, y + 0.02, 0.3, k, { fill: C.accent6, size: 11 })
    T(s, head, { x: 1.1, y, w: 1.25, h: 0.34, fontSize: 12.5, bold: true, color: C.text2, valign: 'middle', margin: 0 })
    T(s, v, { x: 2.35, y, w: 3.25, h: 0.34, fontSize: 12.5, color: C.text1, valign: 'middle', margin: 0 })
  })
  bulletList(s, 0.5, 3.17, 5.2, 1.2, [
    '会社の紹介や大事にしていることを踏まえて話す',
    '役目ごとに別の名前も（請求担当・記録の確認 など）',
    '変更は記録に残り、前の設定に戻せる',
  ], { size: 13.5 })
  note(s, 0.5, 4.42, 5.2, '守', 'AI であることを必ず名乗ります。名前や人柄を変えても、守る決まりは変わりません')
  const p = phone(s, 6.1, 0.98, 3.4, 4.2, { name: 'さくら（AI 秘書）' })
  const yb = bubble(s, p.x, p.y, p.w, null, [
    { label: 'info', t: '本日の訪問' },
    'お疲れさまです。本日の訪問 12 件は、すべて開始しました。',
    'ご対応は不要です。',
    { t: '— さくら（ケアビリング AI 秘書）', c: C.accent5, s: 10 },
  ])
  bubble(s, p.x + 1.0, yb + 0.14, p.w - 1.0, 0.4, ['ありがとう、さくらさん'], { me: true })
  s.addNotes([
    'AI 社員には、会社が決めた名前と人柄を持たせられます。管理者が画面で、呼び名、話し方、会社の紹介、性格や背景を決めます。例えば「さくら」という名前にすると、チャットに届くメッセージの署名が「さくら（ケアビリング AI 秘書）」になり、職員は名前で呼びかけられます。',
    '会社の紹介や大事にしていることを踏まえて話し、請求担当や記録の確認など、役目ごとに別の名前にすることもできます。設定を変えると記録に残り、前の設定に戻せます。',
    '大事なのは下の一文です。AI 社員は、AI であることを必ず名乗ります。人と間違えさせることはしません。また、名前や人柄はあくまで話し方の設定で、本人の権限を超えない、確定は人がする、といった守る決まりは変えられません。（画面の内容は架空の例です。）',
  ].join('\n'))
}

// 10c. How-to questions answered from the manual, and long-term memory
{
  const s = content('AI 社員の人柄', '使い方を聞けば答え、前の話も覚えている')
  const p = phone(s, 0.5, 0.98, 3.4, 4.2, { name: 'さくら（AI 秘書）' })
  let y = bubble(s, p.x + 0.45, p.y, p.w - 0.45, 0.4, ['モニタリングはどこで入力するの？'], { me: true, size: 11 })
  y = bubble(s, p.x, y + 0.12, p.w, null, [
    { label: 'help', t: 'モニタリング' },
    '「モニタリング」の画面で月を選び、担当の方の行の「記録を作る」から入力します。',
    { t: 'こちらから開けます：https://…', c: C.accent1 },
    { t: '— さくら（ケアビリング AI 秘書）', c: C.accent5, s: 10 },
  ], { size: 11 })
  y = bubble(s, p.x + 0.9, y + 0.12, p.w - 0.9, 0.4, ['報告は結論から先にお願い'], { me: true, size: 11 })
  bubble(s, p.x, y + 0.12, p.w, null, ['わかりました。覚えておきます。'], { size: 11 })
  const cards = [
    ['答', '聞けば、開く画面まで案内', ['システムのマニュアルだけを根拠に答える', 'その人が開ける画面のリンクを付ける', '見つからなければ、推測せずにそう伝える'], C.accent1],
    ['覚', '一人ひとりのことを覚える', ['好みのやり方や、前の話の続き', '自分の記憶は自分だけのもの', '名前や健康のことなど、個人の情報は覚えない'], C.accent6],
  ]
  cards.forEach(([k, head, lines, fill], i) => {
    const cy = 1.08 + i * 1.62
    box(s, 4.5, cy, 5.0, 1.48, C.background2, { r: 0.1 })
    kanji(s, 4.65, cy + 0.15, 0.57, k, { fill, size: 19 })
    T(s, head, { x: 5.35, y: cy + 0.12, w: 4.05, h: 0.4, fontSize: 15, bold: true, color: C.text2, valign: 'middle', fontFace: F.head, margin: 0 })
    T(s, lines.map((t, j) => ({ text: t, options: { bullet: { indent: 12 }, breakLine: j < lines.length - 1, paraSpaceAfter: 3 } })), { x: 5.35, y: cy + 0.55, w: 4.05, h: 0.88, fontSize: 12.5, color: C.text1, margin: 0 })
  })
  note(s, 4.5, 4.42, 5.0, '守', '業務のデータは覚えず、毎回最新の内容を読みます')
  s.addNotes([
    'AI 社員には、システムの使い方もチャットで聞けます。「モニタリングはどこで入力するの？」と聞くと、そのシステムのマニュアルだけを根拠に、どの画面で何をするかを答え、その人が開ける画面のリンクを付けます。開けない画面のときは、誰に頼めばよいかを伝えます。マニュアルに無いことは、推測で答えず、見つからないと伝えます。マニュアルは画面と食い違わないよう、システムの側で確かめています。',
    'もう一つは、覚えておくことです。「報告は結論から先に」のような一人ひとりの好みや、前に話したことの続きを覚えているので、会話が新しくなっても毎回説明し直す必要がありません。自分の記憶は自分だけのもので、管理者にも中身は見えません。名前や健康のことなど、個人の情報は覚えない決まりで、保存の前に確かめます。',
    '業務のデータそのものは覚えず、毎回システムから最新の内容を読みます。（画面の内容は架空の例です。）',
  ].join('\n'))
}

// 11. Safety
pres.addSection({ title: '安心と効果' })
{
  const s = content('安心と効果', 'AI は読む・提案する。決めるのは人')
  const cards = [
    ['読', 'AI は読む・提案するだけ', '確定・承認・支払・金額の決定はできない仕組み'],
    ['人', '決めるのは人', '採用・承認は、\n担当者が業務システムで行う'],
    ['権', '本人の権限を超えない', 'AI が見られるのは、\nその職員が見られる範囲だけ'],
    ['記', 'すべて記録に残る', '通知・承認・提案の採否を記録し、後から確かめられる'],
    ['守', 'データは中に置く', '業務データは業務システムの中だけ。\nチャットに氏名や金額を書かない'],
    ['鍵', '連携は本人だけ', '自分のアカウントだけを結び付ける。管理者でも他人の分は不可'],
  ]
  cards.forEach(([k, head, body], i) => {
    const x = 0.5 + (i % 3) * 3.05
    const y = 1.15 + Math.floor(i / 3) * 1.85
    box(s, x, y, 2.9, 1.7, C.background2, { r: 0.12 })
    kanji(s, x + 0.15, y + 0.17, 0.56, k, { size: 19 })
    T(s, head, { x: x + 0.8, y: y + 0.17, w: 2.02, h: 0.56, fontSize: 15, bold: true, color: C.text2, valign: 'middle', fontFace: F.head, margin: 0 })
    T(s, body, { x: x + 0.15, y: y + 0.85, w: 2.62, h: 0.8, fontSize: 13.5, color: C.text1, margin: 0 })
  })
  s.addNotes([
    'AI に対する不安にお答えします。考え方はひとことで「AI は読む・提案する。決めるのは人」です。',
    'AI 社員は、確定・承認・支払・金額の決定といった操作が、仕組みとしてできません。できるのは読むことと、提案を出すことだけです。',
    'また、AI 社員はその職員の代わりに動くので、その職員が見られる範囲しか見られません。職員より強い権限を持つことはありません。',
    '通知や承認、提案の採否は記録に残ります。業務データは業務システムの中に置いたままで、AI は必要なときに本人の権限で読むだけです。チャットには氏名や金額、記録の中身を書きません。',
    'チャットとの連携は、職員本人が自分のアカウントだけを結び付けます。管理者であっても、他人のアカウントを結び付けることはできません。',
    'こうした約束は、つなぐ部分と、Bizアシスタントの共通の仕組みの両方で守ります。どの業務システムをつないでも、同じ約束が同じ形で働きます。',
  ].join('\n'))
}

// 11b. Each person, their own chat, only what concerns them
{
  const s = content('安心と効果', '一人ひとりに、その人に関係することだけ')
  const people = [
    ['介護担当', 'action', '記録の承認', '担当の事業所の未承認の記録が 3 件あります。', '自分の事業所の分だけ'],
    ['ケアマネジャー', 'action', 'モニタリング', '担当の方のモニタリングが 2 件、今月末までです。', '自分の担当の方の分だけ'],
    ['請求・給与担当', 'approval', '請求確定', '10 月分の請求確定の承認をお願いします。', '請求の分だけ・記録は届かない'],
  ]
  people.forEach(([role, label, head, text, cap], i) => {
    const x = 0.5 + i * 3.05
    box(s, x, 1.08, 2.9, 2.35, C.background2, { r: 0.12 })
    chip(s, x + 0.15, 1.2, 1.7, 0.36, role, { fill: C.text2, size: 12 })
    bubble(s, x + 0.15, 1.72, 2.6, null, [{ label, t: head }, text], { size: 11 })
    T(s, cap, { x: x + 0.15, y: 2.82, w: 2.62, h: 0.5, fontSize: 12, bold: true, color: C.accent1, valign: 'middle', margin: 0 })
  })
  const points = [
    ['繋', '自分のチャットは自分でつなぐ\n（LINE・Teams・Slack・WeChat ほか）'],
    ['判', '誰に届けるかは業務システムが判断\nAI は宛先を選ばない'],
    ['群', 'グループチャットでは業務の話をしない'],
    ['止', '宛先がはっきりしないときは送らない'],
  ]
  points.forEach(([k, t], i) => {
    const x = 0.5 + (i % 2) * 4.55
    const y = 3.62 + Math.floor(i / 2) * 0.72
    kanji(s, x, y + 0.06, 0.48, k, { fill: C.accent1, size: 16 })
    T(s, t, { x: x + 0.6, y, w: 3.85, h: 0.6, fontSize: 13, color: C.text1, valign: 'middle', margin: 0 })
  })
  s.addNotes([
    'AI 社員からの知らせは、職員一人ひとりの、ふだん使っているチャットに届きます。チャットは職員が自分でつなぎます。会社のボットにつなぐこともできますし、自分のボットをつなぐこともできます。管理者でも、他人のアカウントをつなぐことはできません。',
    '届くのは、その人に関係することだけです。介護担当には自分の事業所の記録の承認、ケアマネジャーには自分が担当する方のモニタリング、請求・給与担当には請求の承認、という具合です（画面は架空の例です）。',
    '誰に届けるかを判断するのは業務システムで、役割・所属・担当の範囲で決めます。AI が宛先を選ぶことはありません。グループチャットでは業務の話をせず、宛先がはっきりしないときは送りません。これは心がけではなく、仕組みとして決まっています。',
  ].join('\n'))
}

// 12. Before / after
{
  const s = content('安心と効果', '減るのは「見に行く・追いかける・まとめる」時間')
  T(s, 'これまで', { x: 1.75, y: 1.08, w: 3.55, h: 0.35, fontSize: 14, bold: true, color: C.accent5, margin: 0 })
  T(s, 'AI 社員と働くと', { x: 6.0, y: 1.08, w: 3.5, h: 0.35, fontSize: 14, bold: true, color: C.accent1, margin: 0 })
  const rows = [
    ['確認', '何度も画面を開いて見に行く', '変化があればチャットに届く'],
    ['催促', '電話や声かけで追いかける', 'AI 社員が担当者にお願いする'],
    ['承認', '事務所に戻って PC で承認', '外出先からワンタップで承認'],
    ['報告', '数字を集めて日報を作る', '朝夕に定時のご報告が届く'],
    ['期限', '気づいたら期限切れ', '期限の前にお知らせが届く'],
  ]
  rows.forEach(([k, before, after], i) => {
    const y = 1.5 + i * 0.72
    chip(s, 0.5, y, 1.1, 0.58, k, { fill: C.text2, size: 15 })
    box(s, 1.75, y, 3.6, 0.58, C.background2, { r: 0.08 })
    T(s, before, { x: 1.9, y, w: 3.4, h: 0.58, fontSize: 14, color: C.accent5, valign: 'middle', margin: 0 })
    arrow(s, 5.45, y + 0.29, 5.85, y + 0.29, { color: C.accent2, width: 2.5 })
    box(s, 5.95, y, 3.55, 0.58, C.background1, { r: 0.08, line: C.accent1, lw: 1.25 })
    T(s, after, { x: 6.1, y, w: 3.35, h: 0.58, fontSize: 14, bold: true, color: C.text2, valign: 'middle', margin: 0 })
  })
  s.addNotes([
    'では、何が減るのか。管理者や事務の方の時間のうち、「見に行く・追いかける・写す・まとめる」に使っている時間です。',
    '確認のために何度も画面を開く代わりに、変化があったときだけチャットに届きます。担当者を電話で追いかける代わりに、AI 社員が担当者に直接お願いします。',
    '承認は外出先からワンタップで済み、日報は朝夕に自動で届きます。期限は、切れる前にお知らせが届きます。',
    '時間が減るだけでなく、対応漏れや期限切れを減らせることも、経営にとって大きな効果です。',
  ].join('\n'))
}

// お問い合わせの行：このフォルダの contact.local.json（{ "contact": "…" }、git には入れない）があればそれを使う。無ければ置き場所の文字。
const CONTACT = (() => {
  try { return JSON.parse(fs.readFileSync(path.join(__dirname, 'contact.local.json'), 'utf8')).contact || null } catch { return null }
})() ?? '［会社名］　［ご担当者名］　［メールアドレス・電話番号］'

// 13. ROI estimate (clearly labelled as an illustrative estimate)
{
  const s = content('安心と効果', '試算例：1 日 30 分の削減が、月 300 時間に')
  chip(s, 6.6, 0.98, 2.9, 0.36, '試算例（前提を置いた参考値）', { fill: C.accent2, color: C.text1, size: 12 })
  const tiles = [
    ['30 名', '対象の職員'],
    ['30 分', '1 人 1 日あたり'],
    ['20 日', '1 か月の稼働日'],
    ['300 時間', '1 か月あたり'],
  ]
  const ops = ['×', '×', '＝']
  tiles.forEach(([v, cap], i) => {
    const x = 0.5 + i * 2.35
    const last = i === tiles.length - 1
    box(s, x, 1.5, 1.95, 1.2, last ? C.accent1 : C.background2, { r: 0.12 })
    T(s, [
      { text: v, options: { fontSize: 28, bold: true, color: last ? C.background1 : C.text2, fontFace: F.head, breakLine: true } },
      { text: cap, options: { fontSize: 13, color: last ? C.background1 : C.text1 } },
    ], { x, y: 1.5, w: 1.95, h: 1.2, align: 'center', valign: 'middle', margin: 0.02 })
    if (i < 3) T(s, ops[i], { x: x + 1.95, y: 1.5, w: 0.4, h: 1.2, fontSize: 24, bold: true, color: C.accent5, align: 'center', valign: 'middle', margin: 0 })
  })
  box(s, 0.5, 2.95, 9.0, 0.85, C.background1, { r: 0.12, line: C.accent1, lw: 1.25 })
  T(s, [
    { text: '時間あたり人件費 2,000 円とすると　', options: { fontSize: 15, color: C.text1 } },
    { text: '月 約 60 万円・年 約 720 万円', options: { fontSize: 22, bold: true, color: C.text2, fontFace: F.head } },
    { text: '　相当の時間', options: { fontSize: 15, color: C.text1 } },
  ], { x: 0.7, y: 2.95, w: 8.6, h: 0.85, valign: 'middle', align: 'center' })
  box(s, 0.5, 3.98, 9.0, 1.12, C.background2, { r: 0.1 })
  T(s, [
    { text: '前提：', options: { bold: true, color: C.text2 } },
    { text: '人数・削減時間・稼働日数・人件費は、説明のために置いた仮の値です。削減時間は「確認・催促・承認・報告」の合計で、中核の業務では 1 日 30 分〜1 時間と見込み、少ないほうの 30 分で計算しています。', options: { breakLine: true, paraSpaceAfter: 4 } },
    { text: '実際の効果を示すものではなく、業務の内容や使い方によって変わります。御社の人数と業務で、一緒に試算します。', options: {} },
  ], { x: 0.7, y: 4.03, w: 8.6, h: 1.02, fontSize: 12, color: C.text1, valign: 'middle' })
  s.addNotes([
    'ここは、効果の大きさをイメージしていただくための「試算例」です。実績や保証ではなく、前提を置いた参考値であることをはっきり申し上げておきます。',
    '前提は、対象の職員 30 名、1 人あたり 1 日 30 分、確認・催促・承認・報告の時間が減るとし、月 20 日稼働とします。中核の業務では 1 日 30 分から 1 時間ほど減ると見込んでいて、ここでは少ないほうの 30 分で計算しています。すると月 300 時間になります。',
    '時間あたりの人件費を 2,000 円と置くと、月約 60 万円、年約 720 万円に相当する時間です。',
    '数字はすべて仮の値です。実際には御社の人数や業務によって大きく変わりますので、ご相談の際に御社の数字で一緒に試算させてください。',
  ].join('\n'))
}

// 14. What the system adds: the integration checklist (docs/GUIDELINE.md「既存の業務システムをつなぐ：チェックリスト」)
pres.addSection({ title: 'つなぎ方' })
{
  const s = content('つなぎ方', 'つなぐために、業務システムに足すもの')
  T(s, 'いまのシステムに、次の 7 つをそろえます（足りないものは、つなぐ作業の中で足します）', { x: 0.5, y: 1.0, w: 5.7, h: 0.34, fontSize: 12, color: C.accent5, valign: 'middle', margin: 0 })
  const items = [
    'AI が読む・提案を受け取る「窓口」がある',
    'システムの「自己紹介」（知らせ・役割）を書く',
    'チャット連携の画面で、今と同じログインが使える',
    '誰に知らせるかを、システムが判断できる',
    '「いつ・何が変わったか」をシステムが記録する',
    '職員と役割、承認の規則がシステムの中にある',
    'ログアウトや退職で、AI の権限もすぐ止められる',
  ]
  items.forEach((t, i) => {
    const y = 1.42 + i * 0.52
    box(s, 0.5, y, 5.7, 0.44, C.background2, { r: 0.08 })
    box(s, 0.62, y + 0.1, 0.24, 0.24, C.background1, { r: 0.04, line: C.accent1, lw: 1.5, name: 'checkbox' })
    T(s, String(i + 1), { x: 0.95, y, w: 0.3, h: 0.44, fontSize: 13, bold: true, color: C.accent1, valign: 'middle', margin: 0, fontFace: F.head })
    T(s, t, { x: 1.25, y, w: 4.9, h: 0.44, fontSize: 13, color: C.text1, valign: 'middle', margin: 0 })
  })
  box(s, 6.45, 1.0, 3.05, 4.06, C.text2, { r: 0.12 })
  T(s, [
    { text: 'ほかの部分は、', options: { breakLine: true } },
    { text: 'Bizアシスタントが用意', options: {} },
  ], { x: 6.6, y: 1.15, w: 2.75, h: 0.75, fontSize: 16, bold: true, color: C.background1, valign: 'middle', fontFace: F.head, margin: 0 })
  T(s, 'チャットとの接続、AI 社員の仕組み、\n知らせ・承認・報告、\n関係する人にだけ届ける守り', { x: 6.6, y: 1.95, w: 2.75, h: 0.95, fontSize: 12, color: C.background2, margin: 0 })
  arrow(s, 7.975, 2.95, 7.975, 3.25, { color: C.accent2, width: 3 })
  box(s, 6.6, 3.3, 2.75, 0.85, C.accent2, { r: 0.1 })
  T(s, [
    { text: '最初の診断で、', options: { breakLine: true } },
    { text: '足すものと期間を見積もり', options: {} },
  ], { x: 6.6, y: 3.3, w: 2.75, h: 0.85, fontSize: 14, bold: true, color: C.text1, align: 'center', valign: 'middle', fontFace: F.head, margin: 0 })
  T(s, '足す量が大きいときは、同じ仕組みで新しく作ることもできます', { x: 6.6, y: 4.25, w: 2.75, h: 0.7, fontSize: 11.5, color: C.background2, margin: 0 })
  s.addNotes([
    'では、いまお使いの業務システムをつなぐには、何が要るのか。左の 7 つです。これは「できない理由」の一覧ではなく、つなぐ作業の手順の一覧です。足りないものは、つなぐ作業の中で足していきます。',
    '1 つ目は、AI が業務データを読み、提案を受け取るための決まった形の窓口。2 つ目は、何を知らせ、誰が何をしてよいかを書いたシステムの自己紹介。3 つ目は、職員が自分のチャットを結び付ける画面で、今のシステムと同じログインが使えること。別のログインを作らないことが、なりすましを防ぐ要です。',
    '4 つ目は、誰に知らせるかをシステムが判断できること。役割、所属、担当の範囲で判断し、AI には任せません。5 つ目は、何がいつ変わったかをシステムが記録すること。6 つ目は職員と役割、承認の規則がシステムの中にあること。7 つ目は、ログアウトや退職のときに AI の権限もすぐ止められることです。',
    'どれだけ足すかはシステムによって違います。とくに窓口とログインは作りの根本に関わることがあるので、最初の診断で、足すものと期間を見積もります。足す量が大きい場合は、同じ仕組みの上で業務システムを新しく作ることもできます。',
  ].join('\n'))
}

// 15. AI-assisted development makes connecting fast and reliable
{
  const s = content('つなぎ方', 'AI を使った開発で、つなぐ作業を速く確実に')
  const cards = [
    ['診', '診断', '今のシステムと業務を\nAI と一緒に読み解き、\n足すものを洗い出す'],
    ['作', '開発', 'つなぐ部分を AI を\n使って作る。AI 社員の\n部分は共通の仕組みを\nそのまま使う'],
    ['確', '確認', '決まった検査項目と\nテストで、約束が\n守られているか確かめる'],
  ]
  cards.forEach(([k, head, body], i) => {
    const x = 0.5 + i * 3.05
    box(s, x, 1.1, 2.9, 2.2, C.background2, { r: 0.12 })
    kanji(s, x + 0.15, 1.25, 0.56, k, { size: 19 })
    T(s, head, { x: x + 0.82, y: 1.25, w: 1.95, h: 0.56, fontSize: 17, bold: true, color: C.text2, valign: 'middle', fontFace: F.head, margin: 0 })
    T(s, body, { x: x + 0.15, y: 1.95, w: 2.62, h: 1.25, fontSize: 14, color: C.text1, margin: 0 })
    if (i < 2) arrow(s, x + 2.92, 2.2, x + 3.03, 2.2, { color: C.accent2, width: 2.5 })
  })
  box(s, 0.5, 3.55, 9.0, 1.5, C.background1, { r: 0.12, line: C.accent1, lw: 1.25 })
  kanji(s, 0.75, 3.85, 0.85, '小', { fill: C.accent4, size: 28 })
  T(s, '小さく始める', { x: 1.85, y: 3.7, w: 2.4, h: 0.5, fontSize: 18, bold: true, color: C.text2, valign: 'middle', fontFace: F.head, margin: 0 })
  T(s, '一度に全部は替えません', { x: 1.85, y: 4.2, w: 2.4, h: 0.6, fontSize: 13, color: C.accent5, margin: 0 })
  bulletList(s, 4.3, 3.72, 5.05, 1.25, [
    'まず 1 つの業務（例：請求、点検）から',
    '今の画面と並行して動かし、確かめてから広げる',
  ], { size: 14 })
  s.addNotes([
    'つなぐ作業そのものも、AI を使った開発で速く、確実に進められるようになりました。',
    '診断では、今のシステムと業務を AI と一緒に読み解き、先ほどの 7 つのうち足すものを洗い出します。開発では、つなぐ部分を AI を使って作り、AI 社員の仕組みは Bizアシスタントの共通部分をそのまま使います。確認では、決まった検査項目とテストで、本人の権限を超えない、関係する人にだけ届く、といった約束が守られているかを確かめます。',
    'そして、一度に全部をつなぐ必要はありません。まず請求や点検など 1 つの業務から始め、今の画面と並行して動かして確かめてから広げます。',
    'どのくらいの期間がかかるかは業務の範囲によって変わりますので、後ほどの導入ステップでは目安としてお示しします。',
  ].join('\n'))
}

// ════════════════════════════════════════════════════════════════════════
// 自分で育つシステム：運用 AI（Ops Agent）。framework の docs/RSI_SELF_IMPROVING_SYSTEM.md v0.3（2026-11-01）
// 開発環境では AI が直してそのまま反映。本番は検証環境で確かめてから、担当者がチャットで判断する。セキュリティの対処も担当者の承認のあと。
pres.addSection({ title: '自分で育つシステム' })

// O1. two AIs
{
  const s = content('自分で育つシステム', 'システムの見守りも、AI に任せる：運用 AI')
  const two = [
    ['働', '業務の AI 社員', '職員一人ひとりを手伝う。読む・知らせる・下書きする。決めるのは人', C.accent1],
    ['守', '運用 AI（新しく追加）', 'システムそのものを見守り、直し、守る。本番に出すかは担当者が決める', C.accent3],
  ]
  two.forEach(([k, h, b, fill], i) => {
    const x = 0.5 + i * 4.55
    box(s, x, 1.1, 4.45, 1.4, C.background2, { r: 0.12, line: fill })
    kanji(s, x + 0.2, 1.4, 0.8, k, { fill, size: 28 })
    T(s, h, { x: x + 1.15, y: 1.22, w: 3.2, h: 0.45, fontSize: 17, bold: true, color: C.text2, fontFace: F.head, margin: 0, valign: 'middle' })
    T(s, b, { x: x + 1.15, y: 1.7, w: 3.2, h: 0.85, fontSize: 13, color: C.text1, margin: 0 })
  })
  T(s, '運用 AI の 6 つの仕事', { x: 0.5, y: 2.75, w: 6, h: 0.35, fontSize: 14, bold: true, color: C.accent3, fontFace: F.head, margin: 0 })
  const jobs = [
    ['見', '見張る', '1 分ごとに動きを確認'],
    ['調', '調べる', '記録から原因を探す'],
    ['直', '直して試す', '開発環境で直し、検証環境で確認'],
    ['提', '提案する', '本番の更新はチャットで提案'],
    ['備', '備える', '攻撃や弱点への対処を準備'],
    ['覚', '覚える', '同じ失敗をしない'],
  ]
  jobs.forEach(([k, h, b], i) => {
    const x = 0.5 + i * 1.52
    box(s, x, 3.2, 1.42, 1.6, C.background1, { r: 0.12, line: C.accent3 })
    kanji(s, x + 0.43, 3.32, 0.56, k, { fill: C.accent3, size: 19 })
    T(s, h, { x: x + 0.05, y: 3.93, w: 1.32, h: 0.35, fontSize: 13, bold: true, color: C.text2, align: 'center', margin: 0, fontFace: F.head })
    T(s, b, { x: x + 0.05, y: 4.3, w: 1.32, h: 0.45, fontSize: 10.5, color: C.text1, align: 'center', margin: 0 })
  })
  s.addNotes([
    'ここからは、Bizアシスタントの次の段階です。これまでの AI 社員は、職員一人ひとりを手伝う AI でした。ここに、システムそのものの面倒を見る二人目の AI、運用 AI を加えます。',
    '運用 AI は、1 分ごとにシステムの動きを確かめ、記録から原因を探し、開発用の環境で直して試し、本番とそっくりの検証環境で確かめます。本番の更新は、担当者にチャットで提案し、出すかどうかは担当者が決めます。攻撃や弱点への対処も準備まで行い、実施は担当者の承認のあとです。一度起きたことは覚えておき、同じ失敗をしないように手順やテストを増やしていきます。',
    '運用 AI が話す相手は担当者だけです。職員が使う AI 社員とは役割も権限も分けてあります。',
  ].join('\n'))
}

// O2. two environments: development (AI fixes and releases) / production (verified, the person decides)
{
  const s = content('自分で育つシステム', '開発環境は AI が直し、本番は担当者が決める')
  const lanes = [
    {
      y: 1.05, h: 1.5, k: '開', name: '開発環境', sub: '自動で直す', line: C.accent1,
      steps: ['見つける', '直す', '試す', 'そのまま反映', '覚える'], human: -1,
      note: '本物のお客さまはいない環境です。AI が自分で何度でも直して試し、覚えた手順で次はもっと速く。',
    },
    {
      y: 2.75, h: 1.6, k: '本', name: '本番環境', sub: '人が決める', line: C.accent6,
      steps: ['見つける', '検証環境で\n再現', '直す', '検証環境で\n確かめる', 'チャットで\n提案', '担当者が\n判断'], human: 5,
      note: '検証環境＝本番とそっくりの試し場所（違うのは規模だけ。データは個人の情報を伏せたもの）',
    },
  ]
  lanes.forEach((L) => {
    box(s, 0.5, L.y, 9.0, L.h, C.background2, { r: 0.12, line: L.line, lw: 1.25 })
    kanji(s, 0.88, L.y + 0.16, 0.62, L.k, { fill: L.line, size: 21 })
    T(s, [{ text: L.name, options: { bold: true, fontSize: 14, color: C.text2, breakLine: true } }, { text: L.sub, options: { fontSize: 10.5, color: L.line, bold: true } }], { x: 0.55, y: L.y + 0.82, w: 1.3, h: 0.6, align: 'center', margin: 0, fontFace: F.head })
    const n = L.steps.length
    const gap = n === 5 ? 0.2 : 0.14
    const w = (7.2 - gap * (n - 1)) / n
    const cy = L.y + 0.2
    const ch = n === 5 ? 0.62 : 0.72
    L.steps.forEach((t, i) => {
      const x = 2.1 + i * (w + gap)
      const human = i === L.human
      chip(s, x, cy, w, ch, t, { fill: human ? C.accent2 : C.accent1, color: human ? C.text1 : C.background1, size: n === 5 ? 13 : 11.5 })
      if (i < n - 1) arrow(s, x + w + 0.01, cy + ch / 2, x + w + gap - 0.01, cy + ch / 2, { color: C.text2, width: 1.5 })
    })
    T(s, L.note, { x: 2.1, y: cy + ch + 0.12, w: 7.25, h: 0.42, fontSize: 11.5, color: C.text1, margin: 0, valign: 'middle' })
  })
  box(s, 0.5, 4.5, 9.0, 0.55, C.text2, { r: 0.1 })
  T(s, [
    { text: '本番の更新も、セキュリティの対処も、担当者がチャットで判断。', options: { bold: true, color: C.accent2 } },
    { text: '返事がないまま AI が本番を変えることはありません。', options: { color: C.background1 } },
  ], { x: 0.7, y: 4.5, w: 8.6, h: 0.55, fontSize: 12, valign: 'middle', margin: 0 })
  s.addNotes([
    '運用 AI の任せ方は、環境によって変えます。',
    '上は開発環境です。開発のための環境で、本物のお客さまはいません。ここでは、運用 AI が不具合を見つけたら、自分で直して試し、そのまま反映します。うまくいかなければ自動で元に戻して、もう一度直します。こうして覚えた手順やテストが増え、次はもっと速く直せるようになります。これが「自分で育つシステム」です。',
    '下は本番環境、つまりお客さまが毎日使っているシステムです。ここでは運用 AI は自分では何も変えません。まず、本番とそっくりの検証環境で同じ不具合を再現します。検証環境は本番と同じ版・同じ設定で、違うのは規模だけ、データは個人の情報を伏せたものです。そこで直して確かめてから、担当者のチャットに更新の計画を送ります。何を変えるか、どこに影響するか、確かめた結果、おすすめの時間、元に戻す方法、リスクです。出すかどうかは担当者が決めます。',
    'セキュリティの対処も同じで、実施の前に必ず担当者が承認します。返事がないまま AI が本番を変えることはありません。',
  ].join('\n'))
}

// O3. keeps running on another server
{
  const s = content('自分で育つシステム', 'システムが止まっても、運用 AI は別の場所で動き続ける')
  // diagram
  box(s, 0.5, 1.35, 2.2, 1.55, C.accent6, { r: 0.12 })
  T(s, [{ text: '業務システム', options: { bold: true, fontSize: 15, breakLine: true, fontFace: F.head } }, { text: 'いまのサーバー\n業務の AI 社員もここ', options: { fontSize: 11 } }], { x: 0.6, y: 1.42, w: 2.0, h: 1.4, color: C.background1, valign: 'middle', align: 'center' })
  box(s, 3.6, 1.35, 2.0, 1.55, C.accent3, { r: 0.12 })
  T(s, [{ text: '運用 AI', options: { bold: true, fontSize: 15, breakLine: true, fontFace: F.head } }, { text: '別のサーバー\n記録の控えもここ', options: { fontSize: 11 } }], { x: 3.65, y: 1.42, w: 1.9, h: 1.4, color: C.background1, valign: 'middle', align: 'center' })
  arrow(s, 2.72, 1.8, 3.58, 1.8, { color: C.accent2, width: 2.5 })
  T(s, '記録', { x: 2.72, y: 1.48, w: 0.86, h: 0.28, fontSize: 10.5, bold: true, color: C.accent2, align: 'center', margin: 0 })
  arrow(s, 3.58, 2.45, 2.72, 2.45, { color: C.accent3, width: 2.5, dash: 'dash' })
  T(s, '見守り', { x: 2.7, y: 2.5, w: 0.9, h: 0.28, fontSize: 10, bold: true, color: C.accent3, align: 'center', margin: 0 })
  chip(s, 3.6, 3.35, 2.0, 0.6, '担当者のチャット', { fill: C.accent2, color: C.text1, size: 13 })
  arrow(s, 4.5, 2.92, 4.5, 3.33, { color: C.text2, width: 2, both: true })
  chip(s, 0.5, 3.35, 2.2, 0.6, '開発の仕組み（GitHub）', { fill: C.text1, size: 12 })
  arrow(s, 3.58, 3.05, 2.72, 3.45, { color: C.text2, width: 1.5 })
  T(s, '修正', { x: 2.95, y: 2.98, w: 0.5, h: 0.24, fontSize: 9, color: C.text2, bold: true, margin: 0 })
  arrow(s, 1.6, 3.33, 1.6, 2.92, { color: C.text2, width: 1.5, dash: 'dash' })
  T(s, '承認後に更新', { x: 1.65, y: 3.02, w: 1.0, h: 0.26, fontSize: 9.5, color: C.text2, bold: true, margin: 0 })
  box(s, 0.5, 4.2, 5.1, 0.8, C.background2, { r: 0.1 })
  T(s, 'サーバーを分けるので、業務システムが止まっても、直前の記録は運用 AI の側に残り、担当者とも話せます。', { x: 0.65, y: 4.22, w: 4.85, h: 0.76, fontSize: 12, color: C.text1, valign: 'middle', margin: 0 })
  // steps
  const steps = [
    ['気づく', '1 分ごとの確認で、止まったこと・遅いことに気づく'],
    ['戻す案を出す', '原因が新しい版なら、戻す案をチャットで送る'],
    ['担当者が判断', 'ワンタップで承認すると、すぐに前の版へ'],
    ['調べる・直す', '残った記録で原因を探し、検証環境で確かめる'],
    ['更新を提案', '直した版を出すかどうかも、担当者が判断'],
  ]
  steps.forEach(([h, b], i) => {
    const y = 1.1 + i * 0.79
    const human = i === 2
    kanji(s, 6.0, y + 0.06, 0.52, String(i + 1), { fill: human ? C.accent2 : C.accent1, color: human ? C.text1 : C.background1, size: 17 })
    T(s, h, { x: 6.65, y, w: 2.9, h: 0.32, fontSize: 14, bold: true, color: C.text2, fontFace: F.head, margin: 0 })
    T(s, b, { x: 6.65, y: y + 0.32, w: 2.9, h: 0.42, fontSize: 11, color: C.text1, margin: 0 })
  })
  s.addNotes([
    '運用 AI は、業務システムとは別のサーバーで動きます。業務システムの記録は、個人の情報を伏せたうえで、運用 AI の側にも控えとして送られます。',
    'ですから、業務システムがまるごと止まっても、運用 AI は動き続け、直前の記録を調べ、担当者とチャットで話せます。',
    '流れは右のとおりです。止まったことや遅くなったことに 1 分以内に気づき、新しい版が原因なら「前の版に戻す」案をすぐにチャットで送ります。担当者がワンタップで承認すれば、すぐに前の版に戻り、まず動く状態にします。それから原因を探して修正を作り、検証環境で確かめ、直した版を出すかどうかも担当者に提案します。本番を変えるときは、いつも担当者の判断が先です。',
  ].join('\n'))
}

// O4. scope
{
  const s = content('自分で育つシステム', '任せるのは開発環境まで。本番は担当者が決める')
  const cols = [
    ['任', 'AI に任せる（開発環境・確認なし）', C.accent1, ['不具合を見つけて直す', '開発環境で試して、そのまま反映', '記録から原因を調べる', '手順やテストを増やす']],
    ['決', '担当者がチャットで決める（本番・すべて）', C.accent3, ['本番への更新（修正・部品の更新）', '再起動・前の版に戻す', 'セキュリティの対処', 'AI 自身のルール']],
  ]
  cols.forEach(([k, h, fill, items], i) => {
    const x = 0.5 + i * 4.55
    box(s, x, 1.1, 4.45, 2.6, C.background2, { r: 0.12, line: fill })
    kanji(s, x + 0.2, 1.25, 0.62, k, { fill, size: 21 })
    T(s, h, { x: x + 0.95, y: 1.25, w: 3.4, h: 0.62, fontSize: 14, bold: true, color: C.text2, valign: 'middle', fontFace: F.head, margin: 0 })
    bulletList(s, x + 0.25, 2.0, 4.0, 1.65, items, { size: 13 })
  })
  T(s, '任せる範囲は、記録で確かめながら 1 段ずつ広げます。本番を AI だけで更新する段階はありません', { x: 0.5, y: 3.85, w: 9, h: 0.32, fontSize: 12.5, bold: true, color: C.accent1, fontFace: F.head, margin: 0 })
  const ladder = ['見るだけ', '報告する', '修正を下書き', '開発環境まで自動', '本番は確かめて提案']
  ladder.forEach((t, i) => {
    const x = 0.5 + i * 1.82
    chip(s, x, 4.3, 1.62, 0.6, t, { fill: i === 4 ? C.accent1 : C.background1, color: i === 4 ? C.background1 : C.text2, line: C.accent1, size: i >= 3 ? 11 : 12 })
    if (i < ladder.length - 1) arrow(s, x + 1.63, 4.6, x + 1.81, 4.6, { color: C.accent1, width: 1.75 })
  })
  s.addNotes([
    '運用 AI に任せる範囲は、開発環境までです。開発環境では、不具合を見つけて直し、試して、そのまま反映し、原因を調べ、手順やテストを増やすところまで、確認なしで進めます。',
    '本番環境では、すべてを担当者がチャットで決めます。本番への更新、再起動や前の版に戻すこと、セキュリティの対処、そして AI 自身のルールに関わる変更です。運用 AI は、何を変えるか、どこに影響するか、検証環境で確かめた結果、おすすめの時間、元に戻す方法、リスクをまとめてチャットに送り、担当者はそれを見て、承認するか、見送るか、時間を変えるかを選べます。お金の計算や権限に関わるような大事な変更は、確認をもう一段厚くします。',
    '最初から全部を任せるわけではありません。見るだけ、報告する、修正を下書きする、開発環境まで自動、本番は検証環境で確かめて提案、と、記録で確かめながら一段ずつ広げます。本番を AI だけで更新する段階はありません。締め日の前後の更新は仕組みとして止め、すべての変更と判断は記録に残ります。',
  ].join('\n'))
}

// O5. security
{
  const s = content('自分で育つシステム', 'セキュリティも毎晩点検。対処は担当者の承認のあと')
  const cards = [
    ['更', '毎晩の点検', ['部品と OS の弱点を毎晩確認', '更新は検証環境で確かめる', '本番の更新は担当者が承認'], C.accent1],
    ['視', '見張る', ['不審なアクセス・ログインの失敗', 'いつもと違う使われ方', '秘密の情報の漏れ'], C.accent6],
    ['防', '対処を準備', ['怪しい接続を一時的に止める案', '怪しいログインのやり直しの案', '担当者が承認してから実施'], C.accent3],
  ]
  cards.forEach(([k, h, items, fill], i) => {
    const x = 0.5 + i * 3.05
    box(s, x, 1.1, 2.9, 2.25, C.background2, { r: 0.12, line: fill })
    kanji(s, x + 0.18, 1.22, 0.6, k, { fill, size: 20 })
    T(s, h, { x: x + 0.9, y: 1.22, w: 1.9, h: 0.6, fontSize: 16, bold: true, color: C.text2, valign: 'middle', fontFace: F.head, margin: 0 })
    bulletList(s, x + 0.2, 1.92, 2.65, 1.4, items, { size: 12 })
  })
  const flow = ['見つける', '検証環境で確認', 'チャットで提案', '担当者が承認', '本番に反映']
  flow.forEach((t, i) => {
    const x = 0.5 + i * 1.82
    const human = i === 3
    chip(s, x, 3.55, 1.62, 0.55, t, { fill: human ? C.accent2 : C.background1, color: C.text1, line: human ? C.accent2 : C.accent1, size: 12 })
    if (i < flow.length - 1) arrow(s, x + 1.63, 3.82, x + 1.81, 3.82, { color: C.accent1, width: 1.75 })
  })
  box(s, 0.5, 4.3, 9.0, 0.72, C.text2, { r: 0.1 })
  T(s, [
    { text: '守るのは自社のシステムだけ。', options: { bold: true, color: C.accent2 } },
    { text: '安全のための対処も、本番で実施する前に必ず担当者がチャットで承認し、すべて記録に残ります。', options: { color: C.background1 } },
  ], { x: 0.7, y: 4.32, w: 8.6, h: 0.68, fontSize: 13, valign: 'middle', margin: 0 })
  s.addNotes([
    'セキュリティも運用 AI の仕事です。システムを作っている部品や OS の更新と、新しく見つかった弱点を毎晩確かめます。更新は開発環境に入れ、検証環境で問題がないことを確かめてから、本番に出す計画を担当者に提案します。急ぐ弱点のときは、すぐに知らせ、返事がなければもう一度、そして別の担当者にも知らせますが、返事がないまま AI が本番を更新することはありません。',
    'あわせて、不審なアクセスやログインの失敗、いつもと違う使われ方、秘密の情報の漏れを見張ります。怪しい接続を時間を区切って止める、怪しいログインをやり直させる、といった対処の案を作り、ふだんの操作を妨げないかを検証環境で確かめてから、理由・影響・期限・取り消し方を添えてチャットで承認を求めます。担当者が承認してから実施し、すべて記録に残します。',
    '守るのは自社のシステムだけで、外のシステムを調べたり攻撃したりはしません。AI の力が上がるほど、見つける速さと準備の質が上がっていきます。',
  ].join('\n'))
}

// 16. Proof
pres.addSection({ title: '実績と導入' })
{
  const s = content('実績と導入', 'この仕組みで、業務システムがすでに動いています')
  box(s, 0.5, 1.12, 4.4, 3.9, C.text2, { r: 0.12 })
  chip(s, 0.7, 1.3, 2.3, 0.36, '実装済み・デモ環境で稼働', { fill: C.accent2, color: C.text1, size: 11.5 })
  T(s, [
    { text: 'ケアビリング（介護）', options: { bold: true, fontSize: 20, color: C.background1, fontFace: F.head, breakLine: true, paraSpaceAfter: 2 } },
    { text: 'AI 社員と働く形で作った、請求・訪問記録・\nシフト・帳票・ケアプランの業務システム', options: { fontSize: 12.5, color: C.background2 } },
  ], { x: 0.7, y: 1.72, w: 4.0, h: 1.05 })
  T(s, 'AI 社員が担当していること', { x: 0.7, y: 2.8, w: 4.0, h: 0.3, fontSize: 13, bold: true, color: C.accent2, margin: 0.04 })
  bulletList(s, 0.7, 3.12, 4.0, 1.85, [
    '記録の承認待ち・未打刻の知らせ',
    '一人ひとりに、自分に関係する知らせだけ',
    '朝夕の定時のご報告',
    '計画書や請求の下書きの提案',
    '使い方の案内・一人ひとりの好みを覚える',
  ], { size: 13, color: C.background1 })
  // sample
  box(s, 5.1, 1.12, 4.4, 1.3, C.background2, { r: 0.12 })
  chip(s, 5.3, 1.28, 0.75, 0.32, '見本', { fill: C.accent6, size: 11.5 })
  T(s, '設備点検', { x: 6.15, y: 1.25, w: 3.2, h: 0.38, fontSize: 17, bold: true, color: C.text2, fontFace: F.head, valign: 'middle', margin: 0 })
  T(s, '同じ仕組みで作った見本。\n点検期限の超過・修理依頼の承認・日々の報告', { x: 5.3, y: 1.7, w: 4.05, h: 0.65, fontSize: 13, color: C.text1, margin: 0 })
  // ideas
  T(s, '業種を問わず、どのシステムにも（構想例）', { x: 5.1, y: 2.58, w: 4.4, h: 0.32, fontSize: 13, bold: true, color: C.accent1, margin: 0 })
  const ideas = [
    ['建設・設備保守', '点検・是正の期限を担当者へ'],
    ['製造', '設備停止・品質異常を至急で'],
    ['不動産管理', '修繕依頼の承認・入退去の手続き'],
    ['物流', '配送の遅れ・車両点検の期限'],
    ['クリニック', '書類の期限・請求の承認'],
  ]
  ideas.forEach(([ind, ex], i) => {
    const y = 2.95 + i * 0.42
    chip(s, 5.1, y, 1.55, 0.34, ind, { fill: C.background2, color: C.text2, size: 12 })
    T(s, ex, { x: 6.75, y, w: 2.75, h: 0.34, fontSize: 13, color: C.text1, valign: 'middle', margin: 0 })
  })
  s.addNotes([
    'この仕組みは構想ではありません。介護事業所向けの業務システム「ケアビリング」は、AI 社員と働く形で作ったシステムで、すでに実装済みで、デモ環境で動いています。記録の承認待ちや未打刻の知らせ、一人ひとりに自分に関係する知らせだけを届けること、朝夕の定時のご報告、計画書や請求の下書きの提案、そしてシステムの使い方の案内と一人ひとりの好みを覚えることを AI 社員が担当しています。AI 社員の名前と人柄も、管理者が画面で決められます。',
    'そこから業種に依存しない部分を取り出したのが「Bizアシスタント」です。設備点検の見本システムは、この共通の仕組みの上に作ったもので、点検期限の超過や修理依頼の承認、毎日の点検報告が同じ形で動きます。',
    '右下は、ほかの業種での活用アイデアです。まだ構想の例ですが、「期限」「異常」「承認」「日報」がある業務システムなら、業種を問わず同じ形でつなげます。',
  ].join('\n'))
}

// 17. Adoption
{
  const s = content('実績と導入', '導入は 5 つのステップで、1 つの業務から')
  const steps = [
    ['1', '業務とシステム\nの棚卸し', '業務と、誰に何を\n知らせたいかを\n一緒に整理', '2〜4 週間'],
    ['2', 'つなぎ方の\n設計', '知らせ・お願い・\n承認の流れと\n足す部分を設計', '1 か月前後'],
    ['3', 'AI を使った\n開発', '1 つの業務の\nつなぐ部分を\n作って確かめる', '2〜3 か月'],
    ['4', '試験運用', '今の画面と\n並行し、数名で\n使って調整', '1 か月前後'],
    ['5', '全社展開', '業務・拠点\nごとに順に\n広げる', '順次'],
  ]
  steps.forEach(([n, head, body, dur], i) => {
    const x = 0.5 + i * 1.83
    box(s, x, 1.1, 1.68, 2.9, C.background2, { r: 0.12 })
    kanji(s, x + 0.56, 1.22, 0.56, n, { fill: i === 4 ? C.accent4 : C.accent1, size: 20 })
    T(s, head, { x: x + 0.08, y: 1.85, w: 1.52, h: 0.62, fontSize: 14, bold: true, color: C.text2, align: 'center', valign: 'middle', fontFace: F.head, margin: 0 })
    T(s, body, { x: x + 0.12, y: 2.55, w: 1.44, h: 0.9, fontSize: 12.5, color: C.text1, margin: 0 })
    chip(s, x + 0.1, 3.5, 1.48, 0.36, `目安：${dur}`, { fill: C.background1, color: C.text2, size: 11.5, line: C.accent5 })
    if (i < 4) arrow(s, x + 1.69, 2.16, x + 1.82, 2.16, { color: C.accent2, width: 2.5 })
  })
  box(s, 0.5, 4.2, 9.0, 0.8, C.background1, { r: 0.12, line: C.accent1, lw: 1.25 })
  T(s, [
    { text: '小さく始めて、効果を確かめながら広げられます。', options: { bold: true, color: C.text2, fontSize: 15, breakLine: true } },
    { text: '期間は 1 つの業務から始める場合の目安で、業務の範囲と今のシステムの状態によって変わります', options: { fontSize: 12, color: C.accent5 } },
  ], { x: 0.7, y: 4.2, w: 8.6, h: 0.8, valign: 'middle' })
  s.addNotes([
    '導入は 5 つのステップで進めます。',
    'まず業務とシステムの棚卸しです。今の業務と、誰に何を知らせたいか、どんな承認があるかを一緒に整理し、今のシステムに何を足すかを診断します。',
    '次に、つなぎ方の設計です。知らせ・お願い・承認の流れと、業務システムに足す部分を設計します。',
    '3 つ目が、AI を使った開発です。1 つの業務について、つなぐ部分を作り、決まった検査項目で確かめます。',
    'そして今の画面と並行して、数名の職員で試験運用し、文面や届く時刻を調整したうえで、業務や拠点ごとに広げていきます。',
    'ここに書いた期間はあくまで目安で、業務の範囲や今のシステムの状態によって変わります。最初は 1 つの業務に絞って小さく始め、効果を見ながら広げていくことをお勧めしています。',
  ].join('\n'))
}

// 18. Call to action
{
  const s = pres.addSlide({ masterName: 'SECTION_DARK', sectionTitle: '実績と導入' })
  s.addText('いまの業務システムを、AI 社員と働く形に', { placeholder: 'title', fontFace: F.head, lang: 'ja-JP' })
  const offers = [
    ['談', 'ご相談', [
      { text: 'お困りごとを伺い、今の\nシステムを診断します', options: { breakLine: true } },
      { text: '足すものと期間の\n見積もり', options: { bold: true, color: C.accent1 } },
    ]],
    ['見', 'デモ', '実際のチャット画面で\nAI 社員の動きを\nご覧いただけます'],
    ['算', '試算', '御社の人数と業務で\n効果を一緒に\n見積もります'],
  ]
  offers.forEach(([k, head, body], i) => {
    const x = 0.6 + i * 2.95
    box(s, x, 1.4, 2.75, 2.25, C.background1, { r: 0.12 })
    kanji(s, x + 0.2, 1.6, 0.6, k, { fill: C.accent2, color: C.text1, size: 20 })
    T(s, head, { x: x + 0.95, y: 1.6, w: 1.7, h: 0.6, fontSize: 19, bold: true, color: C.text2, valign: 'middle', fontFace: F.head, margin: 0 })
    T(s, body, { x: x + 0.2, y: 2.35, w: 2.35, h: 1.2, fontSize: 14, color: C.text1, margin: 0 })
  })
  box(s, 0.6, 3.95, 8.8, 0.95, C.text1, { r: 0.12, line: C.accent2, lw: 1.25 })
  T(s, [
    { text: 'お問い合わせ', options: { bold: true, fontSize: 14, color: C.accent2, breakLine: true, paraSpaceAfter: 3 } },
    { text: CONTACT, options: { fontSize: 15, color: C.background1 } },
  ], { x: 0.85, y: 3.95, w: 8.3, h: 0.95, valign: 'middle' })
  s.addNotes([
    '最後に、次の一歩のご提案です。',
    'まずはご相談として、今の業務とお困りごとを伺います。あわせて、今お使いのシステムを診断し、AI 社員とつなぐために何を足すか、どのくらいの期間がかかるかを、先ほどの 7 つの項目に沿ってお伝えします。',
    'そのうえで、実際のチャット画面で AI 社員の動きをデモでご覧いただけます。さらに、御社の人数と業務をもとに、どのくらいの時間が減らせそうかを一緒に試算します。',
    '「うちの業務システムを AI 社員と働く形にすると、どうなるか」を一緒に描くところから始めましょう。ご清聴ありがとうございました。',
  ].join('\n'))
}

// 19. Appendix for the IT team
pres.addSection({ title: '付録' })
{
  const s = content('付録', '付録：IT ご担当者さまへ')
  box(s, 0.5, 1.05, 3.9, 3.1, C.background2, { r: 0.12 })
  T(s, 'framework が用意するもの', { x: 0.65, y: 1.15, w: 3.6, h: 0.4, fontSize: 15, bold: true, color: C.text2, fontFace: F.head, margin: 0, valign: 'middle' })
  T(s, [
    'DSH（AI 社員の実行環境）と IM の接続',
    'dsh-core と 8 つのプラグイン',
    '委託・承認カード・まとめ送信・定時報告',
    '宛先の守りと閉じた設定',
    '長期記憶・AI 社員のプロフィール・マニュアル検索',
    '自動タスク（分類ごと・本人ごとの委託）',
    '適合性テスト 52 項目・e2e',
  ].map((t, j, a) => ({ text: t, options: { bullet: { indent: 10 }, breakLine: j < a.length - 1, paraSpaceAfter: 7 } })), { x: 0.62, y: 1.65, w: 3.68, h: 2.45, fontSize: 12, color: C.text1 })
  box(s, 4.55, 1.05, 4.95, 3.1, C.text2, { r: 0.12 })
  T(s, '業務システムに足すもの（チェックリスト）', { x: 4.7, y: 1.15, w: 4.65, h: 0.4, fontSize: 15, bold: true, color: C.accent2, fontFace: F.head, margin: 0, valign: 'middle' })
  T(s, [
    'Bridge v1 の API（読取・提案・身元・委託）',
    'manifest（役割・event・文面・ツール）',
    '既存のログインでの SNS 連携（本人・本人のボット）',
    '通知の受信者を業務システムが決める規則',
    'event を outbox で記録（payload は許可リストだけ）',
    '職員と役割、承認の規則が 1 か所に',
    'Web セッションと職員の有効・無効を即時に確認',
  ].map((t, j, a) => ({ text: t, options: { bullet: { type: 'number' }, breakLine: j < a.length - 1, paraSpaceAfter: 8 } })), { x: 4.68, y: 1.65, w: 4.7, h: 2.5, fontSize: 11.5, color: C.background1 })
  T(s, [
    { text: '技術基盤：Biz Assistant Framework（@dsh-bridge/*。ARCHITECTURE.md・技術者向けスライド）', options: { breakLine: true } },
    { text: '詳細：GUIDELINE.md「既存の業務システムをつなぐ：チェックリスト」・ARCHITECTURE.md §7「受信者の保証」', options: {} },
  ], { x: 0.5, y: 4.3, w: 9.0, h: 0.75, fontSize: 12, color: C.accent5, margin: 0 })
  s.addNotes([
    'IT ご担当の方向けの補足です。Bizアシスタントの技術基盤は「Biz Assistant Framework」というフレームワークで、パッケージ名は @dsh-bridge です。',
    '左は、framework の側が用意しているものです。AI 社員の実行環境である DSH と IM の接続、dsh-core と 8 つのプラグイン、委託・承認カード・まとめ送信・定時報告、宛先の守りとその設定、長期記憶と AI 社員のプロフィール、マニュアルで使い方に答える部品、仕事の種類ごとや本人ごとの委託で動く自動タスク、そして 52 項目の適合性テストと e2e です。',
    '右は、業務システムの側に足すもののチェックリストです。Bridge v1 という小さな HTTP API、システムの説明書にあたる manifest、既存のログインのままでの SNS 連携、通知の受信者を業務システムが決める規則、同じトランザクションの event、職員と役割と承認の規則、Web のセッションと職員の有効・無効の確認です。業務システムが唯一の正本で、AI は職員本人の委託で読むことと提案することだけができます。',
    'どれだけ足すかはシステムによって違うので、最初に診断して見積もります。詳しくは GUIDELINE のチェックリストの節と、ARCHITECTURE、技術者向けスライドをご覧ください。',
  ].join('\n'))
}

// ── write, then put the theme colours into ppt/theme/theme1.xml ───────────
const SLOTS = ['dk1', 'lt1', 'dk2', 'lt2', 'accent1', 'accent2', 'accent3', 'accent4', 'accent5', 'accent6', 'hlink', 'folHlink']
async function applyTheme(file, theme) {
  const JSZip = require(require.resolve('jszip', { paths: [require.resolve('pptxgenjs')] }))
  const zip = await JSZip.loadAsync(fs.readFileSync(file))
  const part = 'ppt/theme/theme1.xml'
  const xml = await zip.file(part).async('string')
  const scheme = `<a:clrScheme name="${theme.name}">` + SLOTS.map((k) => `<a:${k}><a:srgbClr val="${theme.colors[k]}"/></a:${k}>`).join('') + '</a:clrScheme>'
  const out = xml
    .replace(/<a:clrScheme\b[\s\S]*?<\/a:clrScheme>/, () => scheme)
    .replace(/(<a:(?:theme|fontScheme)\b[^>]*?\bname=")[^"]*"/g, (_, head) => `${head}${theme.name}"`)
  if (!out.includes(scheme)) throw new Error(`${part}: no <a:clrScheme> to replace`)
  zip.file(part, out)
  for (const name of Object.keys(zip.files)) {
    if (!name.endsWith('.xml')) continue
    const bad = (await zip.file(name).async('string')).match(/<a:srgbClr val="((?![0-9A-Fa-f]{6}")[^"]*)"/)
    if (bad) throw new Error(`${name}: <a:srgbClr val="${bad[1]}"> is not a hex colour (a scheme colour passed to a hex-only option)`)
  }
  fs.writeFileSync(file, await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }))
}

;(async () => {
  fs.mkdirSync(path.dirname(OUT), { recursive: true })
  await pres.writeFile({ fileName: OUT })
  await applyTheme(OUT, THEME)
  console.log(`wrote ${OUT}`)
})().catch((e) => { console.error(e); process.exit(1) })
