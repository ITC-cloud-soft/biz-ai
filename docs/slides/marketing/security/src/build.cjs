// Builds docs/slides/marketing/security/biz-assistant-security-for-executives.pptx
// (Bizアシスタント — 自己進化するセキュリティ監視 AI の経営者・事業責任者向けご紹介, Japanese).
//
//   node build.cjs [out.pptx]        default: ../biz-assistant-security-for-executives.pptx
//
// Needs pptxgenjs (4.x) resolvable from here or through NODE_PATH. See ../../src/README.md.
// Same visual family as docs/slides/marketing/biz-assistant-for-executives.pptx (theme "DSH Bridge Ink",
// Yu Gothic UI / Meiryo UI, kanji-in-a-circle motif, chat phone). Plain-language counterpart of the
// technical deck docs/slides/security/biz-assistant-security-rsi.pptx.
// SELLING POINT = RSI (self-evolution): the security attacks ITSELF (safe, authorized simulated attacks) to
// find its own gaps, fix them, and repeat — so its coverage keeps rising. "守り" alone is table stakes.
// All names/numbers/messages are fictional examples. Own assets only; a human approves every production change.
const path = require('path')
const fs = require('fs')
const pptxgen = require('pptxgenjs')

const OUT = path.resolve(process.argv[2] || path.join(__dirname, '..', 'biz-assistant-security-for-executives.pptx'))

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
pres.title = 'Bizアシスタント — 自分で攻めて、自分で強くなるセキュリティ。'
pres.subject = '自己進化するセキュリティ監視 AI ・ 経営者・事業責任者向けご紹介'
pres.author = 'Bizアシスタント'
pres.theme = { headFontFace: F.head, bodyFontFace: F.body }
const C = pres.SchemeColor
const S = pres.shapes

// ── layouts ───────────────────────────────────────────────────────────────
pres.defineSlideMaster({
  title: 'TITLE_DARK',
  background: { color: C.text2 },
  objects: [
    { placeholder: { options: { name: 'title', type: 'title', x: 0.6, y: 1.35, w: 5.4, h: 2.1, fontFace: F.head, fontSize: 34, bold: true, color: C.background1, valign: 'bottom', align: 'left', margin: 0 }, text: '' } },
    { placeholder: { options: { name: 'body', type: 'body', x: 0.6, y: 3.65, w: 5.4, h: 1.3, fontFace: F.body, fontSize: 15, color: C.background2, valign: 'top', align: 'left', margin: 0 }, text: '' } },
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

// ── helpers ─────────────────────────────────────────────────────────────
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
function bar(slide, y, h, runs, size = 13) {
  box(slide, 0.5, y, 9.0, h, C.text2, { r: 0.1 })
  T(slide, runs, { x: 0.7, y, w: 8.6, h, fontSize: size, valign: 'middle', margin: 0 })
}
const lead = (t) => ({ text: t, options: { bold: true, color: C.accent2, fontFace: F.head } })
const plain = (t, o = {}) => ({ text: t, options: { color: C.background1, ...o } })

const LABEL = {
  info: { text: '【ご報告】', fill: C.accent1, color: C.background1 },
  action: { text: '【対応のお願い】', fill: C.accent2, color: C.text1 },
  urgent: { text: '【至急】', fill: C.accent3, color: C.background1 },
  approval: { text: '【承認のお願い】', fill: C.accent6, color: C.background1 },
}
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
function phone(slide, x, y, w, h, { name = 'セキュリティ監視 AI', sub = '運用チャネル', onDark = false } = {}) {
  box(slide, x, y, w, h, C.text1, { r: 0.28, line: onDark ? C.accent1 : C.text1, lw: onDark ? 1.5 : 0.75, shadow: !onDark, name: 'phone' })
  const ix = x + 0.1, iy = y + 0.14, iw = w - 0.2, ih = h - 0.28
  box(slide, ix, iy, iw, ih, C.background2, { r: 0.2, name: 'screen' })
  box(slide, ix, iy, iw, 0.5, C.background1, { r: 0.2, name: 'header' })
  box(slide, ix, iy + 0.3, iw, 0.2, C.background1, { shape: S.RECTANGLE, name: 'header-fill' })
  kanji(slide, ix + 0.12, iy + 0.08, 0.34, '守', { fill: C.accent3, size: 12 })
  T(slide, [
    { text: name, options: { bold: true, fontSize: 11, color: C.text2, breakLine: true } },
    { text: sub, options: { fontSize: 9, color: C.accent5 } },
  ], { x: ix + 0.52, y: iy + 0.05, w: iw - 0.6, h: 0.42, margin: 0, valign: 'middle' })
  return { x: ix + 0.12, y: iy + 0.62, w: iw - 0.24, bottom: iy + ih - 0.1 }
}
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
  T(slide, text, { x, y, w, h, fontSize: 11.5, color, bold: true, align: 'center', valign: 'middle', margin: 0 })
}

const CONTACT = (() => {
  try { return JSON.parse(fs.readFileSync(path.join(__dirname, 'contact.local.json'), 'utf8')).contact || null } catch { return null }
})() ?? '［会社名］　［ご担当者名］　［メールアドレス・電話番号］'

// ════════════════════════════════════════════════════════════════════════
// 1. Title — lead with RSI / self-evolution
pres.addSection({ title: 'はじめに' })
{
  const s = pres.addSlide({ masterName: 'TITLE_DARK', sectionTitle: 'はじめに' })
  chip(s, 0.6, 0.78, 2.6, 0.38, '経営者・事業責任者の方へ', { fill: C.accent2, color: C.text1, size: 12 })
  s.addText([
    { text: '自分で攻めて、', options: { breakLine: true } },
    { text: '自分で強くなる', options: { breakLine: true, color: C.accent2 } },
    { text: 'セキュリティ。' },
  ], { placeholder: 'title', fontFace: F.head, fontSize: 36, lang: 'ja-JP' })
  s.addText([
    { text: '「守ります」で終わらない。使うほど強くなる。', options: { breakLine: true, paraSpaceAfter: 8 } },
    { text: '自己進化するセキュリティ監視 AI（RSI）', options: { fontSize: 13, color: C.accent2 } },
  ], { placeholder: 'body', fontFace: F.body, lang: 'ja-JP' })

  const p = phone(s, 6.35, 0.7, 3.15, 4.2, { onDark: true })
  let y = bubble(s, p.x, p.y, p.w, null, [
    { label: 'info', t: '今週の守りの成績' },
    '自分で 28 通りの仮攻撃（模擬攻撃）を試しました。',
    { t: '気づけた割合：91%（先週 82%）', b: true, c: C.text2 },
  ], { size: 11.5 })
  y = bubble(s, p.x, y + 0.14, p.w, null, [
    '見つかった穴 3 件は、新しい見張りを追加しました。次はもっと早く気づけます。',
  ], { size: 11.5 })
  bubble(s, p.x + 1.3, y + 0.14, p.w - 1.3, 0.4, ['いいね'], { me: true, size: 11.5 })
  s.addNotes([
    '本日は、Bizアシスタントの「自己進化するセキュリティ監視 AI」をご紹介します。',
    'セキュリティ製品はどれも「守ります」と言います。ちがいはここからです。この AI は、守るだけでなく、自分で自分のシステムに安全な仮攻撃を行って、本当に守れているかを確かめ、見つかった穴をふさぎ、それをくり返して、使うほど強くなります。これを自己進化、RSI と呼びます。',
    '右の画面は、その AI から届く「今週の守りの成績」のイメージです（内容は架空の例です）。自分で 28 通りの攻撃を試し、気づけた割合が先週の 82% から 91% に上がった、見つかった穴は新しい見張りでふさいだ、という報告です。守れているかを、祈るのではなく、数字で確かめられます。',
  ].join('\n'))
}

// 2. Pain — every product says "守ります"
{
  const s = content('はじめに', 'どの製品も「守ります」。でも、効いているか分からない')
  const cards = [
    ['静', '買った時のまま', '設定した日から変わらない。新しい攻撃や手口には追いつけない'],
    ['？', '効いているか不明', '本当に防げるのかは、実際に攻撃されて初めて分かる'],
    ['人', '見直す人がいない', '試す人も、見直す人もいない。入れたら入れっぱなし'],
    ['隙', '守れているつもり', '事故が起きて「実は穴が空いていた」——よくある話'],
  ]
  cards.forEach(([k, h, b], i) => {
    const x = 0.5 + (i % 2) * 4.55, y = 1.05 + Math.floor(i / 2) * 1.6
    box(s, x, y, 4.45, 1.46, C.background2, { r: 0.12, line: C.accent5 })
    kanji(s, x + 0.2, y + 0.2, 0.62, k, { fill: C.accent3, size: 22 })
    T(s, h, { x: x + 1.0, y: y + 0.2, w: 3.3, h: 0.5, fontSize: 17, bold: true, color: C.text2, valign: 'middle', fontFace: F.head, margin: 0 })
    T(s, b, { x: x + 0.25, y: y + 0.76, w: 4.0, h: 0.62, fontSize: 12.5, color: C.text1, margin: 0 })
  })
  bar(s, 4.32, 0.73, [lead('いちばんの問題：'), plain('ほとんどのセキュリティは「一度入れて、あとは祈る」。効いているかを、誰も確かめていません。')])
  s.addNotes([
    'まず、よくある状況です。セキュリティ製品はどれも「守ります」と言いますが、四つの弱点があります。一つ目、買った時のまま。設定した日から変わらず、新しい攻撃に追いつけません。二つ目、効いているか不明。本当に防げるのかは、実際に攻撃されて初めて分かります。三つ目、見直す人がいない。試す人も見直す人もいません。四つ目、守れているつもり。事故が起きて、実は穴が空いていた、はよくある話です。',
    'いちばんの問題は、ほとんどのセキュリティが「一度入れて、あとは祈る」ものだということ。効いているかを、誰も確かめていません。',
  ].join('\n'))
}

// 3. The shift — from fixed to self-evolving
{
  const s = content('はじめに', '発想の転換：守りを「固定」から「育てる」へ')
  // left: ordinary
  box(s, 0.5, 1.05, 4.35, 3.05, C.background2, { r: 0.12, line: C.accent5 })
  chip(s, 0.7, 1.25, 3.95, 0.45, 'ふつうのセキュリティ製品', { fill: C.accent5, size: 13 })
  const L = ['一度導入して、そのまま', '「たぶん大丈夫」で守る', '効いているかは分からない', '人が、時々、見直す（なら良い方）']
  T(s, L.map((t, i) => ({ text: t, options: { bullet: { indent: 12 }, breakLine: i < L.length - 1, paraSpaceAfter: 11 } })), { x: 0.75, y: 1.9, w: 3.9, h: 2.1, fontSize: 13.5, color: C.text1 })
  // right: Biz
  box(s, 5.15, 1.05, 4.35, 3.05, C.background2, { r: 0.12, line: C.accent1, lw: 1.5 })
  chip(s, 5.35, 1.25, 3.95, 0.45, 'Bizアシスタント（自己進化・RSI）', { fill: C.accent1, size: 13 })
  const R = [
    { t: '自分で仮攻撃して、確かめる', b: true },
    { t: '実測で守る（試して分かった事実で）', b: true },
    { t: '効果が数字で見える', b: true },
    { t: 'AI が毎週、守りを育てる', b: true },
  ]
  T(s, R.map((it, i) => ({ text: it.t, options: { bullet: { indent: 12 }, bold: true, color: C.text2, breakLine: i < R.length - 1, paraSpaceAfter: 11 } })), { x: 5.4, y: 1.9, w: 3.9, h: 2.1, fontSize: 13.5 })
  arrow(s, 4.88, 2.55, 5.12, 2.55, { color: C.accent2, width: 2.5 })
  bar(s, 4.32, 0.73, [lead('鍵は：'), plain('自分で自分を攻めて、守れているかを確かめ、穴をふさいで、くり返すこと。これが自己進化（RSI）です。')])
  s.addNotes([
    '私たちの発想の転換は、守りを「固定」から「育てる」へ、です。',
    '左が、ふつうのセキュリティ製品。一度導入してそのまま、「たぶん大丈夫」で守り、効いているかは分からず、人が時々見直せれば良い方です。右が Bizアシスタント。自分で攻めて確かめ、試して分かった事実で守り、効果が数字で見え、AI が毎週守りを育てます。',
    '鍵は、自分で自分を攻めて、守れているかを確かめ、穴をふさいで、くり返すこと。これが自己進化、RSI です。次のページで、その中身をご説明します。',
  ].join('\n'))
}

// ════════════════════════════════════════════════════════════════════════
// 4. RSI — the hero loop
pres.addSection({ title: '自己進化（RSI）' })
{
  const s = content('自己進化（RSI）', 'これが自己進化：仮攻撃で試し、気づいて、ふさいで、くり返す')
  const steps = [
    ['攻', '自分で仮攻撃', C.accent3],
    ['気', '気づけたか見る', C.accent6],
    ['埋', '穴をふさぐ', C.accent1],
    ['対', '承認して対処', C.accent2],
    ['強', '強くなる', C.accent4],
  ]
  steps.forEach(([k, t, fill], i) => {
    const cx = 0.62 + i * 1.84
    kanji(s, cx, 1.35, 0.95, k, { fill, color: fill === C.accent2 ? C.text1 : C.background1, size: 30 })
    T(s, t, { x: cx - 0.45, y: 2.42, w: 1.85, h: 0.6, fontSize: 13, bold: true, color: C.text2, align: 'center', fontFace: F.head, margin: 0 })
    if (i < steps.length - 1) arrow(s, cx + 1.0, 1.82, cx + 1.6, 1.82, { color: C.accent2, width: 2.25 })
  })
  box(s, 2.1, 3.15, 5.8, 0.5, C.background2, { r: 0.1, line: C.accent2 })
  T(s, [{ text: '↻ 毎週くり返すほど、守りが厚くなる', options: { bold: true, color: C.accent1, fontFace: F.head } }], { x: 2.1, y: 3.15, w: 5.8, h: 0.5, fontSize: 13, align: 'center', valign: 'middle', margin: 0 })
  bar(s, 3.9, 1.1, [
    lead('ここがちがい：'),
    plain('攻撃されてから直すのではなく、攻撃される前に、自分で見つけて直す。', { breakLine: true }),
    plain('だから、守りは「買った時のまま」ではなく、毎週強くなっていきます。他社製品にない、Bizアシスタントの核です。', {}),
  ])
  s.addNotes([
    'これが自己進化、RSI の中身です。五つのステップをくり返します。一つ目、自分で仮攻撃。安全な範囲で、自分のシステムに模擬攻撃を行います。二つ目、気づけたか見る。守りがちゃんと反応したかを確かめます。三つ目、穴をふさぐ。気づけなかった所に、新しい見張りや手だてを足します。四つ目、承認して対処。本番に関わることは、担当者が承認してから。五つ目、強くなる。これを毎週くり返すほど、守りが厚くなります。',
    'ここが他社製品とのいちばんのちがいです。攻撃されてから直すのではなく、攻撃される前に、自分で見つけて直す。だから守りは買った時のままではなく、毎週強くなっていきます。',
  ].join('\n'))
}

// 5. The engine: simulated attacks on ourselves
{
  const s = content('自己進化（RSI）', '自己進化のエンジン：自分に、安全に仮攻撃する')
  T(s, '守りが本物かを確かめる唯一の方法は、安全に仮攻撃してみること。防災訓練と同じ考え方です。', { x: 0.5, y: 0.98, w: 9.0, h: 0.38, fontSize: 13.5, color: C.text2, bold: true, margin: 0 })
  // what it does
  box(s, 0.5, 1.5, 4.5, 2.3, C.background2, { r: 0.12, line: C.accent3 })
  kanji(s, 0.72, 1.7, 0.6, '攻', { fill: C.accent3, size: 21 })
  T(s, 'やること', { x: 1.45, y: 1.7, w: 3.4, h: 0.6, fontSize: 16, bold: true, color: C.text2, valign: 'middle', fontFace: F.head, margin: 0 })
  const did = ['既製の安全な「模擬攻撃の型」で、自分のシステムを試す', '気づけなければ「穴」。どこが弱いかが分かる', '過去に直した模擬攻撃も、また通らないか毎回ためす', '結果は「気づけた割合」として数字に残る']
  T(s, did.map((t, i) => ({ text: t, options: { bullet: { indent: 12 }, breakLine: i < did.length - 1, paraSpaceAfter: 8 } })), { x: 0.75, y: 2.35, w: 4.05, h: 1.4, fontSize: 12.5, color: C.text1 })
  // safety
  box(s, 5.25, 1.5, 4.25, 2.3, C.background2, { r: 0.12, line: C.accent6 })
  kanji(s, 5.47, 1.7, 0.6, '安', { fill: C.accent6, size: 21 })
  T(s, 'だから安心', { x: 6.2, y: 1.7, w: 3.1, h: 0.6, fontSize: 16, bold: true, color: C.text2, valign: 'middle', fontFace: F.head, margin: 0 })
  const safe = ['試すのは自社のシステムだけ。外には一切しない', 'ふだんの本番ではなく、確認用の環境で', '担当者が承認してから始める', 'ひとこと言えばすぐ止まる。壊すことはしない']
  T(s, safe.map((t, i) => ({ text: t, options: { bullet: { indent: 12 }, breakLine: i < safe.length - 1, paraSpaceAfter: 8 } })), { x: 5.5, y: 2.35, w: 3.8, h: 1.4, fontSize: 12.5, color: C.text1 })
  bar(s, 3.95, 1.05, [
    lead('ここがちがい：'),
    plain('他社が「たぶん大丈夫」と言うところを、Bizアシスタントは「自分で試して、確かめる」。', { breakLine: true }),
    plain('この仮攻撃（模擬攻撃）こそが、守りを毎週鍛えるエンジンです。', {}),
  ])
  s.addNotes([
    '自己進化のエンジンが、自分で自分に攻撃を仕掛けることです。守りが本物かを確かめる唯一の方法は、実際に攻めてみること。防災訓練と同じ考え方です。',
    '左がやること。既製の安全な攻撃の型で自分のシステムを試し、気づけなければそこが穴だと分かります。過去に直した攻撃も毎回ためし、結果は気づけた割合として数字に残ります。右が安心のための決まり。試すのは自社のシステムだけで、外には一切しません。ふだんの本番ではなく確認用の環境で、担当者が承認してから始め、ひとこと言えばすぐ止まり、壊すことはしません。',
    '他社が「たぶん大丈夫」と言うところを、私たちは自分で試して確かめます。この仮攻撃こそが、守りを毎週鍛えるエンジンです。',
  ].join('\n'))
}

// 6. Proof in numbers
{
  const s = content('自己進化（RSI）', '「守れているつもり」が、「守れている証拠」に')
  // coverage highlight
  box(s, 0.5, 1.05, 4.3, 2.35, C.text2, { r: 0.12 })
  T(s, '検知カバレッジ（試した仮攻撃のうち、気づけた割合）', { x: 0.72, y: 1.2, w: 3.9, h: 0.5, fontSize: 12, color: C.background2, margin: 0 })
  T(s, [
    { text: '82', options: { fontSize: 40, bold: true, color: C.accent5, fontFace: F.head } },
    { text: '%', options: { fontSize: 22, bold: true, color: C.accent5 } },
    { text: '　→　', options: { fontSize: 24, color: C.background2 } },
    { text: '91', options: { fontSize: 54, bold: true, color: C.accent2, fontFace: F.head } },
    { text: '%', options: { fontSize: 28, bold: true, color: C.accent2 } },
  ], { x: 0.72, y: 1.75, w: 3.9, h: 1.1, valign: 'middle', margin: 0, align: 'center' })
  T(s, '先週 → 今週（毎週、上がっていく）', { x: 0.72, y: 2.9, w: 3.9, h: 0.4, fontSize: 11.5, color: C.accent2, align: 'center', margin: 0 })
  // metrics
  const m = [
    ['気づく速さ', '攻撃のきざしを数分で'],
    ['見つけた穴', 'その週のうちにふさぐ'],
    ['本番への影響', '0（確認用の環境で試す）'],
    ['成績表', '毎週チャットに届く'],
  ]
  m.forEach(([k, v], i) => {
    const y = 1.05 + i * 0.6
    box(s, 5.0, y, 4.5, 0.54, i % 2 ? C.background1 : C.background2, { r: 0.08, line: C.background2 })
    T(s, k, { x: 5.14, y, w: 1.75, h: 0.54, fontSize: 12.5, bold: true, color: C.accent1, valign: 'middle', fontFace: F.head, margin: 0 })
    T(s, v, { x: 6.9, y, w: 2.5, h: 0.54, fontSize: 12, color: C.text1, valign: 'middle', margin: 0 })
  })
  bar(s, 3.6, 1.0, [lead('経営にとっての価値：'), plain('効いているかを、祈るのではなく数字で確かめられる。取引先や監査にも「これだけ守れている」と示せます。数字（例）は架空のイメージです。')])
  s.addNotes([
    '自己進化のいちばんの価値は、効果が数字で分かることです。',
    '左の「検知カバレッジ」は、試した攻撃のうちちゃんと気づけた割合です。これが毎週上がっていきます。図では先週 82% から今週 91% に上がった例を示しています（数字は架空のイメージです）。右のように、気づく速さ、見つけた穴をその週のうちにふさぐこと、本番への影響がゼロであること、成績表が毎週チャットに届くことも示します。',
    '経営にとっての価値は、効いているかを祈るのではなく数字で確かめられることです。取引先や監査にも、これだけ守れていると示せます。',
  ].join('\n'))
}

// ════════════════════════════════════════════════════════════════════════
// 7. Foundation: watch from outside (supporting)
pres.addSection({ title: '守りの土台' })
{
  const s = content('守りの土台', '土台は、外から 24 時間見張ること')
  const cards = [
    ['録', '出入りの記録', '誰が、どこから、何をしようとしたか。不審なアクセスを見つける'],
    ['速', '速さ・重さ', '遅く・重くなっていないか。証明書の期限も見張る'],
    ['形', '形・設定', '開いてはいけない入口や、勝手な設定変更がないか'],
    ['弱', '弱点', '部品や OS の新しい弱点を、毎晩たしかめる'],
  ]
  cards.forEach(([k, h, b], i) => {
    const x = 0.5 + (i % 2) * 4.55, y = 1.0 + Math.floor(i / 2) * 1.42
    box(s, x, y, 4.45, 1.3, C.background2, { r: 0.12, line: C.accent1 })
    kanji(s, x + 0.18, y + 0.2, 0.58, k, { fill: C.accent1, size: 20 })
    T(s, h, { x: x + 0.92, y: y + 0.18, w: 3.4, h: 0.44, fontSize: 15.5, bold: true, color: C.text2, valign: 'middle', fontFace: F.head, margin: 0 })
    T(s, b, { x: x + 0.25, y: y + 0.66, w: 4.0, h: 0.56, fontSize: 11.5, color: C.text1, margin: 0 })
  })
  bar(s, 3.9, 1.1, [
    lead('なぜ外から？　'),
    plain('もし中が乗っ取られても、見張りの目と記録は別の場所にあるので壊されない。', { breakLine: true }),
    plain('この土台の上で、さきほどの自己進化（自分で仮攻撃して鍛える）が回ります。', {}),
  ])
  s.addNotes([
    '自己進化を支える土台が、外から 24 時間見張ることです。見るのは四つ。出入りの記録、速さと重さ、形と設定、弱点です。システムの外側から見張るので、もし中が乗っ取られても、見張りの目と記録は別の場所にあって壊されません。',
    'この土台の上で、さきほどの自己進化、つまり自分で攻めて鍛える仕組みが回ります。',
  ].join('\n'))
}

// 8. Find a sign → approve in chat
{
  const s = content('守りの土台', 'きざしを見つけたら、チャットでワンタップ承認')
  const p = phone(s, 0.6, 0.98, 3.1, 4.05, {})
  let y = bubble(s, p.x, p.y, p.w, null, [
    { label: 'urgent', t: '02:13 不審なアクセス' },
    '6 か所から、ログインの失敗が 5 分で 400 回。',
  ], { size: 11 })
  y = bubble(s, p.x, y + 0.12, p.w, null, [
    { t: '■ 対処のご提案', b: true, c: C.text2 },
    { t: '怪しい接続を 24 時間止めます。' },
    { t: '影響：職員・利用者への影響はありません。', c: C.accent5, s: 10.5 },
    { t: '期限：24 時間で自動解除。元に戻せます。', c: C.accent5, s: 10.5 },
  ], { size: 11 })
  button(s, p.x, y + 0.12, (p.w - 0.1) / 2, 0.4, '承認')
  button(s, p.x + (p.w + 0.1) / 2, y + 0.12, (p.w - 0.1) / 2, 0.4, '詳細')
  const rows = [
    ['何が起きたか', '事件の番号・要約・証拠のかず（原文や個人情報は載せない）'],
    ['どう対処するか', '決めておいた安全な手だてから選ぶ（勝手な操作はしない）'],
    ['だれに効くか', 'ふだん使う職員・利用者に影響がないことを先に確かめる'],
    ['いつまで・戻し方', '期限つき。ワンタップで取り消せる'],
    ['放っておくと', '起こりうること（アカウントのロックや負荷）も添える'],
  ]
  T(s, 'カードに書いてあること', { x: 4.1, y: 0.98, w: 5.4, h: 0.4, fontSize: 15, bold: true, color: C.text2, fontFace: F.head, margin: 0 })
  rows.forEach(([k, v], i) => {
    const y2 = 1.45 + i * 0.6
    box(s, 4.1, y2, 5.4, 0.54, i % 2 ? C.background1 : C.background2, { r: 0.08, line: C.background2 })
    T(s, k, { x: 4.22, y: y2, w: 1.7, h: 0.54, fontSize: 11.5, bold: true, color: C.accent1, valign: 'middle', fontFace: F.head, margin: 0 })
    T(s, v, { x: 5.95, y: y2, w: 3.45, h: 0.54, fontSize: 11, color: C.text1, valign: 'middle', margin: 0 })
  })
  box(s, 4.1, 4.5, 5.4, 0.52, C.text2, { r: 0.1 })
  T(s, [{ text: '返事がないとき：', options: { bold: true, color: C.accent2 } }, { text: 'もう一度お知らせし、別の担当者にも連絡。勝手には実施しません。', options: { color: C.background1 } }], { x: 4.25, y: 4.5, w: 5.1, h: 0.52, fontSize: 11, valign: 'middle', margin: 0 })
  s.addNotes([
    'きざしを見つけたときのようすです。左のように、何が起きたか、どう対処するか、だれに影響するか、いつまでで戻せるかを、固定の形でチャットに届けます。担当者はワンタップで承認か、詳細を見るかを選びます。',
    'カードに個人情報やログの原文は載せません。対処は、あらかじめ決めておいた安全な手だての中から選び、勝手な操作はしません。返事がないときは、もう一度知らせ、別の担当者にも連絡しますが、勝手には実施しません。',
  ].join('\n'))
}

// 9. Nightly updates are part of self-evolution
{
  const s = content('守りの土台', '毎晩のアップデートも、自己進化の一部')
  const cards = [
    ['部品・OS', 'システムを作っている部品や OS の、新しい弱点がないか'],
    ['証明書', '暗号化の証明書の期限や、古い設定が残っていないか'],
    ['毎晩', '毎晩まとめて点検。急ぐ弱点は、すぐに知らせる'],
  ]
  cards.forEach(([h, b], i) => {
    const x = 0.5 + i * 3.05
    box(s, x, 1.05, 2.9, 1.15, C.background2, { r: 0.12, line: C.accent1 })
    T(s, h, { x: x + 0.2, y: 1.16, w: 2.5, h: 0.4, fontSize: 15, bold: true, color: C.accent1, fontFace: F.head, margin: 0 })
    T(s, b, { x: x + 0.2, y: 1.58, w: 2.55, h: 0.56, fontSize: 11.5, color: C.text1, margin: 0 })
  })
  const flow = ['見つける', '確認用の環境で検証', 'チャットで提案', '担当者が承認', '本番に反映']
  flow.forEach((t, i) => {
    const x = 0.5 + i * 1.82
    const human = i === 3
    chip(s, x, 2.75, 1.62, 0.6, t, { fill: human ? C.accent2 : C.background1, color: C.text1, line: human ? C.accent2 : C.accent1, size: 11.5 })
    if (i < flow.length - 1) arrow(s, x + 1.63, 3.05, x + 1.81, 3.05, { color: C.accent1, width: 1.75 })
  })
  T(s, '※ 確認用の環境＝本番とそっくりの検証用の環境。先にそこで問題がないか確かめてから、本番に出す計画を提案します。', { x: 0.5, y: 3.55, w: 9.0, h: 0.4, fontSize: 11, color: C.accent5, margin: 0 })
  bar(s, 4.1, 0.9, [lead('ねらい：'), plain('攻撃の多くは「更新していなかった既知の弱点」から。毎晩の点検と、見つけた穴の学習で、守りは放っておいても古くなりません。急ぐ弱点でも、返事がないまま AI が本番を更新することはありません。')])
  s.addNotes([
    '自己進化は、攻めることだけではありません。毎晩のアップデートも、その一部です。システムの部品や OS の新しい弱点、証明書の期限や古い設定を、毎晩まとめて点検します。',
    '見つけたら、確認用の環境でまず検証し、問題がなければチャットで提案し、担当者が承認してから本番に反映します。急ぐ弱点はすぐ知らせますが、返事がないまま AI が本番を更新することはありません。',
    '攻撃の多くは、更新していなかった既知の弱点から入ります。毎晩の点検と、見つけた穴の学習で、守りは放っておいても古くなりません。',
  ].join('\n'))
}

// ════════════════════════════════════════════════════════════════════════
// 10. Human decides
pres.addSection({ title: '安心のしくみ' })
{
  const s = content('安心のしくみ', '仮攻撃も対処も、決めるのは人')
  const cards = [
    ['視', '見るだけの AI', 'AI 自身は設定を書き換えられない。できるのは見ることと提案だけ'],
    ['鍵', '実施は別のしくみ', '対処や仮攻撃を実際に行う鍵は、承認された操作だけを行う別のしくみが持つ'],
    ['戻', '期限つき・戻せる', 'すべての一時的な対処に期限。期限がくれば自動で元に戻る。手でも戻せる'],
    ['録', '記録に残る', 'いつ・誰が・何を承認し、何をしたか。改ざんできない形で残る（監査）'],
  ]
  cards.forEach(([k, h, b], i) => {
    const x = 0.5 + (i % 2) * 4.55, y = 1.0 + Math.floor(i / 2) * 1.55
    box(s, x, y, 4.45, 1.42, C.background2, { r: 0.12, line: i < 2 ? C.accent1 : C.accent6 })
    kanji(s, x + 0.2, y + 0.2, 0.6, k, { fill: i < 2 ? C.accent1 : C.accent6, size: 21 })
    T(s, h, { x: x + 0.98, y: y + 0.2, w: 3.3, h: 0.46, fontSize: 16, bold: true, color: C.text2, valign: 'middle', fontFace: F.head, margin: 0 })
    T(s, b, { x: x + 0.25, y: y + 0.74, w: 4.0, h: 0.6, fontSize: 12, color: C.text1, margin: 0 })
  })
  bar(s, 4.2, 0.78, [lead('大事なところ：'), plain('「本番を変える鍵」も「仮攻撃の鍵」も、AI には渡しません。守るのは自社の資産だけ。安全の決まりは、プログラムのしくみそのものが守ります。')])
  s.addNotes([
    '自己進化は強力なので、安心のしくみも大事です。四つあります。一つ目、AI 自身は設定を書き換えられません。できるのは見ることと提案だけです。二つ目、対処や仮攻撃を実際に行う鍵は、承認された操作だけを行う別のしくみが持ちます。三つ目、すべての一時的な対処に期限があり、自動で元に戻り、手でも戻せます。四つ目、いつ誰が何を承認し何をしたかが、改ざんできない形で記録に残ります。',
    '大事なのは、本番を変える鍵も、攻める鍵も、AI には渡さないことです。守るのは自社の資産だけで、外のシステムには手を出しません。安全の決まりは言葉の約束ではなく、プログラムのしくみそのものが守ります。',
  ].join('\n'))
}

// ════════════════════════════════════════════════════════════════════════
// 11. Comparison
pres.addSection({ title: '違いと導入' })
{
  const s = content('違いと導入', 'ふつうのセキュリティ製品との、はっきりした違い')
  const W = [3.0, 3.0, 3.0]
  const head = ['', 'ふつうの製品', 'Bizアシスタント（RSI）']
  box(s, 0.5, 1.05, 9.0, 0.44, C.text2, { shape: S.RECTANGLE })
  let cx = 0.5
  head.forEach((h, i) => { T(s, h, { x: cx, y: 1.05, w: W[i], h: 0.44, fontSize: 12.5, bold: true, color: i === 2 ? C.accent2 : C.background1, valign: 'middle', align: i === 0 ? 'left' : 'center', fontFace: F.head, margin: [0, 0.1, 0, 0.1] }); cx += W[i] })
  const rows = [
    ['守り方', '一度入れて固定', '自分で仮攻撃して育てる'],
    ['効果の確認', '攻撃されて初めて', '毎週、自分で試して'],
    ['効果の見え方', '分からない', '数字で見える（カバレッジ）'],
    ['新しい脅威', '追いつけない', '毎晩点検・学習で追従'],
    ['運用', '人が時々見直す', 'AI が毎週育てる'],
    ['記録', 'ばらばら', '承認も対処も残る（監査）'],
  ]
  let y = 1.49
  rows.forEach((r, ri) => {
    const h = 0.52
    box(s, 0.5, y, 9.0, h, ri % 2 ? C.background1 : C.background2, { shape: S.RECTANGLE, line: C.background2 })
    let x2 = 0.5
    r.forEach((c, ci) => {
      T(s, c, {
        x: x2, y, w: W[ci], h, fontSize: 12, valign: 'middle', margin: [0, 0.12, 0, 0.12], align: ci === 0 ? 'left' : 'center',
        bold: ci === 0 || ci === 2, color: ci === 0 ? C.text2 : ci === 2 ? C.accent1 : C.accent5, fontFace: ci === 0 ? F.head : F.body,
      })
      x2 += W[ci]
    })
    y += h
  })
  bar(s, 4.5, 0.52, [plain('「守ります」はどこも同じ。ちがいは、効いているかを自分で確かめ、毎週強くなるかどうか。', { bold: true })])
  s.addNotes([
    'ふつうのセキュリティ製品との違いを、表で整理しました。守り方は、固定か、自分で攻めて育てるか。効果の確認は、攻撃されて初めてか、毎週自分で試してか。効果の見え方は、分からないか、数字で見えるか。新しい脅威に、追いつけないか、毎晩の点検と学習で追従するか。運用は、人が時々見直すか、AI が毎週育てるか。記録は、ばらばらか、承認も対処も残るか。',
    '「守ります」はどこも同じです。ちがいは、効いているかを自分で確かめ、毎週強くなるかどうかです。',
  ].join('\n'))
}

// 12. Benefits
{
  const s = content('違いと導入', '得られること')
  const cards = [
    ['強', '強くなり続ける安心', '一度きりでなく、毎週守りが厚くなる。止まらない自己進化', C.accent1],
    ['数', '効果が数字で見える', '「守れているつもり」ではなく、気づけた割合で示せる', C.accent1],
    ['楽', '専任なしで回る', '試す・調べる・案を作るは AI。担当者は判断に集中できる', C.accent6],
    ['録', '説明できる記録', '何が起きて、どう守ったか。取引先や監査に示せる', C.accent6],
  ]
  cards.forEach(([k, h, b, color], i) => {
    const x = 0.5 + (i % 2) * 4.55, y = 1.0 + Math.floor(i / 2) * 1.6
    box(s, x, y, 4.45, 1.48, C.background2, { r: 0.12, line: color })
    kanji(s, x + 0.2, y + 0.2, 0.62, k, { fill: color, size: 22 })
    T(s, h, { x: x + 1.0, y: y + 0.2, w: 3.3, h: 0.5, fontSize: 16.5, bold: true, color: C.text2, valign: 'middle', fontFace: F.head, margin: 0 })
    T(s, b, { x: x + 0.25, y: y + 0.76, w: 4.0, h: 0.64, fontSize: 12, color: C.text1, margin: 0 })
  })
  bar(s, 4.32, 0.73, [lead('ひとことで：'), plain('買って終わりの守りではなく、使うほど強くなり、効果が数字で分かるセキュリティ。')])
  s.addNotes([
    '得られることは四つです。強くなり続ける安心、一度きりでなく毎週守りが厚くなります。効果が数字で見える、守れているつもりではなく気づけた割合で示せます。専任なしで回る、試す・調べる・案を作るは AI がやり、担当者は判断に集中できます。説明できる記録、何が起きてどう守ったかを取引先や監査に示せます。',
    'ひとことで言えば、買って終わりの守りではなく、使うほど強くなり、効果が数字で分かるセキュリティです。',
  ].join('\n'))
}

// 13. Start small + rollout
{
  const s = content('違いと導入', '小さく始めて、毎週強く')
  const steps = [
    ['1', '診断', '今のシステムと守りの状態を見て、足すものと期間を見積もる'],
    ['2', '見るだけ', 'まず外から見張って報告するだけ。負担も危険もなく始める'],
    ['3', '仮攻撃で試す', '確認用の環境で、自分で安全に仮攻撃して「気づけるか」を確かめる'],
    ['4', '承認で対処', 'きざしや穴に、チャットで承認して対処する'],
    ['5', '毎週強く', '仮攻撃をくり返し、見張る目を増やして守りを育てる'],
  ]
  steps.forEach(([n, h, b], i) => {
    const y = 1.05 + i * 0.78
    kanji(s, 0.6, y, 0.6, n, { fill: i === 4 ? C.accent4 : i === 2 ? C.accent3 : C.accent1, size: 20 })
    T(s, h, { x: 1.4, y, w: 2.4, h: 0.6, fontSize: 16, bold: true, color: C.text2, valign: 'middle', fontFace: F.head, margin: 0 })
    T(s, b, { x: 3.9, y, w: 5.6, h: 0.6, fontSize: 13, color: C.text1, valign: 'middle', margin: 0 })
    if (i < steps.length - 1) arrow(s, 0.9, y + 0.6, 0.9, y + 0.78, { color: C.accent5, width: 1.5 })
  })
  s.addNotes([
    '導入は 5 つのステップで、無理なく進めます。一つ目、診断。今のシステムと守りの状態を見て、足すものと期間を見積もります。二つ目、見るだけ。まず外から見張って報告するだけで、負担も危険もなく始めます。三つ目、仮攻撃で試す。確認用の環境で、自分で安全に攻めて気づけるかを確かめます。四つ目、承認で対処。きざしや穴に、チャットで承認して対処します。五つ目、毎週強く。仮攻撃をくり返し、見張る目を増やして守りを育てます。',
    '今のサーバーに少し足すだけで始められ、見るだけから、安心を確かめながら進められます。',
  ].join('\n'))
}

// 14. CTA
{
  const s = pres.addSlide({ masterName: 'SECTION_DARK', sectionTitle: '違いと導入' })
  s.addText('使うほど強くなる守りを、試してみませんか', { placeholder: 'title', fontFace: F.head, lang: 'ja-JP' })
  const offers = [
    ['談', 'ご相談', '今の守りの状態を\n診断し、足すものと\n期間を見積もります'],
    ['試', '仮攻撃デモ', '実際に安全な仮攻撃を\n行い、気づけるかを\nその場でお見せします'],
    ['算', '試算', '御社の規模に合わせて\n費用と効果を\n一緒に見積もります'],
  ]
  offers.forEach(([k, head, body], i) => {
    const x = 0.6 + i * 2.95
    box(s, x, 1.4, 2.75, 2.25, C.background1, { r: 0.12 })
    kanji(s, x + 0.2, 1.6, 0.6, k, { fill: C.accent2, color: C.text1, size: 20 })
    T(s, head, { x: x + 0.95, y: 1.6, w: 1.7, h: 0.6, fontSize: 18, bold: true, color: C.text2, valign: 'middle', fontFace: F.head, margin: 0 })
    T(s, body, { x: x + 0.2, y: 2.35, w: 2.35, h: 1.2, fontSize: 13, color: C.text1, margin: 0 })
  })
  box(s, 0.6, 3.95, 8.8, 0.95, C.text1, { r: 0.12, line: C.accent2, lw: 1.25 })
  T(s, [
    { text: 'お問い合わせ', options: { bold: true, fontSize: 14, color: C.accent2, breakLine: true, paraSpaceAfter: 3 } },
    { text: CONTACT, options: { fontSize: 15, color: C.background1 } },
  ], { x: 0.85, y: 3.95, w: 8.3, h: 0.95, valign: 'middle' })
  s.addNotes([
    '最後に、次の一歩のご提案です。まずはご相談として、今の守りの状態を診断します。そして、実際に安全な仮攻撃を行い、御社のシステムがちゃんと気づけるかを、その場でお見せできます。これがいちばん分かりやすいと思います。さらに、御社の規模に合わせて費用と効果を一緒に試算します。',
    '「守ります」で終わらない、使うほど強くなる守りを、まず試してみませんか。ご清聴ありがとうございました。',
  ].join('\n'))
}

// 15. Appendix for IT
pres.addSection({ title: '付録' })
{
  const s = content('付録', '付録：IT ご担当者さまへ')
  T(s, '技術的なしくみは、別紙の技術資料「セキュリティの RSI とセキュリティ監視 AI」に詳しくまとめています。要点のみ：', { x: 0.5, y: 0.98, w: 9.0, h: 0.38, fontSize: 12.5, color: C.text2, margin: 0 })
  const rows = [
    ['自己進化（RSI）', '仮攻撃（BAS）→ 検知を監視 → 穴を検知ルール・プレイブックで補強 → 回帰シナリオ化。検知カバレッジを指標に、毎週向上'],
    ['仮攻撃の安全', '自社資産のみ・確認環境（staging）が既定・承認で開始・キルスイッチ・非破壊。OWASP ZAP・testssl.sh 等の既製の型'],
    ['置き場所', '監視・運用面は業務 VNet の外（別サブスク）。Azure 管理面（Log Analytics・フローログ・Resource Graph・ARM）と外部プローブで見る'],
    ['権限', '監視 AI は読み取り専用（Reader）。NSG・WAF に書けるのは承認ゲートのマネージド ID だけ。仮攻撃の実行役と監視役を分離'],
    ['対処', 'プレイブック（PB-01〜12）を署名つき操作票＋ SNS 承認で。期限つき・取り消し可。高リスクは Passkey'],
    ['更新', '毎晩 OSV・Trivy で点検 → 開発は自動・検証で確認・本番は承認'],
  ]
  let y = 1.42
  rows.forEach(([k, v], i) => {
    const h = i <= 3 ? 0.58 : 0.46
    box(s, 0.5, y, 9.0, h, i % 2 ? C.background1 : C.background2, { r: 0.08, line: C.background2 })
    T(s, k, { x: 0.62, y, w: 1.7, h, fontSize: 11, bold: true, color: C.accent1, valign: 'middle', fontFace: F.head, margin: 0 })
    T(s, v, { x: 2.35, y, w: 7.05, h, fontSize: 10, color: C.text1, valign: 'middle', margin: 0 })
    y += h + 0.04
  })
  T(s, '詳細・図・費用の目安・ロードマップ（N0〜N5）は技術資料と docs/RSI_SELF_IMPROVING_SYSTEM.md（§10〜§12）をご覧ください。守るのは自社の資産だけ。', { x: 0.5, y: y + 0.03, w: 9.0, h: 0.32, fontSize: 9.5, color: C.accent5, margin: 0 })
  s.addNotes([
    'IT ご担当者さま向けの付録です。技術的なしくみは別紙の技術資料に詳しくまとめています。要点だけお伝えします。',
    '自己進化は、仮攻撃、つまり BAS で検知を試し、監視して、気づけなかった所を検知ルールやプレイブックで補強し、回帰シナリオにする循環です。検知カバレッジを指標に毎週向上させます。仮攻撃は自社資産のみ、確認環境が既定、承認で開始、キルスイッチつき、非破壊で、OWASP ZAP や testssl などの既製の型を使います。',
    '監視・運用面は業務の仮想ネットワークの外に置き、監視 AI は読み取り専用、業務のネットワークに書けるのは承認ゲートだけです。対処は署名つきの操作票と SNS 承認で行います。詳細は技術資料と RSI の設計書をご覧ください。',
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
    if (bad) throw new Error(`${name}: <a:srgbClr val="${bad[1]}"> is not a hex colour`)
  }
  fs.writeFileSync(file, await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }))
}

;(async () => {
  fs.mkdirSync(path.dirname(OUT), { recursive: true })
  await pres.writeFile({ fileName: OUT })
  await applyTheme(OUT, THEME)
  console.log(`wrote ${OUT}`)
})().catch((e) => { console.error(e); process.exit(1) })
