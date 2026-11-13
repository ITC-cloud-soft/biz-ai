// Builds docs/slides/manual/biz-assistant-framework-technical-guide.pptx — Biz Assistant Framework 技術解説（技術担当者向け、日本語）。
// node build.cjs [out.pptx]   (default: ../biz-assistant-framework-technical-guide.pptx)
// The same content in more detail: ../biz-assistant-framework-technical-guide.md (keep the two in step).
// Audience: the engineers a customer assigns after the executive presentation; also the draft for the official web site.
// No internal environment / host / customer names; examples are fictional (受注管理, 設備点検). No prompt texts or thresholds.
// Theme and helpers are the ones of maintenance-ai docs/slides/ops-ai/src/build-tech.cjs (運用AI Bot 技術概要).
// Needs pptxgenjs + react + react-dom + react-icons + sharp (NODE_PATH, see README.md).
const path = require('path')
const fs = require('fs')
let pptxgen, React, renderToStaticMarkup, sharp, md, fa, gi, bs
try {
  pptxgen = require('pptxgenjs')
  React = require('react')
  renderToStaticMarkup = require('react-dom/server').renderToStaticMarkup
  sharp = require('sharp')
  md = require('react-icons/md')
  fa = require('react-icons/fa6')
  gi = require('react-icons/gi')
  bs = require('react-icons/bs')
} catch (e) {
  console.error('pptxgenjs / react / react-dom / react-icons / sharp が見つかりません。README.md の手順で入れてください。', e.message)
  process.exit(1)
}
const JSZip = require(require.resolve('jszip', { paths: [path.dirname(require.resolve('pptxgenjs'))] }))

const OUT = path.resolve(process.argv[2] ?? path.join(__dirname, '..', 'biz-assistant-framework-technical-guide.pptx'))
const LANG = 'ja-JP'
const PRODUCT = 'Biz Assistant Framework'

const THEME = {
  name: 'DSH Bridge Ink',
  headFontFace: 'Meiryo',
  bodyFontFace: 'Meiryo',
  colors: {
    dk1: '1B2A2F', lt1: 'FFFFFF', dk2: '0E4B57', lt2: 'EEF3F2',
    accent1: '0E7C86', accent2: 'F2A541', accent3: 'C8553D', accent4: '4F8A5B', accent5: '6B7C80', accent6: '2F4858',
    hlink: '0E7C86', folHlink: '6B7C80',
  },
}
const F = { head: 'Meiryo', body: 'Meiryo' }
const HEX = THEME.colors

const pres = new pptxgen()
pres.layout = 'LAYOUT_16x9' // 10 x 5.625
pres.title = `${PRODUCT} 技術解説（技術担当者向け）`
pres.subject = `${PRODUCT}（Bizアシスタント）：構成・プロトコル・流れ・安全・つなぎ方`
pres.author = 'ITC Bizアシスタント'
pres.theme = { headFontFace: F.head, bodyFontFace: F.body }
const C = pres.SchemeColor
const S = pres.shapes

pres.defineSlideMaster({
  title: 'TITLE_DARK',
  background: { color: C.text2 },
  objects: [
    { placeholder: { options: { name: 'title', type: 'title', x: 0.6, y: 1.0, w: 5.6, h: 1.9, fontFace: F.head, fontSize: 32, bold: true, color: C.background1, valign: 'bottom', align: 'left', margin: 0 }, text: '' } },
    { placeholder: { options: { name: 'body', type: 'body', x: 0.6, y: 3.1, w: 5.6, h: 1.8, fontFace: F.body, fontSize: 14, color: C.background2, valign: 'top', align: 'left', margin: 0 }, text: '' } },
  ],
})
pres.defineSlideMaster({
  title: 'CONTENT',
  background: { color: C.background1 },
  margin: [0.3, 0.5, 0.4, 0.5],
  objects: [
    { placeholder: { options: { name: 'title', type: 'title', x: 0.5, y: 0.22, w: 7.6, h: 0.62, fontFace: F.head, fontSize: 22, bold: true, color: C.text2, valign: 'middle', align: 'left', margin: 0 }, text: '' } },
    { text: { text: `${PRODUCT} ・ 技術解説（技術担当者向け）`, options: { x: 0.5, y: 5.27, w: 6, h: 0.25, fontFace: F.body, fontSize: 9, color: C.accent5, margin: 0 } } },
  ],
  slideNumber: { x: 9.0, y: 5.27, w: 0.5, h: 0.25, fontFace: F.body, fontSize: 9, color: C.accent5, align: 'right' },
})

// ── icons ───────────────────────────────────────────────────────────────────
const ICON = {
  bug: md.MdBugReport, fix: md.MdBuild, chat: md.MdForum, team: md.MdGroups, brain: gi.GiBrain, ticket: md.MdAssignment,
  report: md.MdAssessment, loop: md.MdAutorenew, shield: md.MdShield, night: md.MdBedtime, clock: md.MdAccessTime,
  doc: md.MdDescription, check: md.MdCheckCircle, rocket: md.MdRocketLaunch, eye: md.MdVisibility, bell: md.MdNotificationsActive,
  search: md.MdManageSearch, code: md.MdCode, test: md.MdScience, tap: md.MdTouchApp, upload: md.MdCloudUpload, robot: md.MdSmartToy,
  person: md.MdPerson, server: md.MdDns, trendUp: md.MdTrendingUp, savings: md.MdSavings, undo: md.MdUndo, branch: md.MdCallSplit,
  privacy: md.MdPrivacyTip, history: md.MdHistory, health: md.MdHealthAndSafety, plan: md.MdEditNote, ok: md.MdHowToReg,
  hourglass: md.MdHourglassBottom, log: md.MdTerminal, tune: md.MdTune, rule: md.MdRule, warn: md.MdWarning, idea: md.MdLightbulb,
  settings: md.MdSettings, github: fa.FaGithub, lock: md.MdLock, key: md.MdVpnKey, cloud: md.MdCloud, lan: md.MdLan, block: md.MdBlock,
  link: md.MdLink, pause: md.MdPause, schedule: md.MdSchedule, owner: md.MdAdminPanelSettings, engineer: md.MdEngineering,
  groupOff: md.MdGroupOff, quit: md.MdPersonOff, archive: md.MdArchive, dashboard: md.MdDashboard, route: md.MdAltRoute,
  box: md.MdInventory2, filter: md.MdFilterAlt, verified: md.MdVerifiedUser, storage: md.MdStorage, wall: md.MdSecurity,
  hub: md.MdHub, memo: md.MdBookmarks, sync: md.MdSync, flag: md.MdFlag, handshake: md.MdHandshake, model: md.MdMemory,
}
for (const [k, v] of Object.entries(ICON)) if (!v) throw new Error(`icon ${k} is missing in react-icons`)
const PALETTE = { w: 'FFFFFF', teal: HEX.accent1, dark: HEX.dk2, orange: HEX.accent2, red: HEX.accent3, green: HEX.accent4, gray: HEX.accent5, ink: HEX.dk1 }
const ICONDATA = {}
async function prepIcons() {
  for (const [name, Comp] of Object.entries(ICON)) {
    for (const [cname, hex] of Object.entries(PALETTE)) {
      const svg = renderToStaticMarkup(React.createElement(Comp, { color: `#${hex}`, size: 256 }))
      const png = await sharp(Buffer.from(svg)).resize(256, 256).png().toBuffer()
      ICONDATA[`${name}:${cname}`] = 'image/png;base64,' + png.toString('base64')
    }
  }
}

// ── helpers ─────────────────────────────────────────────────────────────────
let objCount = 0
const oid = (p) => `${p}-${++objCount}`
function T(slide, text, o = {}) {
  slide.addText(text, { isTextBox: true, lang: LANG, fontFace: F.body, fontSize: 12, color: C.text1, margin: 0.03, valign: 'top', objectName: oid('text'), ...o })
}
function box(slide, x, y, w, h, fill, o = {}) {
  const shape = o.shape ?? S.ROUNDED_RECTANGLE
  slide.addShape(shape, {
    x, y, w, h,
    fill: { color: fill },
    line: { color: o.line ?? fill, width: o.lw ?? 0.75, ...(o.dash ? { dashType: o.dash } : {}) },
    ...(shape === S.ROUNDED_RECTANGLE ? { rectRadius: o.r ?? 0.1 } : {}),
    ...(o.shadow ? { shadow: { type: 'outer', color: '000000', opacity: 0.16, blur: 4, offset: 1.5, angle: 90 } } : {}),
    objectName: oid('box'),
  })
}
function arrow(slide, x1, y1, x2, y2, { color = C.accent5, width = 2, dash, both = false } = {}) {
  slide.addShape(S.LINE, {
    x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.max(Math.abs(x2 - x1), 0.001), h: Math.max(Math.abs(y2 - y1), 0.001),
    flipH: x2 < x1, flipV: y2 < y1,
    line: { color, width, endArrowType: 'triangle', ...(both ? { beginArrowType: 'triangle' } : {}), ...(dash ? { dashType: dash } : {}) },
    objectName: oid('arrow'),
  })
}
function icon(slide, name, x, y, size, color = 'w') {
  if (!ICONDATA[`${name}:${color}`]) throw new Error(`icon ${name}:${color} not prepared`)
  slide.addImage({ data: ICONDATA[`${name}:${color}`], x, y, w: size, h: size, altText: name, objectName: oid('icon') })
}
function badge(slide, name, x, y, d, fill = C.accent1, color = 'w') {
  slide.addShape(S.OVAL, { x, y, w: d, h: d, fill: { color: fill }, line: { color: fill, width: 0.75 }, objectName: oid('badge') })
  icon(slide, name, x + d * 0.2, y + d * 0.2, d * 0.6, color)
}
function node(slide, name, cx, y, d, label, { fill = C.accent1, color = 'w', size = 11, labelW = 1.4, labelColor = C.text2 } = {}) {
  badge(slide, name, cx - d / 2, y, d, fill, color)
  if (label) T(slide, label, { x: cx - labelW / 2, y: y + d + 0.04, w: labelW, h: 0.5, fontSize: size, bold: true, color: labelColor, align: 'center', margin: 0 })
}
function chain(slide, items, x, y, w, d, o = {}) {
  const n = items.length
  const step = (w - d) / (n - 1)
  items.forEach(([ic, label, fill], i) => {
    const cx = x + d / 2 + i * step
    node(slide, ic, cx, y, d, label, { fill: fill ?? C.accent1, labelW: Math.min(step + 0.05, 1.8), ...o })
    if (i < n - 1) arrow(slide, cx + d / 2 + 0.05, y + d / 2, cx + step - d / 2 - 0.05, y + d / 2, { color: C.accent5, width: 1.75 })
  })
}
function content(part, t) {
  const slide = pres.addSlide({ masterName: 'CONTENT', sectionTitle: part })
  slide.addText(t, { placeholder: 'title', fontFace: F.head, lang: LANG })
  box(slide, 8.2, 0.36, 1.3, 0.34, C.background2, { line: C.background2, r: 0.17 })
  T(slide, part, { x: 8.2, y: 0.36, w: 1.3, h: 0.34, fontSize: 10, bold: true, color: C.accent1, align: 'center', valign: 'middle', margin: 0 })
  return slide
}
function punch(slide, text, color = C.accent3, y = 4.82) {
  T(slide, text, { x: 0.5, y, w: 9.0, h: 0.38, fontSize: 14, bold: true, color, align: 'center', valign: 'middle' })
}
function chip(slide, x, y, w, h, text, { fill = C.accent2, color = C.text1, size = 11, line } = {}) {
  box(slide, x, y, w, h, fill, { line: line ?? fill, r: h / 2 })
  T(slide, text, { x, y, w, h, fontSize: size, bold: true, color, align: 'center', valign: 'middle', margin: 0 })
}
/** a card: icon + bold title + body text */
function card(slide, x, y, w, h, ic, title, body, { fill = C.background2, line = C.accent1, iconColor = 'teal', titleColor = C.text2, size: size0 = 10.5, titleSize: ts0 = 12.5 } = {}) {
  // body text one size up from the value a slide asks for (the first render left the cards half empty)
  const size = Math.max(size0 + 1.5, 11.5), titleSize = Math.max(ts0 + 0.5, 13)
  box(slide, x, y, w, h, fill, { line, r: 0.1 })
  icon(slide, ic, x + 0.14, y + 0.12, 0.42, iconColor)
  T(slide, title, { x: x + 0.64, y: y + 0.1, w: w - 0.72, h: 0.46, fontSize: titleSize, bold: true, color: titleColor, valign: 'middle', margin: 0 })
  if (body) T(slide, body, { x: x + 0.14, y: y + 0.62, w: w - 0.26, h: h - 0.7, fontSize: size, color: C.text1, margin: 0, paraSpaceAfter: 2 })
}
/** a table with a dark header row; widths in inches; cells are strings (or {text, bold, color}) */
function table(slide, rows, { x = 0.5, y = 1.0, w = 9.0, colW, fontSize = 10.5, rowH = 0.36, headSize } = {}) {
  const data = rows.map((r, i) => r.map((c) => {
    const cell = typeof c === 'string' ? { text: c } : c
    const head = i === 0
    return {
      text: cell.text,
      options: {
        fontFace: F.body, fontSize: head ? (headSize ?? fontSize) : fontSize, bold: head || cell.bold === true,
        color: head ? 'FFFFFF' : (cell.color ?? HEX.dk1), fill: { color: head ? HEX.dk2 : (cell.fill ?? (i % 2 ? 'FFFFFF' : 'F4F7F6')) },
        valign: 'middle', margin: [0.04, 0.08, 0.04, 0.08], lang: LANG,
      },
    }
  }))
  slide.addTable(data, { x, y, w, colW, rowH, border: { type: 'solid', pt: 0.75, color: 'D5DEDC' }, objectName: oid('table') })
}
/** a section divider (dark) */
function divider(part, title, sub) {
  const s = pres.addSlide({ masterName: 'TITLE_DARK', sectionTitle: part })
  s.addText(title, { placeholder: 'title', fontFace: F.head, lang: LANG })
  s.addText(sub, { placeholder: 'body', fontFace: F.body, lang: LANG })
  return s
}

// ════════════════════════════════════════════════════════════════════════
Object.assign(ICON, {
  event: md.MdEvent, mail: md.MdMail, image: md.MdImage, attach: md.MdAttachFile, help: md.MdHelpOutline, web: md.MdWeb,
  api: md.MdApi, layers: md.MdLayers, plug: md.MdExtension, badge: md.MdBadge, apps: md.MdApps, scan: md.MdDocumentScanner,
  user: md.MdFace, star: md.MdStars, thumb: md.MdThumbUp, keyboard: md.MdKeyboard, run: md.MdDirectionsRun, edit: md.MdEdit,
  newsys: md.MdNewReleases, outbox: md.MdOutbox, card: md.MdCreditCard, qa: md.MdQuestionAnswer, sun: md.MdWbSunny, done: md.MdTaskAlt,
})
for (const [k, v] of Object.entries(ICON)) if (!v) throw new Error(`icon ${k} is missing in react-icons`)

/** dark code box (monospace) */
function code(slide, x, y, w, h, text, size = 8.5) {
  box(slide, x, y, w, h, '1B2A2F', { r: 0.06 })
  T(slide, text, { x: x + 0.1, y: y + 0.08, w: w - 0.2, h: h - 0.16, fontFace: 'Consolas', fontSize: size, color: 'E6F0EE', margin: 0, lang: 'en-US' })
}
/** an AI secretary message (fictional) */
function message(slide, x, y, w, h, label, color, body) {
  box(slide, x, y, w, h, C.background1, { line: 'D5DEDC', r: 0.08, shadow: true })
  box(slide, x, y + 0.08, 0.05, h - 0.16, color, { shape: S.RECTANGLE })
  T(slide, [{ text: label, options: { bold: true, fontSize: 11, color, breakLine: true } }, { text: body, options: { fontSize: 11 } }], { x: x + 0.14, y: y + 0.06, w: w - 0.22, h: h - 0.12, paraSpaceAfter: 2 })
}
/** a list of short bullet lines with small icons */
function bullets(slide, x, y, w, items, { step = 0.5, size = 11, ic = 'check', color = 'teal' } = {}) {
  items.forEach((t, i) => {
    icon(slide, ic, x, y + i * step + 0.05, 0.28, color)
    T(slide, t, { x: x + 0.38, y: y + i * step, w: w - 0.38, h: step - 0.04, fontSize: size, color: C.text1, valign: 'middle', margin: 0 })
  })
}

const P0 = 'はじめに', P1 = '構成', P2 = 'プロトコル', P3 = '主な流れ', P4 = '安全', P5 = 'つなぐ', P6 = '品質と提供'

function build() {
  // ── はじめに ───────────────────────────────────────────────────────────
  pres.addSection({ title: P0 })
  {
    const s = pres.addSlide({ masterName: 'TITLE_DARK', sectionTitle: P0 })
    s.addText('Biz Assistant\nFramework 技術解説', { placeholder: 'title', fontFace: F.head, lang: LANG })
    s.addText([
      { text: '技術担当者向け', options: { bold: true, fontSize: 18, color: C.accent2, breakLine: true } },
      { text: '記録するシステムを、考えて動くシステムに：構成・プロトコル・流れ・安全・つなぎ方' },
    ], { placeholder: 'body', fontFace: F.body, lang: LANG })
    const tiles = [['layers', '構成', C.accent1], ['api', 'プロトコル', C.accent6], ['shield', '安全', C.accent3], ['link', 'つなぐ', C.accent4]]
    tiles.forEach(([ic, label, fill], i) => {
      const x = 6.55 + (i % 2) * 1.55, y = 0.95 + Math.floor(i / 2) * 1.85
      box(s, x, y, 1.4, 1.65, fill, { r: 0.14 })
      icon(s, ic, x + 0.36, y + 0.24, 0.68, 'w')
      T(s, label, { x: x + 0.05, y: y + 1.05, w: 1.3, h: 0.45, fontSize: 13, bold: true, color: C.background1, align: 'center', valign: 'middle', margin: 0 })
    })
    s.addNotes('Biz Assistant Framework（顧客向けの名前は Bizアシスタント）の技術解説です。経営層向けの資料で「何が変わるか」をご覧いただいたあと、導入・連携の検討を任された技術担当者が、構成、プロトコル、主な流れ、安全の約束、つなぎ方と確かめ方を短時間で把握できるようにまとめています。同じ内容を詳しく書いた Markdown 版があります。')
  }
  {
    const s = content(P0, 'この資料について')
    card(s, 0.5, 1.0, 4.35, 1.6, 'person', '想定する読み手', 'アプリケーション開発・インフラ・情報セキュリティ・業務システムの保守の担当者。経営層への説明のあと、導入の検討を任された方。')
    card(s, 5.15, 1.0, 4.35, 1.6, 'block', '扱わないこと', 'AI への指示文の全文、判定の閾値、ソースコードの細部。必要な場合は秘密保持契約のうえで個別にご説明します。', { line: C.accent5, iconColor: 'gray' })
    const parts = [['layers', '構成'], ['api', 'プロトコル'], ['route', '主な流れ'], ['shield', '安全'], ['link', 'つなぐ'], ['check', '品質と提供']]
    parts.forEach(([ic, t], i) => {
      const x = 0.5 + i * 1.52
      box(s, x, 2.85, 1.4, 1.35, C.background1, { line: C.accent1, r: 0.1 })
      badge(s, ic, x + 0.42, 2.97, 0.56, [C.accent1, C.accent6, C.accent1, C.accent3, C.accent4, C.accent6][i])
      T(s, t, { x, y: 3.6, w: 1.4, h: 0.45, fontSize: 12, bold: true, color: C.text2, align: 'center', valign: 'middle', margin: 0 })
    })
    T(s, '例に出てくる業務名・画面・数値（受注管理・設備点検など）はすべて説明用の架空の例です。', { x: 0.5, y: 4.45, w: 9, h: 0.35, fontSize: 10.5, color: C.accent5, align: 'center' })
    s.addNotes('構成、プロトコル、主な流れ、安全、つなぎ方、品質と提供状況の順に説明します。AI への指示文や判定の閾値など製品の中核のノウハウは扱いません。資料中の業務名・画面・数値はすべて説明用の架空の例です。')
  }
  {
    const s = content(P0, '記録して待つシステムから、考えて動くシステムへ')
    box(s, 0.5, 1.0, 4.2, 3.6, 'FBEDEA', { line: C.accent3, r: 0.12 })
    T(s, 'これまでの業務システム', { x: 0.5, y: 1.06, w: 4.2, h: 0.36, fontSize: 13, bold: true, color: C.accent3, align: 'center', margin: 0 })
    bullets(s, 0.75, 1.55, 3.8, ['登録・照会・更新・削除と決められた処理', '人が画面を開くまで待っている', '大事な変化に、見に行かないと気づかない', '確認・承認・催促のために人を追いかける', '画面を新しくしても仕事の形は同じ'], { ic: 'warn', color: 'red', size: 11, step: 0.58 })
    arrow(s, 4.8, 2.8, 5.2, 2.8, { color: C.accent2, width: 4 })
    box(s, 5.3, 1.0, 4.2, 3.6, 'E3F1EE', { line: C.accent4, r: 0.12 })
    T(s, '考えて動くシステム', { x: 5.3, y: 1.06, w: 4.2, h: 0.36, fontSize: 13, bold: true, color: C.accent4, align: 'center', margin: 0 })
    bullets(s, 5.55, 1.55, 3.8, ['AI 社員が変化を見張り、関係する人に知らせる', '適任者に頼み、進まなければ催促する', '本人の権限で読み、案を下書きする', '好み・手順・前の話を覚えている', '人はチャットで確かめて決めるだけ'], { ic: 'check', color: 'green', size: 11, step: 0.58 })
    punch(s, 'どの IT システムにも、AI 社員を。決めるのはいつも人')
    s.addNotes('これまでの業務システムは、CRUD と決められた業務処理を確実にこなしますが、人が画面を開くまで何もしません。情報はシステムの中にあるのに、それを人に届けて動かす仕組みがありません。Biz Assistant Framework は、どの IT システムにも AI 社員を付け、変化を見張って知らせ、頼み、催促し、案を下書きし、覚えている「考えて動くシステム」に変えます。確定・承認・金額の決定は AI にはできない作りで、決めるのはいつも人です。')
  }
  {
    const s = content(P0, '3 つの力と、人の役割')
    const cols = [
      ['brain', '考える', C.accent1, '本人の権限の範囲で業務データを読み、いま大事なことを見分け、計画書や修正の案を下書きする', '内容を確かめ、採用するかを決める'],
      ['memo', '覚える', C.accent6, '一人ひとりの好みと用件、組織の手順と決めごと、前の会話の要点を覚える（個人情報は覚えない）', '覚えてほしいことを伝える。間違いは消す'],
      ['run', '自分から動く', C.accent4, '変化を見張り、関係する人にだけ知らせ、適任者に頼み、催促し、定時にまとめて報告する', 'チャットで受け取り、承認・判断する'],
    ]
    cols.forEach(([ic, t, fill, ai, hu], i) => {
      const x = 0.5 + i * 3.05
      box(s, x, 1.0, 2.85, 3.65, C.background2, { line: fill, r: 0.12 })
      badge(s, ic, x + 0.15, 1.1, 0.62, fill)
      T(s, t, { x: x + 0.85, y: 1.1, w: 1.9, h: 0.62, fontSize: 16, bold: true, color: fill, valign: 'middle', margin: 0 })
      chip(s, x + 0.15, 1.9, 1.2, 0.3, 'AI 社員', { fill, color: C.background1, size: 10 })
      T(s, ai, { x: x + 0.15, y: 2.25, w: 2.6, h: 1.2, fontSize: 11, color: C.text1, margin: 0 })
      chip(s, x + 0.15, 3.5, 1.2, 0.3, '人', { fill: C.accent2, color: C.text1, size: 10 })
      T(s, hu, { x: x + 0.15, y: 3.85, w: 2.6, h: 0.7, fontSize: 11, bold: true, color: C.text2, margin: 0 })
    })
    s.addNotes('AI 社員の力は、考える・覚える・自分から動くの 3 つです。それぞれに対して人の役割があります。AI 社員は読み、見分け、下書きし、覚え、知らせ、頼み、まとめます。人は確かめ、採用し、承認します。')
  }
  {
    const s = content(P0, '2 つの使い方と、7 つの設計原則')
    card(s, 0.5, 1.0, 3.7, 1.75, 'server', '既存の業務システムにつなぐ', '主な使い方。「ブリッジ」（Bridge v1 の窓口・manifest・本人の SNS 連携・受信者の規則など）を足す。業務ロジックの書き換えは不要だが、何も変えずにつながるわけではない', { size: 9.5 })
    card(s, 0.5, 2.9, 3.7, 1.75, 'newsys', '新しい業務システムを作る', '部品（server-kit）の上で作る。生まれたときから AI 社員と働くシステム。業務システムが書くのは業務そのもの・hooks・manifest・画面', { size: 9.5, line: C.accent4, iconColor: 'green' })
    const pr = ['業務システムが唯一の正本', 'AI は読む・提案するだけ', '誰に届けるかは業務システムが決める', 'SNS の連携は本人だけ', 'event とチャットに個人情報を載せない', '閉じた既定（fail closed）', '約束はテストで確かめる（52 項目）']
    box(s, 4.45, 1.0, 5.05, 3.65, C.text2, { r: 0.12 })
    pr.forEach((t, i) => {
      chip(s, 4.65, 1.15 + i * 0.49, 0.38, 0.38, String(i + 1), { fill: C.accent2, color: C.text1, size: 11 })
      T(s, t, { x: 5.15, y: 1.13 + i * 0.49, w: 4.25, h: 0.42, fontSize: 12, bold: true, color: C.background1, valign: 'middle', margin: 0 })
    })
    s.addNotes('使い方は 2 つです。主な使い方は、既存の業務システムにブリッジを足してつなぐことです。業務ロジックの書き換えは不要ですが、窓口や規則などの追加は必要です。もう 1 つは、部品の上で新しい業務システムを作ることです。設計の原則は 7 つで、業務システムが正本、AI は読む・提案するだけ、受信者は業務システムが決める、連携は本人だけ、個人情報を載せない、閉じた既定、約束はテストで確かめる、です。')
  }

  // ── 構成 ───────────────────────────────────────────────────────────────
  pres.addSection({ title: P1 })
  divider(P1, '第 1 部\n構成', '業務面と AI 面、5 つの層、9 つのプラグイン、\n業務 Web への組み込み')
  {
    const s = content(P1, '業務面と AI 面を、Bridge v1 でつなぐ')
    box(s, 0.5, 1.0, 3.0, 3.25, C.background2, { line: C.accent6, r: 0.12 })
    T(s, '業務面（業務システム＝正本）', { x: 0.5, y: 1.05, w: 3.0, h: 0.34, fontSize: 11, bold: true, color: C.accent6, align: 'center', margin: 0 })
    ;['業務データ・職員と役割', '規則・承認・金額・監査', '通知の受信者と本人の設定', 'AI 社員のプロフィール', 'マニュアルの索引'].forEach((t, i) => {
      icon(s, 'check', 0.68, 1.55 + i * 0.5, 0.26, 'dark')
      T(s, t, { x: 1.0, y: 1.5 + i * 0.5, w: 2.45, h: 0.38, fontSize: 10.5, color: C.text1, valign: 'middle', margin: 0 })
    })
    box(s, 3.65, 1.75, 1.6, 1.4, C.accent2, { r: 0.12 })
    icon(s, 'api', 4.2, 1.85, 0.5, 'ink')
    T(s, 'Bridge v1\n＋ manifest', { x: 3.65, y: 2.4, w: 1.6, h: 0.65, fontSize: 11.5, bold: true, color: C.text1, align: 'center', margin: 0 })
    arrow(s, 3.52, 2.45, 3.62, 2.45, { color: C.accent2, width: 2.5, both: true })
    arrow(s, 5.27, 2.45, 5.4, 2.45, { color: C.accent2, width: 2.5, both: true })
    box(s, 5.45, 1.0, 2.5, 3.25, C.accent1, { r: 0.12 })
    T(s, 'AI 面（DSH）', { x: 5.45, y: 1.05, w: 2.5, h: 0.34, fontSize: 11, bold: true, color: C.background1, align: 'center', margin: 0 })
    ;['会話', 'AI 社員の設定', 'チャットの接続', '自動タスクの台帳', '長期記憶'].forEach((t, i) => {
      icon(s, 'check', 5.62, 1.55 + i * 0.5, 0.26, 'w')
      T(s, t, { x: 5.95, y: 1.5 + i * 0.5, w: 1.95, h: 0.38, fontSize: 10.5, color: C.background1, valign: 'middle', margin: 0 })
    })
    arrow(s, 8.0, 2.45, 8.25, 2.45, { color: C.accent1, width: 2.5, both: true })
    box(s, 8.3, 1.0, 1.2, 3.25, C.background1, { line: C.accent1, r: 0.12 })
    T(s, 'チャット', { x: 8.3, y: 1.05, w: 1.2, h: 0.34, fontSize: 11, bold: true, color: C.text2, align: 'center', margin: 0 })
    T(s, 'Slack\nLINE\nTeams\nWeCom\nWeChat\nLark\n…', { x: 8.35, y: 1.45, w: 1.1, h: 2.7, fontSize: 10, color: C.text1, align: 'center', margin: 0 })
    T(s, 'AI 面は業務データを持たない。必要なときに本人の委託でツールから最新の値を読む。', { x: 0.5, y: 4.4, w: 9, h: 0.38, fontSize: 12.5, bold: true, color: C.accent3, align: 'center', valign: 'middle' })
    s.addNotes('業務面は業務システムで、業務データ・職員と役割・規則・承認・金額・監査・受信者・プロフィール・マニュアルの索引を持つ唯一の正本です。AI 面は DSH という AI 実行基盤で、会話・AI 社員の設定・チャットの接続・自動タスクの台帳・長期記憶を持ちます。業務データは持たず、必要なときに本人の委託でツールから最新の値を読みます。2 つの面は、版の付いた HTTP プロトコル Bridge v1 と、機械が読める自己紹介 manifest でつながります。')
  }
  {
    const s = content(P1, '5 つの層')
    table(s, [
      ['層', '部品', '役割'],
      ['L1 protocol', '@dsh-bridge/protocol', 'Bridge v1 の OpenAPI 3.1、manifest と event の JSON Schema、検証ライブラリ、bridge-validate CLI、適合性テスト（52 項目）'],
      ['L2 server-kit', '@dsh-bridge/server-kit', '業務システム側の Node.js 部品。連携コード・委託・outbox・通知・承認・報告・提案・manifest 配信・個人情報の検査・マニュアル・プロフィール・外部連携・添付。業務が書くのは hooks だけ'],
      ['L3 AI 面', '@dsh-bridge/dsh-core＋9 プラグイン', 'アプリの登録、業務 API クライアント、委託のキャッシュ、ツールの部品、AI 秘書の文面の枠、送信の検査。業務固有の語は manifest と設定で受け取る'],
      ['L4 Web', '@dsh-bridge/gateway・web-kit', '業務 Web の BFF から DSH への認証付きゲートウェイと、React の画面部品'],
      ['L5 adapter', '各業務システム', 'manifest、hooks（または既存 API の別名）、手書きのツール・文面のモジュール、承認・提案の画面'],
    ], { y: 1.0, colW: [1.35, 2.5, 5.15], fontSize: 10.5, rowH: 0.55 })
    T(s, '依存の向き：L5 → L3 / L2 → L1。L3 は L2 を知らない（HTTP の Bridge v1 だけで話す）ため、業務システムは Node.js でなくてもよい。', { x: 0.5, y: 4.5, w: 9, h: 0.5, fontSize: 11, bold: true, color: C.accent1 })
    s.addNotes('部品は 5 つの層に分かれます。L1 はプロトコルの仕様・検証・適合性テスト、L2 は業務システム側の Node.js 部品、L3 は AI 面の中核と 9 つのプラグイン、L4 は業務 Web への組み込み、L5 は各業務システムの adapter です。L3 は L2 を知らず HTTP だけで話すので、業務システムは Node.js でなくても、Bridge v1 を実装して適合性テストを通せばつながります。周辺に、マニュアル検索の help、共通ログ形式の telemetry、テスト用のモック、DSH の製品設定の雛形があります。')
  }
  {
    const s = content(P1, 'AI 面の 9 つのプラグイン')
    const pl = [
      ['ok', 'identity', '連携コード・アクセス判定・ボットごとの照会・答えのリンクの検査'],
      ['key', 'tools', '委託の関門・委託の分類・手書きツール・外部連携ツール'],
      ['outbox', 'events', 'event の取り込み・振り分け・playbook の配備'],
      ['bell', 'notify', '規則ベースの通知・まとめ送信・おやすみ時間・定時報告'],
      ['tap', 'approvals', '承認カード・ボタンと返信コード・1 人の決定で確定'],
      ['web', 'assistant', '業務 Web の AI アシスタントのパネル・添付'],
      ['brain', 'memory', '個人・組織・会話の振り返りの長期記憶'],
      ['user', 'persona', 'AI 社員の呼び名・口調・会社の紹介'],
      ['scan', 'reader', 'スキャン文書をモデルで書き写す'],
    ]
    pl.forEach(([ic, t, d], i) => card(s, 0.5 + (i % 3) * 3.05, 1.0 + Math.floor(i / 3) * 1.25, 2.85, 1.13, ic, `bridge-${t}`, d, { size: 9, titleSize: 12 }))
    s.addNotes('AI 面には 9 つのプラグインがあります。identity は連携とアクセス判定、tools は委託の関門とツール、events は event の取り込みと振り分け、notify は規則ベースの通知と定時報告、approvals は承認カード、assistant は業務 Web のパネル、memory は長期記憶、persona は AI 社員のプロフィール、reader はスキャン文書の読み取りです。このほか、実績のある IM・自動タスク・定時実行の部品に、業務システムとの接続に必要な機能を足したものを同梱しています。')
  }
  {
    const s = content(P1, '業務 Web への組み込み：BFF・gateway・web-kit')
    box(s, 0.5, 1.0, 1.5, 0.95, C.background2, { line: C.accent5, r: 0.1 })
    icon(s, 'person', 0.62, 1.25, 0.42, 'dark')
    T(s, 'ブラウザ\n（職員）', { x: 1.08, y: 1.0, w: 0.9, h: 0.95, fontSize: 10.5, bold: true, color: C.text2, valign: 'middle', margin: 0 })
    arrow(s, 2.05, 1.47, 2.55, 1.47, { color: C.accent1, width: 2.5 })
    T(s, '本人の\ncookie', { x: 2.0, y: 1.55, w: 0.6, h: 0.4, fontSize: 8, color: C.accent1, align: 'center', margin: 0 })
    box(s, 2.6, 1.0, 1.9, 0.95, C.accent6, { r: 0.1 })
    T(s, '業務 Web の BFF', { x: 2.6, y: 1.0, w: 1.9, h: 0.95, fontSize: 12, bold: true, color: C.background1, align: 'center', valign: 'middle', margin: 0 })
    arrow(s, 4.55, 1.2, 5.85, 1.2, { color: C.accent1, width: 2 })
    T(s, '許可リストの RPC・/dsh/*（管理者）', { x: 4.55, y: 1.25, w: 1.3, h: 0.45, fontSize: 7.5, color: C.accent1, margin: 0 })
    box(s, 5.9, 0.95, 1.4, 0.55, C.accent1, { r: 0.1 })
    T(s, 'gateway', { x: 5.9, y: 0.95, w: 1.4, h: 0.55, fontSize: 11.5, bold: true, color: C.background1, align: 'center', valign: 'middle', margin: 0 })
    arrow(s, 7.35, 1.22, 7.85, 1.22, { color: C.accent1, width: 2 })
    box(s, 7.9, 0.95, 1.6, 0.55, C.text2, { r: 0.1 })
    T(s, 'DSH', { x: 7.9, y: 0.95, w: 1.6, h: 0.55, fontSize: 11.5, bold: true, color: C.background1, align: 'center', valign: 'middle', margin: 0 })
    arrow(s, 4.55, 1.8, 7.85, 2.0, { color: C.accent2, width: 2 })
    T(s, '/bridge/v1/me/*（本人の cookie のまま・秘密なし）', { x: 4.6, y: 2.0, w: 3.2, h: 0.3, fontSize: 8, color: C.accent2, margin: 0 })
    box(s, 7.9, 1.7, 1.6, 0.6, C.accent2, { r: 0.1 })
    T(s, '業務システム', { x: 7.9, y: 1.7, w: 1.6, h: 0.6, fontSize: 11, bold: true, color: C.text1, align: 'center', valign: 'middle', margin: 0 })
    const pts = [
      ['lock', 'gateway の守り', 'DSH の設定画面は BFF が許した人（通常は管理者）だけ。ブラウザの cookie・認証ヘッダ・サービストークンは DSH に転送しない。RPC は許可リスト必須（空なら全部拒否）'],
      ['key', 'BFF の秘密', 'x-bff-secret は BFF 自身の呼び出し（アシスタントのチケット・添付の変換・本人のボットの登録）だけに付ける。ブラウザの要求には付けない'],
      ['web', 'web-kit の画面', 'SNS 連携（本人のボット・連携コード・連携の一覧・通知設定）、組織のボットの接続、AI 社員の設定、外部連携、添付の選択と安全な Markdown'],
    ]
    pts.forEach(([ic, t, d], i) => card(s, 0.5 + i * 3.05, 2.6, 2.85, 2.05, ic, t, d, { size: 9 }))
    s.addNotes('業務 Web には BFF（業務 Web のサーバ側）を置きます。ブラウザから業務システムへの本人の要求は、本人の cookie のまま秘密を付けずに転送します。BFF の秘密は BFF 自身がサーバ側で組み立てる呼び出しにだけ付けます。gateway は DSH への認証付きの入口で、DSH の設定画面は管理者だけに見せ、サーバ側の RPC は許可リストにあるものだけを通します。画面は web-kit の React 部品で、SNS 連携、組織のボットの接続、AI 社員の設定、外部連携などを用意しています。')
  }
  {
    const s = content(P1, 'デプロイの形と前提')
    table(s, [
      ['項目', '内容'],
      ['AI 面', '1 つの DSH に複数の業務アプリケーションを載せるのが推奨（個人 WeChat のボットは 1 つの DSH にしか載せられないため）'],
      ['DSH の置き方', '隔離した作業場所で動かす（インストーラは個人の設定フォルダを拒否）。管理用トークンはブラウザに渡さず gateway だけが使う、または BFF の子プロセスとして起動'],
      ['業務側の Bridge v1', 'stateless な HTTP。セッション・回数制限・コード・委託・event はすべて PostgreSQL に置くので、台数を増やせる'],
      ['ランタイム', 'Node.js 22.19 以上（24 で検証）。server-kit を使う場合は PostgreSQL'],
      ['外部サービス', 'AI モデルの API（DSH が利用。提供元は導入先が選ぶ）、使うチャットのボット（組織のボット・個人ボット）'],
      ['製品設定（profile）', '雛形を写して使う。送信の設定は閉じた値で出荷。雛形のテストと検査スクリプトで確かめる'],
    ], { y: 1.0, colW: [2.0, 7.0], fontSize: 10.5, rowH: 0.52 })
    s.addNotes('AI 面は 1 つの DSH に複数の業務アプリケーションを載せる形を推奨します。DSH は隔離した作業場所で動かし、管理用のトークンはブラウザに渡しません。業務側の Bridge v1 は stateless な HTTP で、状態はすべて PostgreSQL にあるので台数を増やせます。ランタイムは Node.js 22.19 以上です。DSH の製品設定は雛形を写して使い、送信の設定は閉じた値のまま出荷されます。')
  }

  // ── プロトコル ─────────────────────────────────────────────────────────
  pres.addSection({ title: P2 })
  divider(P2, '第 2 部\nBridge v1 と\nmanifest', '業務面と AI 面の約束：\n誰として呼び、何ができ、何ができないか')
  {
    const s = content(P2, 'プロトコルの原則と、4 つの主体')
    table(s, [
      ['原則', '内容'],
      ['形式・版', 'HTTP + JSON、/bridge/v1/*。すべての応答に bridge-protocol: 1。v1 の中では足すだけ'],
      ['エラー', '{ ok: false, error: <lower_snake_case> }。コードは安定した識別子（項目名を埋め込まない）'],
      ['仕様', 'OpenAPI 3.1。他の言語の実装はこれに従い、適合性テストで確かめる。既存の API は別名で載せられる'],
    ], { y: 1.0, colW: [1.5, 7.5], fontSize: 10.5, rowH: 0.4 })
    table(s, [
      ['主体', '誰', 'できること'],
      ['サービス', 'DSH', '身元の照会・委託の発行・event・通知の解決・承認カード・manifest。業務データは読めない'],
      ['委託', 'AI 社員（職員の代わり・最長 5 分）', '本人の役割で許された読取（GET）と提案だけ。書込み・承認・確定は 403'],
      ['職員のセッション', '業務 Web を使う本人', '連携コードの発行・自分の連携・通知設定・提案の採否・承認'],
      ['BFF', '業務 Web のサーバ', 'アシスタントのチケット・添付の変換・本人のボットの登録'],
    ], { y: 2.75, colW: [1.5, 2.6, 4.9], fontSize: 10.5, rowH: 0.4 })
    s.addNotes('Bridge v1 は HTTP と JSON のプロトコルで、すべての応答に版のヘッダが付きます。v1 の中では足すだけで、意味の変更や削除は v2 で行います。エラーは決まった形で、コードは安定した識別子です。呼び出す主体は 4 つで、サービス（DSH）、委託（職員の代わりの AI 社員）、職員のセッション、BFF です。委託でできるのは、本人の役割で許された読取と提案だけです。')
  }
  {
    const s = content(P2, 'エンドポイント（必須）')
    table(s, [
      ['区分', '主な操作', '内容'],
      ['基本', 'GET /health・GET /manifest', '死活と版、manifest（etag / 304）'],
      ['身元', '/identity・/identities/link・/me/link-codes・/me/identities', '発信元から職員を引く、連携コードの発行と連携、本人の連携の一覧と解除'],
      ['個人ボット', '/me/personal-bots', '本人のボットの登録（BFF だけ）と一覧'],
      ['委託', 'POST /delegations', 'サービスだけ。AI 許可リスト ∩ 職員の役割、最長 5 分'],
      ['アシスタント', '/assistant/tickets・/assistant/delegations', 'Web セッションに結び付いたチケット（30 分）を委託に交換'],
      ['event', 'GET /events?after=&limit=', 'outbox の取り込み（id は commit 順に増加）'],
      ['通知', '/notifications/for-event/{id}・/notifications/deliveries・/me/notification-preferences', '受信者と文面の材料、配信結果、本人の通知設定'],
      ['承認', '/approvals/{id}/deliveries・…/im-decision・/approvals/im-decisions', 'カードの材料と送付の記録、チャットからの決定（本人照合・1 回）'],
      ['提案', 'POST /proposals・/proposals/{id}/accept・/reject', 'AI の提案（pending_review）、人の採否（1 回）'],
      ['報告', 'GET /reports/latest・POST /reports/run', '件数だけの定時報告、管理者による即時実行'],
    ], { y: 1.0, colW: [1.3, 4.0, 3.7], fontSize: 9.5, rowH: 0.35 })
    s.addNotes('必須のエンドポイントです。基本、身元、個人ボット、委託、アシスタント、event、通知、承認、提案、報告の各区分があり、いずれも適合性テストの対象です。業務で承認や報告を使う予定が無くても、適合性テストを skip 無しで通すため最小の形で持ちます。')
  }
  {
    const s = content(P2, 'エンドポイント（任意の機能）')
    table(s, [
      ['機能', '操作', '内容'],
      ['マニュアル', '/help/search・/help/public・/help/sections/{id}', '役割で並べた検索、未連携の人向けの公開の節'],
      ['個人情報の検査', 'POST /pii-scan', '名簿に基づく検査。当たった区分だけを返す'],
      ['AI 社員のプロフィール', 'GET /ai-profile・/admin/ai-profile・版の復元', '呼び名・口調などの配信（etag）と管理'],
      ['添付', '/assistant/attachments/prepare・添付の設定', 'アシスタントへの添付の検査と文字への変換'],
      ['文書の読み取り', 'GET /document-reads・POST …/{id}/result', 'スキャン文書を AI が書き写す'],
      ['外部連携', '/connectors/catalog・…/operations/{op}/run・/admin/connectors*', '接続先と操作の一覧、読む操作の実行、管理者による登録・秘密・接続テスト・規則・実行履歴'],
      ['統計', 'GET /identities/stats', '連携の件数だけ'],
    ], { y: 1.0, colW: [1.9, 3.6, 3.5], fontSize: 10, rowH: 0.45 })
    s.addNotes('任意の機能は、使うものだけ実装します。マニュアル検索、名簿に基づく個人情報の検査、AI 社員のプロフィール、アシスタントへの添付、スキャン文書の読み取り、外部連携などです。server-kit を使う場合、多くは既定で用意されています。')
  }
  {
    const s = content(P2, 'manifest：業務システムの自己紹介')
    table(s, [
      ['セクション', '書くこと'],
      ['system', 'id（= DSH でのアプリ id）・名前・言語・タイムゾーン'],
      ['roles', '役割と AI に任せる範囲（none / read / propose）'],
      ['entities・glossary', '業務の対象と用語（AI の語彙）'],
      ['tools', 'AI が使える読取の操作（GET）と使える役割'],
      ['proposals', 'AI が出せる提案の種類と扱える役割'],
      ['events', 'event の型と payload の許可リスト'],
      ['templates・notify', '通知の文面（意図・引数は数値と日付）と送り方'],
      ['playbooks', 'event で AI 社員を起こす自動タスク'],
      ['reports', '定時報告のセクション・時刻・役割'],
      ['help・web.routes', 'マニュアル検索・業務 Web の画面の経路'],
    ], { x: 0.5, y: 1.0, w: 4.6, colW: [1.55, 3.05], fontSize: 9.5, rowH: 0.33 })
    code(s, 5.3, 1.0, 4.2, 3.65, [
      'bridge: 1',
      'version: 2026-11-01',
      'system: { id: order-desk, name: 受注管理,',
      '          locale: ja-JP, timezone: Asia/Tokyo }',
      'roles:',
      '  - { id: staff,   delegation: read }',
      '  - { id: manager, delegation: propose }',
      'tools:',
      '  - name: order_overdue_list',
      '    http: { method: GET, path: /api/orders/overdue }',
      '    roles: [staff, manager]',
      'proposals:',
      '  - { kind: reschedule_delivery, roles: [manager] }',
      'events:',
      '  order.overdue:',
      '    payload: { orderId: string, dueDate: date,',
      '               count: integer }',
      '# 説明用の簡略版（実際の項目は JSON Schema に従う）',
    ].join('\n'), 8.5)
    s.addNotes('manifest は業務システムが自分を説明する YAML です。役割と AI に任せる範囲、AI が使える読取の操作、出せる提案、event の型と payload の許可リスト、通知の文面、自動タスク、定時報告、マニュアル検索と画面の経路を書きます。DSH はこれを読んで AI 社員の語彙・ツール・通知・自動タスクを組み立てます。bridge-validate の strict モードで、スキーマ・相互参照・個人情報らしいキーを検証します。右は説明用の簡略版です。')
  }

  // ── 主な流れ ───────────────────────────────────────────────────────────
  pres.addSection({ title: P3 })
  divider(P3, '第 3 部\n主な流れ', '連携・質問・通知・承認・提案・自動タスク・定時報告・\nパネル・マニュアル・文書・外部連携・人柄と記憶')
  {
    const s = content(P3, 'SNS 連携：本人だけが、自分の SNS を結び付ける')
    chain(s, [['web', '業務 Web で\nコードを発行', C.accent6], ['key', '6 桁・10 分\n1 回限り'], ['chat', 'ボットに\n「連携 123456」'], ['ok', '発行した本人に\n連携', C.accent4]], 0.5, 1.0, 9.0, 0.72, { size: 10.5 })
    bullets(s, 0.6, 2.35, 8.8, [
      'コードは発行した本人に結び付く（本文の userId は使わない）。新しいコードで古いコードは無効',
      '誤った試行は発信元ごとに 10 分 5 回まで（超えると 429）。グループ会話では受け付けない',
      '他人の SNS を連携・解除する操作は存在しない（管理者を含む）。自分の連携だけを見て解除できる',
      '連携の解除・職員の無効化・Web セッションの終了で、その人の委託はすぐに無効',
      'email は差出人を検証できないため通知だけ（連携・AI の利用・承認は不可）',
    ], { step: 0.46, size: 11 })
    s.addNotes('職員は業務 Web で自分の連携コードを発行し、そのアプリのボットに「連携」とコードを送ります。コードは発行した本人に結び付き、10 分・1 回限りです。管理者を含め、他人の SNS を連携・解除する操作はそもそも存在しません。連携の解除、職員の無効化、Web セッションの終了で、委託はすぐに無効になります。email は差出人を検証できないので通知だけに使います。')
  }
  {
    const s = content(P3, '質問と委託：AI 社員は本人の権限で読む')
    chain(s, [['chat', '職員が質問', C.accent6], ['ok', '身元の照会'], ['key', '委託を取得\n（最長 5 分）'], ['search', '本人の範囲で\n読む'], ['qa', '本人の 1:1 に\n答える', C.accent4]], 0.5, 1.0, 9.0, 0.72, { size: 10.5 })
    box(s, 0.5, 2.35, 4.4, 2.3, C.background2, { line: C.accent1, r: 0.12 })
    T(s, '委託 ＝ AI 許可リスト ∩ 職員の役割', { x: 0.65, y: 2.45, w: 4.1, h: 0.4, fontSize: 13, bold: true, color: C.accent1, margin: 0 })
    T(s, '・AI 許可リストは manifest の tools と roles\n・AI がその職員本人より強くなることはない\n・(アプリ, 発信元) ごとにキャッシュ、期限の 30 秒前に再取得\n・未連携の発信者には linked:false 以外何も返らない', { x: 0.65, y: 2.9, w: 4.15, h: 1.7, fontSize: 10.5, color: C.text1, margin: 0, paraSpaceAfter: 3 })
    box(s, 5.1, 2.35, 4.4, 2.3, 'FBEDEA', { line: C.accent3, r: 0.12 })
    T(s, '委託でできないこと', { x: 5.25, y: 2.45, w: 4.1, h: 0.4, fontSize: 13, bold: true, color: C.accent3, margin: 0 })
    T(s, '・業務の書込み・承認・確定（403 delegation_not_permitted）\n・役割に無い種類の提案（403 role_not_permitted）\n・サービス専用・職員専用の操作\n・他のアプリケーションへの利用', { x: 5.25, y: 2.9, w: 4.15, h: 1.7, fontSize: 10.5, color: C.text1, margin: 0, paraSpaceAfter: 3 })
    s.addNotes('職員がチャットで質問すると、identity が発信元で身元を照会し、AI 社員がツールを使うときに tools が業務システムから委託を取得します。委託は AI 許可リストと職員の役割の共通部分で、最長 5 分です。AI がその職員本人より強くなることはありません。委託でできるのは読取と提案だけで、書込み・承認・確定、役割に無い提案、他のアプリケーションへの利用はできません。')
  }
  {
    const s = content(P3, '業務の変化 → 通知：outbox と規則ベースの通知')
    chain(s, [['database', '業務の行＋event\n（同じ tx）', C.accent6], ['outbox', 'outbox\nID・日付・件数'], ['sync', 'events\n少なくとも 1 回'], ['owner', '業務システムが\n受信者を解決', C.accent2], ['bell', 'notify\nまとめ・おやすみ'], ['chat', '本人の 1:1', C.accent4]].map(([a, b, c]) => [a === 'database' ? 'storage' : a, b, c]), 0.5, 1.0, 9.0, 0.66, { size: 9.5 })
    const cards = [
      ['outbox', 'transactional outbox', 'event の id は commit 順に増加し、取り込みが飛ばさない。未宣言の型・許可外のキー・個人情報らしい値は書込み時に拒否'],
      ['sync', '取り込み', '成功した event までだけカーソルを進める。失敗は指数バックオフ、上限で dead letter'],
      ['owner', '受信者の解決', '業務システムが受信者・本人の設定・文面の材料を返す。不要になれば stale'],
      ['bell', '送り方', '15 秒〜2 分のまとめ送信、定期のまとめ、おやすみ時間、配信先の優先順位、冪等な送信、送れない理由の記録'],
    ]
    cards.forEach(([ic, t, d], i) => card(s, 0.5 + (i % 2) * 4.6, 2.12 + Math.floor(i / 2) * 1.36, 4.4, 1.28, ic, t, d, { size: 9 }))
    s.addNotes('業務システムは業務の行と event を同じトランザクションで outbox に書きます。event の中身は型ごとの許可リストにある ID・日付・件数・状態だけです。events プラグインが少なくとも 1 回の保証で取り込み、notify が業務システムに受信者を解決させます。プラグインが決めるのは、いつ・どのボットで・何通に分けて・どの文面で送るかだけです。モデルが止まっていても届く経路で、承認・期限超過・安否など必ず届けたいものに使います。')
  }
  {
    const s = content(P3, 'AI 秘書の文面：見出しで、何をすべきかが分かる')
    const labels = [['【ご報告】', '読むだけ', C.accent1], ['【対応のお願い】', '対応してほしい', C.accent2], ['【至急】', 'すぐ対応', C.accent3], ['【承認のお願い】', '決めてほしい', C.accent6], ['【ご相談】', '意見がほしい', C.accent4], ['【定時のご報告】', '朝夕のまとめ', C.text2]]
    labels.forEach(([l, d, c], i) => {
      const y = 1.0 + i * 0.6
      box(s, 0.5, y, 2.2, 0.48, C.background1, { line: c, r: 0.08 })
      T(s, l, { x: 0.55, y, w: 2.1, h: 0.48, fontSize: 11.5, bold: true, color: c, align: 'center', valign: 'middle', margin: 0 })
      T(s, d, { x: 2.8, y, w: 1.6, h: 0.48, fontSize: 11, color: C.text1, valign: 'middle', margin: 0 })
    })
    message(s, 4.7, 1.0, 4.8, 2.3, '【対応のお願い】出荷期限の超過', C.accent2, 'お疲れさまです。出荷期限を過ぎた受注が 3 件あります。\n▶ お願いしたいこと：業務 Web の「受注」で確認し、出荷日を更新してください。\nhttps://…/orders?filter=overdue\n— さくら（受注管理 AI 秘書）')
    bullets(s, 4.75, 3.5, 4.75, ['1 行目のラベル・あいさつ（名前は使わない）', '事実は件数と日付だけ・お願い・リンク・署名', '文面の引数は数値と日付だけ（自由文字列の型が無い）'], { step: 0.38, size: 10 })
    s.addNotes('AI 社員が送るメッセージには決まった枠があります。1 行目のラベルで、読むだけなのか、対応が必要なのか、急ぎなのか、承認なのかが一目で分かります。あいさつ、事実（件数と日付だけ）、お願いしたいこと、リンク、署名が続きます。文面の引数は数値と日付だけで、自由な文字列を入れる型がないため、名前などの個人情報が入りません。右はすべて架空の例です。')
  }
  {
    const s = content(P3, '承認と提案：決めるのは人、1 回だけ')
    card(s, 0.5, 1.0, 4.4, 3.65, 'tap', '承認カード', '・承認できる人ごとに 1 枚。ボタンの無いチャットでは返信コード\n・誰か 1 人が決めると他のカードはすべて無効（1 回で確定）\n・返信コードを 5 回誤るとロック、再発行しない\n・Web で決めるときも同じ規則関数（mayDecide）を使い、チャットのカードを無効に\n・カードの項目（ID・金額・期限）は業務システムが決める。AI は名前・金額を足さない', { size: 9.5 })
    card(s, 5.1, 1.0, 4.4, 3.65, 'plan', 'AI の提案', '・AI は読取ツールで確かめ、提案ツールで POST /proposals（pending_review）\n・職員の役割がその種類を扱えるときだけ受け付ける\n・AI は自分の提案を採用も却下もできない\n・採用は人が 1 回だけ。採用されたときだけ業務システムの apply が書込む\n・確定・承認・発行・支払・金額の決定は AI にはできない', { size: 9.5, line: C.accent4, iconColor: 'green' })
    s.addNotes('承認カードは、承認できる人ごとに 1 枚届き、誰か 1 人が決めると他のカードはすべて無効になります。返信コードを誤り続けるとカードはロックされます。Web で承認するときも同じ規則を使います。AI の提案は pending_review として業務システムに入り、人が 1 回だけ採否を決めます。採用されたときだけ業務システムが書込みます。')
  }
  {
    const s = content(P3, '自動タスク：event で起こし、提案だけを行う')
    chain(s, [['event', 'event', C.accent6], ['robot', 'playbook が\nAI 社員を起こす'], ['search', '読取で確かめる'], ['plan', '必要なら提案'], ['bell', '受信者に 1 通\n（固定の文面）', C.accent4]], 0.5, 1.0, 9.0, 0.7, { size: 10 })
    table(s, [
      ['仕組み', '内容'],
      ['受信者', '起動した event の受信者（業務システムが解決した人）だけ。決まらなければ送らない'],
      ['本文', 'AI の自由文ではなく固定の文面にできる（タスク名・業務 Web で確認・リンク）'],
      ['委託の分類', '無人のタスクは既定で拒否。仕事の種類ごとに運用者が委託する職員を指定（例：請求の分類は経理の責任者）'],
      ['回ごとの本人', '<分類>=each なら、回ごとにその event の本人の委託で動く（導入先の同意と業務システムの規則が必要）'],
      ['配備と重複', 'playbook は無効の状態で配備し、運用者が id を指定して有効化。同じ event では 1 回だけ'],
    ], { y: 2.2, colW: [1.6, 7.4], fontSize: 10, rowH: 0.42 })
    s.addNotes('manifest の playbook が event で AI 社員を起こします。AI は読取ツールで現在の状態を確かめ、何も無ければ静かに終わり、必要なら提案して 1 通だけ報告します。報告は event の受信者にだけ届き、本文は固定の文面にできます。無人のタスクは既定で拒否で、運用者が仕事の種類ごとに委託する職員を指定します。回ごとにその event の本人の委託で動かす方法もあります。')
  }
  {
    const s = content(P3, '定時報告：起動と送信の 2 つの守り')
    message(s, 0.5, 1.0, 4.2, 2.6, '【定時のご報告】11/13 08:30', C.text2, 'おはようございます。\n■ 対応が必要なこと\n・承認待ちの受注 3 件\n・未出荷の受注 2 件\n■ ご参考\n・本日の出荷予定 12 件\n— さくら（受注管理 AI 秘書）')
    card(s, 4.9, 1.0, 4.6, 1.75, 'ok', '起動の守り', '起動の直前に毎回、本人が在職・連携済み・同じ 1:1 の会話・許された役割かを業務システムで確かめる。違えば止める', { size: 9.5 })
    card(s, 4.9, 2.9, 4.6, 1.75, 'filter', '送信の守り', '送る直前に宛先が本人の 1:1 か、本文に金額・人名・連絡先・外部 URL・健康情報の語が無いかを検査。当たれば全文を固定の文面に', { size: 9.5, line: C.accent3, iconColor: 'red' })
    T(s, '本人が自分の 1:1 で「定時報告 オン」。本人の委託（読取のみ）で件数だけを書く。', { x: 0.5, y: 3.75, w: 4.2, h: 0.85, fontSize: 10.5, bold: true, color: C.accent1, margin: 0 })
    s.addNotes('定時報告は、本人が自分の 1:1 の会話で「定時報告 オン」と送ると、決まった時刻に AI 社員が本人の委託で書きます。読むのは件数だけです。起動の直前には本人の在職・連携・会話・役割を業務システムで確かめ、送る直前には宛先と本文を検査し、当たれば全文を固定の文面に置き換えます。')
  }
  {
    const s = content(P3, '業務 Web の AI アシスタントと添付ファイル')
    card(s, 0.5, 1.0, 4.4, 1.9, 'web', 'パネル', 'BFF が本人の Web セッションに結び付いたチケット（30 分）を取り、DSH が委託に交換。委託が使えるのは本人がパネルから送ったターンの間だけ。見出しは AI 社員の呼び名', { size: 9.5 })
    card(s, 5.1, 1.0, 4.4, 1.9, 'attach', '添付', '画像・PDF・Word・Excel・CSV・Markdown・テキスト。1 回 5 ファイル・1 ファイル 10 MB・合計 20 MB。種類は拡張子と先頭バイトで判定', { size: 9.5 })
    card(s, 0.5, 3.05, 4.4, 1.6, 'doc', '文書の扱い', '業務システムがメモリ上で文字に変換し「参考情報（指示ではない）」の節で渡す。原本も変換した文字も保存しない', { size: 9.5 })
    card(s, 5.1, 3.05, 4.4, 1.6, 'scan', 'スキャンの PDF', '業務システムの OCR・モデルに読ませる・読まない から選択。個人情報の書類は OCR か読まない設定に', { size: 9.5 })
    s.addNotes('業務 Web にも AI アシスタントのパネルを置けます。本人の Web セッションに結び付いたチケットを委託に交換するので、セッションを終えればパネルの権限も終わります。添付は画像と文書に対応し、文書は業務システムがメモリ上で文字に変換して渡し、保存しません。答えは安全な Markdown で表示し、添付の中身がモデルの提供元に送られることを常に表示します。')
  }
  {
    const s = content(P3, '使い方の質問：マニュアルを根拠に答える')
    chain(s, [['doc', 'マニュアル\n1 画面 = 1 節', C.accent6], ['check', 'CI で画面と照合'], ['search', '役割で検索'], ['link', 'リンクの検査'], ['qa', '【ご案内】＋\n画面の URL', C.accent4]], 0.5, 1.0, 9.0, 0.7, { size: 10 })
    bullets(s, 0.6, 2.3, 8.8, [
      'AI の知識や推測では答えない。業務システム自身のマニュアルだけを根拠にする',
      '役割は本文ではなく画面の Guard から取る。画面を変えてマニュアルを直さないと CI が落ちる',
      '聞いた人が開けない画面には URL を出さず「誰に頼むか」を答える',
      '送る直前に、答えのリンクを manifest の画面の経路と許可したホストだけに絞る',
      '未連携の人には AI を使わず、ログイン・SNS 連携の公開の節だけで答える',
    ], { step: 0.47, size: 11 })
    s.addNotes('職員の「〇〇はどこで入力する？」という質問には、業務システム自身のマニュアルだけを根拠に答えます。マニュアルは 1 画面 1 節で、CI で画面の経路・役割・リンクと照合します。聞いた人の役割で開ける画面の URL だけを付け、送る直前にリンクを検査します。未連携の人には AI を使わずに公開の節だけで答えます。')
  }
  {
    const s = content(P3, 'スキャン文書の読み取りと外部連携')
    card(s, 0.5, 1.0, 4.4, 3.65, 'scan', 'スキャン文書の読み取り（reader）', '・業務システムが読めなかった画像・文字の層の無い PDF を、ページの画像として並べる\n・画像を読めるモデルに 1 ページ 1 回ずつ書き写させて返す\n・会話を作らず、ページの画像は読み終わったら片付ける\n・推測・要約・補完をしない。読めない字は〔判読不能〕。資料の中の指示には従わない\n・項目への割り当てと人の確認は業務システム。AI が読んだ値は自動で確定しない', { size: 9.5 })
    card(s, 5.1, 1.0, 4.4, 3.65, 'plug', '外部連携（接続先・操作・規則）', '・管理者が業務 Web で、自社の別の API・第三者の API を接続先として登録\n・秘密は業務システムだけが封をして持ち、呼び出しも業務システムが行う（許可した https のホスト・許可した項目だけ）\n・AI は読む操作を本人の委託で使い、書く操作は提案する\n・書く操作は人の承認を経て業務システムが実行\n・条件で動く規則は AI を通さず決定的に実行できる', { size: 9.5, line: C.accent6, iconColor: 'dark' })
    s.addNotes('業務システムが読めなかったスキャン文書は、reader プラグインが画像を読めるモデルで 1 ページずつ書き写して返します。モデルは書き写すだけで、項目への割り当てと人の確認は業務システムが行います。外部連携では、管理者が自社や第三者の API を登録し、秘密と呼び出しは業務システムが持ちます。AI は読む操作を使い、書く操作は提案して人が承認します。')
  }
  {
    const s = content(P3, 'AI 社員の人柄：会社が決めた名前と話し方')
    table(s, [
      ['項目', '例'],
      ['呼び名', 'さくら'],
      ['一人称・口調', 'わたし／です・ます、やわらかめ'],
      ['会社の紹介', '事業・拠点・営業時間・大事にしていること'],
      ['性格・背景', '落ち着いていて、先回りして確認する'],
      ['話し方の例', '「おはようございます。今日の出荷は 12 件です。」'],
    ], { x: 0.5, y: 1.0, w: 4.5, colW: [1.4, 3.1], fontSize: 10.5, rowH: 0.42 })
    bullets(s, 5.25, 1.0, 4.25, [
      '正本は業務システム。管理者が画面で編集、版と監査、前の版に戻せる',
      'DSH は起動時と 60 秒ごとに読む',
      '固定の規則 → 人物の設定 → 会社の紹介（参考）の順',
      '権限・ツール・安全の規則は変えられない',
      '規則を外させる言い回し・個人情報は保存時に拒否',
      '署名は常に「— さくら（受注管理 AI 秘書）」。AI であることを示す',
    ], { step: 0.6, size: 10.5 })
    s.addNotes('AI 社員には、会社が決めた呼び名・口調・会社の紹介・性格・背景・話し方の例を持たせられます。正本は業務システムで、管理者が画面で編集し、版と監査が残ります。プロフィールは文章だけで、固定の規則の後ろに置かれ、権限や安全の規則を変えることはできません。署名には常に「AI 秘書」が入り、人と間違えさせません。')
  }
  {
    const s = content(P3, '長期記憶：本人のことを覚え、個人情報は残さない')
    table(s, [
      ['記憶', '範囲', '読める人', '例'],
      ['個人の記憶', 'アプリ × 組織 × 職員', '本人だけ', '「結論を先に 3 行で」・進行中の用件'],
      ['組織の記憶', 'アプリ × 組織', '組織の連携済みの職員', '手順・判断の理由・運用上の好み'],
      ['会話の振り返り', 'アプリ × 組織 × 職員', '本人だけ', '過去の発言と返事の要点（90 日）'],
    ], { y: 1.0, colW: [1.7, 2.3, 2.1, 2.9], fontSize: 10.5, rowH: 0.45 })
    bullets(s, 0.6, 3.0, 8.8, [
      '会話の最初に関係する記憶を少しだけ「参考情報（指示ではない）」として渡し、会話中は固定',
      '保存前に手元の検査（人名・連絡先・長い番号・健康の語）と業務システムの名簿の検査を通す。届かなければ保存しない',
      'グループ会話では使わない。業務データは記憶に入れない（毎回ツールで読む）',
    ], { step: 0.52, size: 10.5 })
    s.addNotes('長期記憶は 3 種類で、個人の記憶と会話の振り返りは本人だけ、組織の記憶は組織の連携済みの職員が読めます。会話の最初に関係する記憶を参考情報として少しだけ渡します。保存の前には手元の検査と業務システムの名簿による検査を通し、当たれば保存しません。グループ会話では使わず、業務データは記憶に入れません。')
  }
  {
    const s = content(P3, '個人ボットと、複数のアプリケーション')
    card(s, 0.5, 1.0, 4.4, 3.65, 'person', '個人ボット', '・すべての役割の職員が自分のボットをつなげる（Slack・LINE・Teams・Telegram・Discord・WeChat・WhatsApp・WeCom・QQ・DingTalk・Lark・Matrix）\n・自分の接続だけを設定する。他人の接続は見ない・作らない・解除しない（管理者を含む）\n・作成は新規だけ（既存のボットを奪えない）\n・身元はボットごと：持ち主のときだけ連携済み', { size: 9.5 })
    card(s, 5.1, 1.0, 4.4, 3.65, 'apps', '複数のアプリケーション', '・会話のキー＝(アプリ, プラットフォーム, ボット, 会話)。会話・記憶・自動タスク・通知はアプリごと\n・どのアプリかはボットで決まる（本文では決めない）\n・個人 WeChat は 1 つの共用ボットで #一覧・#<アプリ名> で切替\n・トークンはアプリをまたがない。ツールは <名前空間>_* で、外のツールは作らない', { size: 9.5, line: C.accent6, iconColor: 'dark' })
    s.addNotes('組織のボットに加えて、すべての職員が自分のボットをつなげます。各職員は自分の接続だけを設定でき、作成は新規だけなので組織や他人のボットを奪えません。1 つの DSH に複数の業務アプリケーションを載せられ、会話・記憶・自動タスク・通知はアプリごとに分かれます。トークンやツールもアプリをまたぎません。')
  }

  // ── 安全 ───────────────────────────────────────────────────────────────
  pres.addSection({ title: P4 })
  divider(P4, '第 4 部\n安全と個人情報', 'プロンプトではなく、\nコードと設定で守る約束')
  {
    const s = content(P4, '受信者の保証：自分に関係するものだけが届く')
    chain(s, [['rule', 'event ごとの規則\n＋ 対象', C.accent6], ['team', '範囲の職員だけ'], ['lock', '1 人ずつの関門\n（Web と同じ判定）', C.accent3], ['report', '件数は見られる\n範囲で'], ['bell', '答えの受信者だけに\n送る', C.accent4]], 0.5, 1.0, 9.0, 0.7, { size: 10 })
    box(s, 0.5, 2.3, 9.0, 1.15, 'E3F1EE', { line: C.accent4, r: 0.12 })
    T(s, [{ text: '業務システムが決める：', options: { bold: true, color: C.accent4 } }, { text: '役割・所属・担当の範囲で受信者を決め、その人が業務 Web で同じ対象を見られるかを 1 人ずつ確かめる。落とした人には送らず、監査に ID と理由の符号だけを残す。範囲が分からなければ誰にも送らない。' }], { x: 0.65, y: 2.35, w: 8.7, h: 1.05, fontSize: 11, valign: 'middle', margin: 0 })
    box(s, 0.5, 3.6, 9.0, 1.05, C.background2, { line: C.accent1, r: 0.12 })
    T(s, [{ text: 'フレームワークは受信者を作らない：', options: { bold: true, color: C.accent1 } }, { text: '答えに挙がった人だけに送り、本人の設定・おやすみ時間・まとめ送信・配信先の優先順位を当てるだけ。モデルが呼べるツールに宛先を指定できるものは残さない。' }], { x: 0.65, y: 3.65, w: 8.7, h: 0.95, fontSize: 11, valign: 'middle', margin: 0 })
    s.addNotes('最も基本の約束は、各役割・各アカウントが自分に関係する業務の知らせだけを受け取ることです。受信者は業務システムが決め、その人が業務 Web で同じ対象を見られるかを 1 人ずつ確かめます。フレームワークは受信者を作らず、AI に宛先を選ばせません。')
  }
  {
    const s = content(P4, 'AI からチャットへ出る経路と、その守り')
    table(s, [
      ['経路', '守り', '製品の既定'],
      ['規則ベースの通知', '受信者は業務システムの答えだけ。email は既定の配信先に入れない', '—'],
      ['自動タスクの報告', '起動した event の受信者だけ。決まらなければ送らない。固定の文面', '代替なし・固定の文面'],
      ['自動タスクの固定の配信先', '固定のボット・会話に回さない', '制限する'],
      ['メール', '任意の宛先への送信・受信の巡回を無くす', '無効'],
      ['定時報告', '起動直前の本人確認、送信直前の宛先と本文の検査', '検査あり・守りが無ければ送らない'],
      ['定時報告以外の業務アラーム', 'チャットへ送らない', '拒否'],
      ['定時実行のモデルツール', '任意の宛先の指定・他人の会話の変更を無くす', '回収だけ'],
      ['グループ会話', 'AI を動かさず固定の案内だけ。業務ツールも拒否', '拒否'],
      ['運用者の固定の結び付け', 'インストーラが受け付けない', '拒否'],
    ], { y: 1.0, colW: [2.5, 4.4, 2.1], fontSize: 9.5, rowH: 0.36 })
    T(s, '上流の既定が開いている部品も、フレームワークの profile の雛形が製品の値で閉じて出荷する（開けるのは明示の opt-in だけ）。', { x: 0.5, y: 4.7, w: 9, h: 0.4, fontSize: 10, bold: true, color: C.accent3 })
    s.addNotes('AI からチャットへ出る経路は 9 つあり、それぞれに守りがあります。上流の部品の既定が開いているものも、フレームワークの profile の雛形が製品の値で閉じて出荷し、雛形のテストで確かめています。開けたいシステムは、その設定を明示して変えます。')
  }
  {
    const s = content(P4, '本文の検査と、閉じた既定（fail closed）')
    card(s, 0.5, 1.0, 4.4, 3.65, 'filter', '本文の検査', '・金額（円・¥）、敬称つきの人名、連絡先（電話・郵便番号・メール）、業務 Web 以外の URL、長すぎる文、健康情報の語（病名・症状・服薬・バイタル・体温）\n・見つけた文字列は返さず、理由の符号だけ\n・当たれば全文を固定の文面に（部分的な伏せ字はしない）\n・限界：語とパターンによる推定。防御の中心は「件数しか読まない・本人の 1:1 だけに送る」構造', { size: 9.5, line: C.accent3, iconColor: 'red' })
    card(s, 5.1, 1.0, 4.4, 3.65, 'lock', '既定で閉じているもの', '・未連携の発信者\n・無人の自動タスクの委託\n・グループ会話\n・定時報告の本文の検査\n・ゲートウェイの RPC（許可リストが空なら全部拒否）\n・event ごとの委託（同意と業務の規則が無ければ拒否）\n・個人ボットの持ち主の規則\n・固定の配信先の指定\n・範囲を決められない受信者', { size: 9.5 })
    s.addNotes('AI の自由文を送る経路では、送る直前に金額、人名、連絡先、外部の URL、健康情報の語などを検査し、当たれば全文を固定の文面に置き換えます。検査には限界があるため、防御の中心は件数しか読まない、本人の 1:1 にしか送らないという構造の方に置いています。判断できないときや設定が無いときは、拒否・送らない側に倒すのが既定です。')
  }
  {
    const s = content(P4, '安全と個人情報の約束（1/2）')
    table(s, [
      ['約束', 'どう守るか'],
      ['本人だけが自分の SNS を連携・解除する', '連携コードは発行者に結び付く。代理連携の操作が無い'],
      ['委託 = AI 許可リスト ∩ 役割、未連携は何も得ない', '委託はサービスだけ・最長 5 分。manifest の tools の roles と一致'],
      ['AI は読む・提案するだけ、人が決める', '委託の書込みは 403。提案は pending_review。採否・承認は人の 1 回'],
      ['event とチャットに個人情報を載せない', '型ごとの payload 許可リスト、文面の引数は数値・日付だけ、個人情報らしいキー・値の拒否、名簿の検査'],
      ['身元は業務システムからだけ', '本文の userId は拒否か無視。チケット・委託トークンからだけ職員を決める'],
      ['業務システムが唯一の正本', 'AI 面は会話だけを持ち、業務データは毎回ツールで読む'],
      ['トークンはアプリをまたがない', '委託のキャッシュは (アプリ, 発信元) ごと。承認の token は発行元にだけ'],
      ['email は通知だけ', '連携・承認・AI の利用は不可'],
    ], { y: 1.0, colW: [3.6, 5.4], fontSize: 10, rowH: 0.43 })
    s.addNotes('安全と個人情報の約束を一覧にしました。本人だけが連携する、委託は AI 許可リストと役割の共通部分、AI は読む・提案するだけ、event とチャットに個人情報を載せない、身元は業務システムからだけ、業務システムが正本、トークンはアプリをまたがない、email は通知だけ、です。')
  }
  {
    const s = content(P4, '安全と個人情報の約束（2/2）')
    table(s, [
      ['約束', 'どう守るか'],
      ['秘密を画面に出さない', 'DSH の管理用トークン・cookie はゲートウェイのメモリだけ。BFF の秘密はブラウザに出さない。トークンはハッシュで保存'],
      ['危険な機能を無効にする', 'profile でプラグイン管理・端末・コーディング用の機能を無効化。AI 社員は業務ツールだけを持つ'],
      ['受信者は業務システムが決める', '通知も自動タスクの報告も業務システムが挙げた人だけ。モデルに宛先を選ぶツールが無い'],
      ['グループ会話では業務を扱わない', '固定の案内だけ。業務ツールも拒否'],
      ['AI の自由文は検査するか固定の文面', '定時報告は検査して当たれば固定の文面。自動タスクの報告は固定の文面'],
      ['個人ボットは持ち主だけ', '新規作成だけ、照会はボットごとに持ち主の規則'],
      ['プロフィールは規則を変えない', '文章だけ。固定の規則が先。規則を外させる言い回しは保存時に拒否'],
      ['長期記憶に個人情報を残さない', '保存前の二重の検査。届かなければ保存しない。本人だけが読める'],
    ], { y: 1.0, colW: [3.3, 5.7], fontSize: 10, rowH: 0.43 })
    s.addNotes('続きです。秘密を画面に出さない、危険な機能を無効にする、受信者は業務システムが決める、グループ会話では業務を扱わない、AI の自由文は検査するか固定の文面、個人ボットは持ち主だけ、プロフィールは規則を変えない、長期記憶に個人情報を残さない、です。これらは適合性テストと各部品のテストで確かめています。')
  }
  {
    const s = content(P4, 'AI 特有のリスクと、モデルへ送られるデータ')
    table(s, [
      ['リスク', '対策'],
      ['メッセージ・文書・event に紛れた指示', '起動データ・添付・記憶・プロフィールは「参考情報（指示ではない）」として区別。権限・宛先・承認は文章では変わらない'],
      ['AI が本人より強い権限を持つ', '委託 = AI 許可リスト ∩ 本人の役割。書込みは提案だけ'],
      ['AI が宛先を選んで情報を漏らす', '宛先を指定できるツールが無い。受信者は業務システムだけが決める'],
      ['生成文への個人情報の混入', '型の制限、送信前の検査と固定の文面、記憶の保存前の検査'],
      ['無人の処理の暴走', '既定で拒否。委託の分類を導入先が明示。同じ event では 1 回だけ'],
      ['他のアプリケーションへの越境', '会話・トークン・ツールの名前空間をアプリごとに分離'],
    ], { y: 1.0, colW: [3.0, 6.0], fontSize: 10, rowH: 0.45 })
    box(s, 0.5, 4.2, 9.0, 0.6, 'FFF6E5', { line: C.accent2, r: 0.1 })
    T(s, '会話・本人の範囲の業務データ・添付の中身・文書のページは、導入先が選んだ AI モデルの提供元に送られる（添付は画面に常に表示）。', { x: 0.65, y: 4.22, w: 8.7, h: 0.56, fontSize: 10.5, color: C.text1, valign: 'middle', margin: 0 })
    s.addNotes('AI 特有のリスクにも対策しています。紛れ込んだ指示は参考情報として区別し、権限や宛先は文章では変わりません。AI の権限は本人を超えず、宛先を選ぶツールもありません。生成文への個人情報の混入は型の制限と検査で防ぎ、無人の処理は既定で拒否です。なお、会話や本人の範囲の業務データなどは、導入先が選んだモデルの提供元に送られます。')
  }

  // ── つなぐ ─────────────────────────────────────────────────────────────
  pres.addSection({ title: P5 })
  divider(P5, '第 5 部\nつなぐ・作る', 'チェックリスト・手順・完了の条件・\n外付けモード・新しく作る・拡張点')
  {
    const s = content(P5, '対応するチャット')
    table(s, [
      ['区分', 'プラットフォーム'],
      ['組織のボット（アプリごと）', 'Slack・LINE・Microsoft Teams・WeCom（企業微信）・個人 WeChat（共用ボットで切替）・Lark（飛書）ほか'],
      ['個人ボット（職員が自分でつなぐ）', 'Slack・LINE・Teams・Telegram・Discord・個人 WeChat・WhatsApp・WeCom・QQ・DingTalk・Lark・Matrix'],
      ['通知だけ', 'email（差出人を検証できないため、連携・承認・AI の利用は不可）'],
    ], { y: 1.0, colW: [2.8, 6.2], fontSize: 11, rowH: 0.6 })
    bullets(s, 0.6, 3.6, 8.8, ['送れない理由（ボット未接続・宛先不正・月間上限など）は理由付きで記録し、黙って捨てない', 'ボタンの有無などプラットフォームの差は AI 秘書の枠と返信コードが吸収する'], { step: 0.5, size: 11 })
    s.addNotes('組織のボットは、Slack、LINE、Teams、WeCom、個人 WeChat、Lark などに対応します。職員が自分でつなぐ個人ボットは 12 のプラットフォームに対応します。email は通知だけに使います。プラットフォームごとの差は AI 秘書の枠と返信コードで吸収し、送れない理由は記録します。')
  }
  {
    const s = content(P5, 'チェックリスト：業務システムに足すもの')
    table(s, [
      ['#', '足すもの', '区分'],
      ['1', '業務データを読む口と、AI の提案を受ける口（Bridge v1 か既存 API の別名）', '必須'],
      ['2', 'manifest（--strict で警告なし）', '必須'],
      ['3', '本人の SNS 連携の画面（システム自身のログインで。別の本人確認は作らない）', '必須'],
      ['4', '通知の受信者を業務システムが決める規則（Web の認可と同じ判定）', '必須'],
      ['5', '状態変化を同じトランザクションで event に（transactional outbox）', '必須'],
      ['6', '職員と役割（有効・無効を含む）を引ける', '必須'],
      ['7', '承認の規則を 1 か所の関数に（Web とチャットで同じ）', '必須'],
      ['8', 'Web のセッションが生きているかを確かめられる', '必須'],
      ['9', '職員向けのマニュアル（1 画面 = 1 節）', '推奨'],
      ['10', '名簿に基づく個人情報の検査', '推奨'],
      ['11', 'AI 社員のプロフィールの編集', '推奨'],
      ['12', '定時報告（件数だけ）', '必須'],
      ['13', '外部連携（接続先・操作・規則）', '任意'],
    ], { y: 1.0, colW: [0.5, 7.4, 1.1], fontSize: 9.5, rowH: 0.29 })
    s.addNotes('既存の業務システムに足すものは 13 項目です。読む口と提案の口、manifest、本人の SNS 連携の画面、受信者の規則、トランザクションでの event、職員と役割、承認の規則、セッションの確認、定時報告が必須です。承認と報告は業務で使わなくても最小の形で持ちます。マニュアル、名簿の検査、プロフィールは推奨、外部連携は任意です。読取 API とログインは作りの根本に関わるので、最初に見積もります。')
  }
  {
    const s = content(P5, '手順（7 ステップ）と完了の条件')
    chain(s, [['doc', 'manifest', C.accent6], ['code', 'hooks'], ['outbox', 'event'], ['check', '適合性 52'], ['settings', 'profile'], ['web', '業務 Web'], ['run', '自動タスク', C.accent4]], 0.5, 1.0, 9.0, 0.66, { size: 10.5 })
    table(s, [
      ['ステップ', '内容'],
      ['1 manifest', '見本から始め、役割・event・文面・ツール・playbook・報告を書き出す。bridge-validate --strict'],
      ['2 hooks', 'authenticate・isSessionLive・employees・recipientsFor・approvals・proposalKinds・reports（任意で piiScan・eventDelegations）。既存 API は別名でも可'],
      ['3 event', '業務のトランザクションの中で emitEvent'],
      ['4 適合性テスト', 'TEST 環境に対して 52 項目。52 / 52・既知の欠落なし・skip なし'],
      ['5 profile', 'アプリとボットを登録。送信の設定は閉じた値のまま。全アプリに業務 Web の URL'],
      ['6 業務 Web', 'SNS 連携・通知設定・承認・提案・AI 社員の設定。BFF の秘密は BFF 自身の呼び出しだけ'],
      ['7 自動タスク', 'playbook を委託の分類付きで有効化'],
    ], { y: 2.1, colW: [1.6, 7.4], fontSize: 9.5, rowH: 0.36 })
    s.addNotes('手順は 7 ステップです。manifest を書き、hooks を実装し、トランザクションで event を書き、適合性テストを通し、DSH の profile に登録し、業務 Web に画面を置き、自動タスクを委託の分類付きで有効にします。完了の条件は、manifest の検証、適合性テスト 52 / 52、業務のテスト、profile の検査をコマンドで判定します。まず 1 つの業務から始め、既存の画面と並行して確かめてから広げます。')
  }
  {
    const s = content(P5, '外付けモード（試行）：コードを変えずにつなぐ')
    box(s, 0.5, 1.0, 1.8, 1.1, C.accent1, { r: 0.1 })
    T(s, 'DSH\n（変わらない）', { x: 0.5, y: 1.0, w: 1.8, h: 1.1, fontSize: 11, bold: true, color: C.background1, align: 'center', valign: 'middle', margin: 0 })
    arrow(s, 2.35, 1.55, 3.1, 1.55, { color: C.accent2, width: 2.5, both: true })
    T(s, 'Bridge v1', { x: 2.3, y: 1.2, w: 0.85, h: 0.3, fontSize: 8.5, bold: true, color: C.accent2, align: 'center', margin: 0 })
    box(s, 3.15, 1.0, 2.6, 1.1, C.accent2, { r: 0.1 })
    T(s, '外付けブリッジ\n（server-kit・bridge_* の表）', { x: 3.15, y: 1.0, w: 2.6, h: 1.1, fontSize: 10.5, bold: true, color: C.text1, align: 'center', valign: 'middle', margin: 0 })
    arrow(s, 5.8, 1.4, 6.55, 1.4, { color: C.accent6, width: 2 })
    arrow(s, 6.55, 1.75, 5.8, 1.75, { color: C.accent6, width: 2 })
    T(s, '上：API（本人として）　下：webhook / CDC', { x: 4.6, y: 2.15, w: 3.4, h: 0.3, fontSize: 9, color: C.accent6, align: 'center', margin: 0 })
    box(s, 6.6, 1.0, 2.9, 1.1, C.background2, { line: C.accent6, r: 0.1 })
    T(s, '既存システム\n（コードは変えない）', { x: 6.6, y: 1.0, w: 2.9, h: 1.1, fontSize: 11, bold: true, color: C.text2, align: 'center', valign: 'middle', margin: 0 })
    table(s, [
      ['既存システムの能力', '無いとき'],
      ['ログインを外から確かめられる（OIDC / SAML の IdP など）', '本人の SNS 連携を満たせず使えない（別のログインは作らない）'],
      ['本人として API を呼べる（利用者ごとの OAuth・トークン交換）', '読取は役割だけで決まる範囲に限り、承認・書込みは使わない'],
      ['変化を知らせる（commit 後の webhook・DB の変更ログ）', '承認など正確さの要る event を出せない'],
      ['承認と書込みの API', '提案の採用とチャットでの承認ができない'],
    ], { y: 2.6, colW: [4.6, 4.4], fontSize: 10, rowH: 0.42 })
    s.addNotes('既存システムのコードに手を入れたくない場合は、外にブリッジ専用のサービスを置く外付けモードがあります。DSH から見ると外付けブリッジが業務システムなので、AI 面は変わりません。使えるかは、ログインを外から確かめられるか、本人として API を呼べるか、変化を知らせられるか、承認と書込みの API があるか、の 4 つで決まります。実システムでの検証はこれからで、試行の段階です。')
  }
  {
    const s = content(P5, '新しい業務システムを作る：ファイルの形')
    code(s, 0.5, 1.0, 5.4, 3.65, [
      'bridge.manifest.yaml   システムの自己紹介',
      'src/config.mjs         環境変数だけ（本番は秘密が必須）',
      'src/auth.mjs           authenticate・isSessionLive',
      'src/domain.mjs         業務の規則・tx + emitEvent',
      'src/hooks.mjs          employees・recipientsFor・',
      '                       approvals・proposalKinds・',
      '                       reports・piiScan',
      'src/routes.mjs         業務 API（AI は readToolPolicy）',
      'src/help.mjs           マニュアル → 索引 → 検索',
      'src/app.mjs            createBridgeApp + migrate',
      'src/migrations/*.sql   業務の表（bridge_* は kit）',
      'manual/NN-*.md         1 画面 = 1 節',
      'test/                  業務・適合性テスト',
      '<product>/dsh-profile/ profile の写し・モジュール',
      'web/, bff/             業務 Web と BFF',
    ].join('\n'), 10)
    bullets(s, 6.1, 1.0, 3.4, [
      'Bridge の部分は server-kit が持つ',
      '業務システムが書くのは業務・hooks・manifest・マニュアル・テスト・画面',
      'フレームワークの中は書き換えない（hooks・モジュール・設定で補う）',
      '役割の名前は自由（テストの fixtures で写す）',
      '見本：設備点検（52 / 52・e2e）',
    ], { step: 0.72, size: 10.5 })
    s.addNotes('新しく作る場合、Bridge の部分は server-kit が持ち、業務システムが書くのは業務そのもの、hooks、manifest、マニュアル、テスト、画面だけです。フレームワークの中は自分のシステムのために書き換えず、足りないところは hooks、ツールや文面のモジュール、設定で補います。見本として、設備点検の業務システムが適合性テスト 52 / 52 と通しの e2e を通っています。')
  }
  {
    const s = content(P5, '拡張点：書き換えずに、足して変える')
    table(s, [
      ['拡張点', '何を足すか'],
      ['ツールのモジュール', '手書きのツール。読取は kit.requestJson だけ、書込みは kit.proposeTool の提案だけ'],
      ['文面のモジュール', '通知の事実の文・意図・お願い。枠（ラベル・あいさつ・署名・リンク）はプラグインが付ける'],
      ['定時報告', 'AI への指示・使える役割・キーワード'],
      ['連携・切替・承認の語', '連携のキーワード、共用ボットの切替の語、返信で決定する語、カードの文（各 300 字）'],
      ['グループ会話', '方針（既定は拒否）と案内の文'],
      ['アシスタント', '画面の文脈 ID・役割の表示名・アプリごとの AI 社員'],
      ['経路の別名', '/bridge/v1 でないシステムの経路'],
      ['配信', '優先順位・送信ボット・リンクのオリジン・まとめ送信の時間'],
      ['server-kit', '名簿の個人情報の検査・外部連携・スキャン PDF の扱い'],
    ], { y: 1.0, colW: [2.2, 6.8], fontSize: 10, rowH: 0.38 })
    s.addNotes('フレームワークの中を書き換えずに、拡張点で足して変えます。手書きのツール、通知の文面、定時報告の指示、各種の語、グループ会話の方針、アシスタントの設定、経路の別名、配信の設定、server-kit のオプションなどです。ツールのモジュールは、業務データを決まった関数だけで読み、書込みは提案だけにする作りです。')
  }

  // ── 品質と提供 ─────────────────────────────────────────────────────────
  pres.addSection({ title: P6 })
  {
    const s = content(P6, 'テストと品質')
    table(s, [
      ['層', '何で', '何を確かめるか'],
      ['単体', '各パッケージの node --test', '部品の契約（業務 API はモック、データは架空）'],
      ['適合性', '52 項目', '業務システムがプロトコルの不変条件を守ること'],
      ['mutation', '不変条件をわざと壊したモック', '壊すと該当の項目が落ちる（テストが効いている）'],
      ['manifest', 'bridge-validate', 'スキーマ・相互参照・個人情報らしいキー'],
      ['e2e（mock）', '本物の DSH＋部品＋gateway', '連携 → 質問 → 通知 → 承認 → 自動タスク → 分離（15 ステップ）'],
      ['profile', '雛形のテスト・検査', '送信の設定が閉じていること・リンクの検査の URL'],
    ], { y: 1.0, colW: [1.5, 3.0, 4.5], fontSize: 10.5, rowH: 0.45 })
    punch(s, 'リリースの条件：52 / 52・既知の欠落なし・skip なし', C.accent1, 4.4)
    s.addNotes('品質は層ごとに確かめます。各部品の単体テスト、業務システムの適合性テスト 52 項目、不変条件をわざと壊すとテストが落ちることを確かめる mutation テスト、manifest の検証、本物の DSH をモックの LLM とチャットで通しで動かす e2e、profile の検査です。リリースの条件は 52 / 52、既知の欠落なし、skip なしです。')
  }
  {
    const s = content(P6, '適合性テスト：5 つの不変条件から 52 項目')
    table(s, [
      ['不変条件', '主な項目'],
      ['1 本人だけが連携する', 'コードは発行者に結び付く・1 回限り・期限・試行の制限・他人の連携は見えない・代理連携が無い・解除で委託が終わる・個人ボットの持ち主の規則'],
      ['2 委託 = 許可リスト ∩ 役割', '未連携に委託なし・サービスだけで最長 5 分・宣言どおりの開き方・書込みは拒否・期限・無効の職員・チケットはセッションに結び付く'],
      ['3 AI は読む・提案、人が決める', '提案は pending_review・AI は採否できない・役割外の提案は拒否・チャットの承認は本人が 1 回・誤ったコードでロック'],
      ['4 個人情報を載せない', 'event は宣言どおりで許可リストのキーだけ・型ごとの許可リスト・カードと文面の引数・報告は件数だけ・統計は件数だけ'],
      ['5 身元は業務システムから', '本文の userId は拒否か無視'],
      ['プロトコルの作法', '/health・エラーの形・サービス専用の操作の認証・ヘッダ・エラーコードの形・manifest の etag'],
    ], { y: 1.0, colW: [2.5, 6.5], fontSize: 10, rowH: 0.55 })
    s.addNotes('適合性テストは、5 つの不変条件とプロトコルの作法から導いた 52 項目です。本人だけが連携する、委託は許可リストと役割の共通部分、AI は読む・提案するだけで人が決める、個人情報を載せない、身元は業務システムからだけ、の 5 つです。成功した応答はすべて OpenAPI のスキーマでも検証し、event は manifest の許可リスト、文面の引数は型で検証します。')
  }
  {
    const s = content(P6, 'バージョン管理と互換性')
    table(s, [
      ['対象', '版の表し方', '規則'],
      ['プロトコル', '/bridge/v1・bridge-protocol: 1・manifest の bridge: 1', 'v1 の中では足すだけ。意味の変更・削除・必須の追加は v2。変更時は適合性テストも同時に'],
      ['エラーコード', 'lower snake case', '安定した識別子。人向けの message は変わってよい'],
      ['manifest', 'version（SemVer か日付）・内容からの etag', '内容が変われば再取得（既定 600 秒ごと）。不正・届かない manifest は最後の正しいものを置き換えない'],
      ['event の型', '<対象>.<事実>', '出さなくなった型は消さずに deprecated。payload のキーを消すのは意味の変更'],
      ['playbook', 'manifest の版の変更時だけ再配備', 'テンプレートの項目だけ上書き、運用の項目（有効・配信・実行状態）は残す。消えたものは無効に'],
    ], { y: 1.0, colW: [1.6, 3.2, 4.2], fontSize: 10, rowH: 0.55 })
    s.addNotes('プロトコルは v1 の中では足すだけで、意味の変更は v2 で行います。エラーコードは安定した識別子です。manifest は内容から etag を作り、変われば DSH が再取得します。不正な manifest は最後の正しいものを置き換えません。event の型は消さずに deprecated にし、playbook は運用の設定を残したまま再配備します。')
  }
  {
    const s = content(P6, '運用AI Bot との関係：システムも自分で育つ')
    table(s, [
      ['', 'AI 社員（このフレームワーク）', '運用AI Bot'],
      ['相手', '職員', '開発・運用保守のチーム'],
      ['仕事', '知らせる・頼む・下書きする・まとめる', '課題の受付・調査・修正・テスト・PR・反映・報告'],
      ['決めるのは', '職員（承認・採用）', '担当者（本番は承認ゲート経由）'],
      ['置き場所', '業務システムと同じ環境', '業務システムとは別の基盤'],
    ], { y: 1.0, colW: [1.5, 3.75, 3.75], fontSize: 11, rowH: 0.5 })
    T(s, '接点：共通のログ形式（telemetry）と、業務システム側の健康・エラー・ログの読み取り口。詳しくは「運用AI Bot 技術概要」。', { x: 0.5, y: 3.8, w: 9, h: 0.6, fontSize: 11, bold: true, color: C.accent1 })
    s.addNotes('このフレームワークの AI 社員が職員と一緒に業務を回すのに対し、別製品の運用AI Bot はシステムそのものを見守り、直し、育てます。運用AI Bot は業務システムとは別の基盤で動き、本番の変更は承認ゲートを通します。共通のログ形式と、業務システム側の健康・エラー・ログの読み取り口が接点になります。')
  }
  {
    const s = content(P6, '導入例と提供状況（2026-11 時点）')
    card(s, 0.5, 1.0, 4.4, 1.6, 'apps', '介護事業所向けの業務システム（最初の導入例）', '請求・訪問記録・シフト・帳票で、AI 社員と働く形で実装済み。既存 API に別名で載せる方法。デモ環境で稼働中', { size: 9.5, titleSize: 11.5 })
    card(s, 0.5, 2.75, 4.4, 1.9, 'newsys', '設備点検（見本）', 'server-kit の上で新しく作った業務システム。適合性テスト 52 / 52、mock での通しの e2e', { size: 9.5, titleSize: 11.5, line: C.accent4, iconColor: 'green' })
    box(s, 5.1, 1.0, 4.4, 3.65, C.background2, { line: C.accent1, r: 0.12 })
    T(s, '提供中', { x: 5.25, y: 1.05, w: 4.1, h: 0.32, fontSize: 12, bold: true, color: C.accent4, margin: 0 })
    T(s, 'Bridge v1・manifest・適合性テスト、server-kit、9 プラグイン、gateway・web-kit、通知・承認・提案・自動タスク・定時報告、プロフィール、長期記憶、マニュアル、外部連携、添付、スキャン文書の読み取り', { x: 5.25, y: 1.4, w: 4.1, h: 1.5, fontSize: 11, color: C.text1, margin: 0 })
    T(s, '試行', { x: 5.25, y: 2.95, w: 4.1, h: 0.32, fontSize: 12, bold: true, color: C.accent2, margin: 0 })
    T(s, '外付けモード', { x: 5.25, y: 3.27, w: 4.1, h: 0.3, fontSize: 11, color: C.text1, margin: 0 })
    T(s, '今後', { x: 5.25, y: 3.6, w: 4.1, h: 0.32, fontSize: 12, bold: true, color: C.accent5, margin: 0 })
    T(s, '公開パッケージとしての配布（現在は個別提供・条件は個別相談）、プロフィールの適合性項目、通しのシナリオ実行器', { x: 5.25, y: 3.92, w: 4.1, h: 0.7, fontSize: 10.5, color: C.text1, margin: 0 })
    s.addNotes('最初の導入例は介護事業所向けの業務システムで、請求・訪問記録・シフト・帳票の業務で実装済み、デモ環境で稼働しています。見本として設備点検の業務システムがあります。主な機能は提供中で、外付けモードは試行、公開パッケージとしての配布などは今後です。パッケージは現在非公開で、提供条件は個別にご相談ください。')
  }
  {
    const s = pres.addSlide({ masterName: 'TITLE_DARK', sectionTitle: P6 })
    s.addText('次のステップ', { placeholder: 'title', fontFace: F.head, lang: LANG })
    s.addText([
      { text: 'まずは、ひとつの業務から', options: { bold: true, color: C.accent2, breakLine: true } },
      { text: 'チェックリストで足すものを見積もり、\n適合性テストで確かめながら広げます' },
    ], { placeholder: 'body', fontFace: F.body, lang: LANG })
    const steps = [['search', '事前の見積もり'], ['doc', 'manifest と hooks'], ['check', '適合性 52 / 52'], ['trendUp', '業務を広げる']]
    steps.forEach(([ic, label], i) => {
      const y = 0.75 + i * 1.08
      box(s, 6.6, y, 2.9, 0.92, i === 3 ? C.accent2 : C.accent1, { r: 0.14 })
      icon(s, ic, 6.8, y + 0.2, 0.52, i === 3 ? 'ink' : 'w')
      T(s, label, { x: 7.45, y, w: 2.0, h: 0.92, fontSize: 13, bold: true, color: i === 3 ? C.text1 : C.background1, valign: 'middle', margin: 0 })
    })
    s.addNotes('次のステップは、ひとつの業務から始めることです。チェックリストで足すものを見積もり、manifest と hooks を書き、適合性テスト 52 / 52 で確かめてから、業務を広げます。技術的なご質問には個別にお答えします。')
  }
}

// ── theme post-processing（maintenance-ai の運用AI Bot の資料と同じ） ───────────────────────
const SLOTS = ['dk1', 'lt1', 'dk2', 'lt2', 'accent1', 'accent2', 'accent3', 'accent4', 'accent5', 'accent6', 'hlink', 'folHlink']
const xmlAttr = (v) => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
async function finishTheme(file, theme) {
  const zip = await JSZip.loadAsync(fs.readFileSync(file))
  for (const name of Object.keys(zip.files).filter((n) => /^ppt\/.*\.xml$/.test(n))) {
    const xml = await zip.file(name).async('string')
    const bad = [...xml.matchAll(/<a:srgbClr val="([^"]*)"/g)].map((m) => m[1]).filter((v) => !/^[0-9A-Fa-f]{6}$/.test(v))
    if (bad.length) throw new Error(`${name}: srgbClr with non-hex value(s) ${[...new Set(bad)].join(', ')}`)
  }
  for (const name of Object.keys(zip.files).filter((n) => /^ppt\/(slides|slideLayouts|slideMasters|notesSlides)\/[^/]+\.xml$/.test(n))) {
    const xml = await zip.file(name).async('string')
    zip.file(name, xml.replace(/ lang="en-US"/g, ` lang="${LANG}"`))
  }
  for (const name of Object.keys(zip.files).filter((n) => /^ppt\/theme\/theme\d+\.xml$/.test(n))) {
    let xml = await zip.file(name).async('string')
    xml = xml.replace(/(<a:theme\b[^>]*?\bname=")[^"]*"/, `$1${xmlAttr(theme.name)}"`)
    xml = xml.replace(/(<a:clrScheme\b[^>]*?\bname=")[^"]*"/, `$1${xmlAttr(theme.name)}"`)
    xml = xml.replace(/(<a:fontScheme\b[^>]*?\bname=")[^"]*"/, `$1${xmlAttr(theme.name)}"`)
    xml = xml.replace(/<a:clrScheme\b[\s\S]*?<\/a:clrScheme>/, (scheme) => {
      for (const k of SLOTS) {
        const re = new RegExp(`<a:${k}>[\\s\\S]*?</a:${k}>`)
        if (!re.test(scheme)) throw new Error(`${name}: <a:${k}> not found`)
        scheme = scheme.replace(re, `<a:${k}><a:srgbClr val="${theme.colors[k].toUpperCase()}"/></a:${k}>`)
      }
      return scheme
    })
    xml = xml.replace(/(<a:majorFont>[\s\S]*?)<a:ea typeface="[^"]*"\/>/, `$1<a:ea typeface="${F.head}"/>`)
    xml = xml.replace(/(<a:minorFont>[\s\S]*?)<a:ea typeface="[^"]*"\/>/, `$1<a:ea typeface="${F.body}"/>`)
    zip.file(name, xml)
  }
  const out = new JSZip()
  for (const [name, entry] of Object.entries(zip.files)) {
    if (!entry.dir) out.file(name, await entry.async('uint8array'), { createFolders: false })
  }
  fs.writeFileSync(file, await out.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }))
}

;(async () => {
  await prepIcons()
  build()
  await pres.writeFile({ fileName: OUT })
  await finishTheme(OUT, THEME)
  console.log('wrote', OUT)
})().catch((e) => { console.error(e); process.exit(1) })
