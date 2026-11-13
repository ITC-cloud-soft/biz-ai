// Builds docs/slides/marketing/biz-assistant-features.pptx — Bizアシスタント：記録するシステムを、考えて動くシステムに（営業資料、日本語、図解中心）。
// node build-features.cjs [out.pptx]            (default: ../biz-assistant-features.pptx, 21 slides)
// node build-features.cjs --short [out.pptx]    (default: ../biz-assistant-features-short.pptx, 8 slides)
// Same visual family as maintenance-ai docs/slides/ops-ai/src/build-features.cjs (運用 AI の営業資料): theme DSH Bridge Ink, Meiryo,
// react-icons badges, flow diagrams, short labels on the slides and the explanations in the speaker notes.
// Needs pptxgenjs (and its jszip) plus react, react-dom, react-icons and sharp — see README.md (NODE_PATH).
// Every name, message and number on the chat mock-ups is fictional. No prices, no competitor names, no promises.
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

const SHORT = process.argv.includes('--short')
const ARGS = process.argv.slice(2).filter((a) => a !== '--short')
const OUT = path.resolve(ARGS[0] ?? path.join(__dirname, '..', SHORT ? 'biz-assistant-features-short.pptx' : 'biz-assistant-features.pptx'))
const LANG = 'ja-JP'

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
pres.title = SHORT ? 'Bizアシスタント：考えて動くシステムへ（精簡版）' : 'Bizアシスタント：記録するシステムを、考えて動くシステムに'
pres.subject = 'Bizアシスタント（Biz Assistant Framework）'
pres.author = 'ITC Bizアシスタント'
pres.theme = { headFontFace: F.head, bodyFontFace: F.body }
const C = pres.SchemeColor
const S = pres.shapes

pres.defineSlideMaster({
  title: 'TITLE_DARK',
  background: { color: C.text2 },
  objects: [
    { placeholder: { options: { name: 'title', type: 'title', x: 0.6, y: 1.0, w: 5.4, h: 1.9, fontFace: F.head, fontSize: 32, bold: true, color: C.background1, valign: 'bottom', align: 'left', margin: 0 }, text: '' } },
    { placeholder: { options: { name: 'body', type: 'body', x: 0.6, y: 3.1, w: 5.4, h: 1.6, fontFace: F.body, fontSize: 15, color: C.background2, valign: 'top', align: 'left', margin: 0 }, text: '' } },
  ],
})
pres.defineSlideMaster({
  title: 'CONTENT',
  background: { color: C.background1 },
  margin: [0.3, 0.5, 0.4, 0.5],
  objects: [
    { placeholder: { options: { name: 'title', type: 'title', x: 0.5, y: 0.22, w: 9.0, h: 0.62, fontFace: F.head, fontSize: 24, bold: true, color: C.text2, valign: 'middle', align: 'left', margin: 0 }, text: '' } },
    { text: { text: 'Bizアシスタント ・ 考えて動くシステムへ', options: { x: 0.5, y: 5.27, w: 6, h: 0.25, fontFace: F.body, fontSize: 9, color: C.accent5, margin: 0 } } },
  ],
  slideNumber: { x: 9.0, y: 5.27, w: 0.5, h: 0.25, fontFace: F.body, fontSize: 9, color: C.accent5, align: 'right' },
})

// ── icons（react-icons → SVG → PNG、色ごとに事前に作る） ─────────────────────
const ICON = {
  storage: md.MdStorage, add: md.MdAddBox, edit: md.MdEdit, del: md.MdDelete, search: md.MdManageSearch, find: md.MdSearch,
  keyboard: md.MdKeyboard, run: md.MdDirectionsRun, memo: md.MdBookmarks, link: md.MdLink, hub: md.MdHub, lock: md.MdLock,
  elderly: md.MdElderly, inspect: md.MdFactCheck, receipt: md.MdReceiptLong, staff: md.MdBadge, truck: md.MdLocalShipping,
  build: md.MdConstruction, store: md.MdStorefront, event: md.MdEvent, block: md.MdBlock, qa: md.MdQuestionAnswer,
  done: md.MdTaskAlt, mind: md.MdPsychology, plug: md.MdExtension, verified: md.MdVerifiedUser, devices: md.MdDevices,
  brain: gi.GiBrain, chat: md.MdForum, team: md.MdGroups, ticket: md.MdAssignment, report: md.MdAssessment, loop: md.MdAutorenew,
  shield: md.MdShield, night: md.MdBedtime, clock: md.MdAccessTime, quit: md.MdPersonOff, doc: md.MdDescription,
  check: md.MdCheckCircle, rocket: md.MdRocketLaunch, eye: md.MdVisibility, bell: md.MdNotificationsActive, code: md.MdCode,
  test: md.MdScience, tap: md.MdTouchApp, robot: md.MdSmartToy, person: md.MdPerson, trendUp: md.MdTrendingUp,
  savings: md.MdSavings, undo: md.MdUndo, privacy: md.MdPrivacyTip, history: md.MdHistory, plan: md.MdEditNote, ok: md.MdHowToReg,
  hourglass: md.MdHourglassBottom, rule: md.MdRule, warn: md.MdWarning, idea: md.MdLightbulb, settings: md.MdSettings,
  line: fa.FaLine, teams: bs.BsMicrosoftTeams, slack: fa.FaSlack, wechat: fa.FaWeixin, sun: md.MdWbSunny, phone: md.MdPhoneInTalk,
  groupOff: md.MdGroupOff, infinite: md.MdAllInclusive, archive: md.MdArchive, schedule: md.MdSchedule, star: md.MdStars,
  sync: md.MdSync, thumb: md.MdThumbUp, user: md.MdFace, owner: md.MdAdminPanelSettings, engineer: md.MdEngineering,
  newsys: md.MdNewReleases, server: md.MdDns,
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

// ── helpers（運用 AI の営業資料と同じ） ─────────────────────────────────────
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
function arrow(slide, x1, y1, x2, y2, { color = C.accent5, width = 2, dash, both = false, head = true } = {}) {
  slide.addShape(S.LINE, {
    x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.max(Math.abs(x2 - x1), 0.001), h: Math.max(Math.abs(y2 - y1), 0.001),
    flipH: x2 < x1, flipV: y2 < y1,
    line: { color, width, ...(head ? { endArrowType: 'triangle' } : {}), ...(both ? { beginArrowType: 'triangle' } : {}), ...(dash ? { dashType: dash } : {}) },
    objectName: oid('arrow'),
  })
}
function icon(slide, name, x, y, size, color = 'w') {
  if (!ICONDATA[`${name}:${color}`]) throw new Error(`icon ${name}:${color} not prepared`)
  slide.addImage({ data: ICONDATA[`${name}:${color}`], x, y, w: size, h: size, altText: name, objectName: oid('icon') })
}
/** filled circle with an icon in the middle */
function badge(slide, name, x, y, d, fill = C.accent1, color = 'w') {
  slide.addShape(S.OVAL, { x, y, w: d, h: d, fill: { color: fill }, line: { color: fill, width: 0.75 }, objectName: oid('badge') })
  icon(slide, name, x + d * 0.2, y + d * 0.2, d * 0.6, color)
}
/** badge with a short label under it (centered on cx) */
function node(slide, name, cx, y, d, label, { fill = C.accent1, color = 'w', size = 12, labelW = 1.6, labelColor = C.text2 } = {}) {
  badge(slide, name, cx - d / 2, y, d, fill, color)
  if (label) T(slide, label, { x: cx - labelW / 2, y: y + d + 0.05, w: labelW, h: 0.36, fontSize: size, bold: true, color: labelColor, align: 'center', margin: 0 })
}
/** a row of nodes joined by arrows */
function chain(slide, items, x, y, w, d, o = {}) {
  const n = items.length
  const step = (w - d) / (n - 1)
  items.forEach(([ic, label, fill], i) => {
    const cx = x + d / 2 + i * step
    node(slide, ic, cx, y, d, label, { fill: fill ?? C.accent1, labelW: Math.min(step + 0.1, 1.9), ...o })
    if (i < n - 1) arrow(slide, cx + d / 2 + 0.06, y + d / 2, cx + step - d / 2 - 0.06, y + d / 2, { color: C.accent5, width: 2 })
  })
}
/** icon + label in a rounded tile */
function tile(slide, name, x, y, w, h, label, { fill = C.background2, line = C.accent1, iconColor = 'teal', size = 13, textColor = C.text2 } = {}) {
  box(slide, x, y, w, h, fill, { line })
  const d = Math.min(h * 0.5, w * 0.42)
  icon(slide, name, x + (w - d) / 2, y + h * 0.12, d, iconColor)
  T(slide, label, { x: x + 0.05, y: y + h * 0.12 + d + 0.04, w: w - 0.1, h: h - d - h * 0.12 - 0.06, fontSize: size, bold: true, color: textColor, align: 'center', valign: 'top', margin: 0 })
}
/** nodes on an ellipse with arrows (a loop) */
function ring(slide, items, cx, cy, rx, ry, d, { labelSize = 11.5 } = {}) {
  const n = items.length
  const pos = items.map((_, i) => { const a = -Math.PI / 2 + (i * 2 * Math.PI) / n; return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)] })
  pos.forEach(([x, y], i) => {
    const [nx, ny] = pos[(i + 1) % n]
    const dx = nx - x, dy = ny - y, len = Math.hypot(dx, dy)
    const k = (d / 2 + 0.12) / len
    arrow(slide, x + dx * k, y + dy * k, nx - dx * k, ny - dy * k, { color: 'B9C6C4', width: 1.75 })
  })
  pos.forEach(([x, y], i) => {
    const [ic, label, fill] = items[i]
    badge(slide, ic, x - d / 2, y - d / 2, d, fill ?? C.accent1)
    const below = y >= cy - 0.05
    T(slide, label, { x: x - 0.8, y: below ? y + d / 2 + 0.02 : y - d / 2 - 0.34, w: 1.6, h: 0.32, fontSize: labelSize, bold: true, color: C.text2, align: 'center', valign: below ? 'top' : 'bottom', margin: 0 })
  })
}
function content(sectionTitle, t) {
  const slide = pres.addSlide({ masterName: 'CONTENT', sectionTitle })
  slide.addText(t, { placeholder: 'title', fontFace: F.head, lang: LANG })
  return slide
}
/** one punch line at the bottom of a content slide */
function punch(slide, text, color = C.accent3) {
  T(slide, text, { x: 0.5, y: 4.8, w: 9.0, h: 0.4, fontSize: 15, bold: true, color, align: 'center', valign: 'middle' })
}
/** a small rounded label */
function chip(slide, x, y, w, h, text, { fill = C.accent2, color = C.text1, size = 11, line } = {}) {
  box(slide, x, y, w, h, fill, { line: line ?? fill, r: h / 2 })
  T(slide, text, { x, y, w, h, fontSize: size, bold: true, color, align: 'center', valign: 'middle', margin: 0 })
}
/** LINE・Teams・Slack・WeChat のアイコンを、中心 cx から横に並べる */
function chats(slide, cx, y, size, gap = size * 0.3) {
  const list = [['line', 'green'], ['teams', 'dark'], ['slack', 'teal'], ['wechat', 'green']]
  const w = size * list.length + gap * (list.length - 1)
  list.forEach(([ic, c], i) => icon(slide, ic, cx - w / 2 + i * (size + gap), y, size, c))
}

// メッセージの見出し（AI 秘書の文面）とその色
const LABEL = {
  report: ['【定時のご報告】', C.text2], urgent: ['【至急】', C.accent3], approve: ['【承認のお願い】', C.accent6],
  request: ['【対応のお願い】', C.accent2], info: ['【ご報告】', C.accent1], guide: ['【ご案内】', C.accent4],
}
const SIGN = '— さくら（ケアビリング AI 秘書）'

/**
 * スマホのチャット画面（架空の内容）。items: { kind, title, body, h, buttons?: [[label, fill]], sign? } または { mine: text, h }
 */
function phone(slide, x, y, w, h, time, items) {
  box(slide, x, y, w, h, '1B2A2F', { r: 0.22, shadow: true })
  box(slide, x + 0.08, y + 0.32, w - 0.16, h - 0.46, 'EEF3F2', { r: 0.06 })
  badge(slide, 'robot', x + 0.17, y + 0.4, 0.36, C.accent1)
  T(slide, [{ text: 'さくら', options: { bold: true, fontSize: 9.5, breakLine: true } }, { text: 'ケアビリング AI 秘書', options: { fontSize: 7 } }], { x: x + 0.6, y: y + 0.37, w: w - 1.3, h: 0.44, color: C.text2, margin: 0, valign: 'middle' })
  if (time) T(slide, time, { x: x + w - 0.72, y: y + 0.42, w: 0.56, h: 0.3, fontSize: 8.5, bold: true, color: C.accent5, align: 'right', valign: 'middle', margin: 0 })
  box(slide, x + 0.08, y + 0.86, w - 0.16, 0.012, 'D5DEDC', { shape: S.RECTANGLE })
  let yy = y + 0.96
  const cw = w - 0.34
  for (const m of items) {
    if (m.mine) {
      const bw = cw * 0.8
      box(slide, x + 0.17 + cw - bw, yy, bw, m.h, 'DCF3E3', { line: 'B9E2C6', r: 0.08 })
      T(slide, m.mine, { x: x + 0.17 + cw - bw + 0.05, y: yy + 0.02, w: bw - 0.1, h: m.h - 0.04, fontSize: 9.5, color: C.text1, valign: 'middle' })
    } else {
      const [label, color] = LABEL[m.kind]
      box(slide, x + 0.17, yy, cw, m.h, C.background1, { line: 'D5DEDC', r: 0.06 })
      box(slide, x + 0.17, yy + 0.06, 0.04, m.h - 0.12, color, { shape: S.RECTANGLE })
      const runs = [{ text: label + (m.title ?? ''), options: { bold: true, fontSize: 9.5, color, breakLine: true } }, { text: m.body, options: { fontSize: 9, color: C.text1, breakLine: m.sign !== false } }]
      if (m.sign !== false) runs.push({ text: SIGN, options: { fontSize: 7, color: C.accent5 } })
      const bh = m.buttons ? 0.34 : 0
      T(slide, runs, { x: x + 0.26, y: yy + 0.04, w: cw - 0.14, h: m.h - 0.08 - bh, valign: 'top', paraSpaceAfter: 1 })
      if (m.buttons) {
        const bw = (cw - 0.2 - 0.08 * (m.buttons.length - 1)) / m.buttons.length
        m.buttons.forEach(([b, fill], i) => chip(slide, x + 0.27 + i * (bw + 0.08), yy + m.h - 0.33, bw, 0.25, b, { fill, color: C.background1, size: 8.5 }))
      }
    }
    yy += m.h + 0.09
  }
}
/** badge + label rows beside a phone */
function points(slide, x, y, w, items, { fill = C.accent1, step = 0.95, d = 0.55, size = 12.5 } = {}) {
  items.forEach(([ic, label, f], i) => {
    const yy = y + i * step
    badge(slide, ic, x, yy, d, f ?? fill)
    T(slide, label, { x: x + d + 0.1, y: yy - 0.08, w: w - d - 0.1, h: d + 0.16, fontSize: size, bold: true, color: C.text2, valign: 'middle', margin: 0 })
  })
}

// ════════════════════════════════════════════════════════════════════════
// slides（長い版と精簡版で共用するもの）

function slideCover(sec) {
  const s = pres.addSlide({ masterName: 'TITLE_DARK', sectionTitle: sec })
  s.addText('記録するシステムを、\n考えて動くシステムに', { placeholder: 'title', fontFace: F.head, lang: LANG })
  s.addText([{ text: 'Bizアシスタント', options: { bold: true, fontSize: 20, color: C.accent2, breakLine: true } }, { text: 'どの IT システムにも、\n考え・覚え・自分から動く AI 社員を' }], { placeholder: 'body', fontFace: F.body, lang: LANG })
  const tiles = [['brain', '考える', C.accent1], ['memo', '覚える', C.accent6], ['run', '自分から動く', C.accent4], ['loop', '自分で育つ', C.accent2]]
  tiles.forEach(([ic, label, fill], i) => {
    const x = 6.35 + (i % 2) * 1.6, y = 0.85 + Math.floor(i / 2) * 1.95
    box(s, x, y, 1.45, 1.75, fill, { r: 0.14 })
    icon(s, ic, x + 0.36, y + 0.25, 0.72, i === 3 ? 'ink' : 'w')
    T(s, label, { x: x + 0.05, y: y + 1.08, w: 1.35, h: 0.55, fontSize: 12.5, bold: true, color: i === 3 ? C.text1 : C.background1, align: 'center', valign: 'middle', margin: 0 })
  })
  s.addNotes('Bizアシスタントは、登録・照会・更新といった記録と、決められた業務処理を行うこれまでの IT システムを、自分で考え、覚え、職責を自分から果たす「考えて動くシステム」に変える仕組みです。業務システムに AI 社員が付き、職員一人ひとりのチャットで知らせ、頼み、まとめます。さらに運用 AI が、システムそのものを見守り、直し、育てます。いまお使いのシステムにも、新しく作るシステムにも使えます。')
  return s
}

function slideBeforeAfter(sec) {
  const s = content(sec, '記録して待つシステムから、考えて動くシステムへ')
  // いま
  box(s, 0.5, 1.0, 3.9, 3.6, 'FBEDEA', { line: C.accent3, r: 0.14 })
  T(s, 'これまでの IT システム', { x: 0.5, y: 1.06, w: 3.9, h: 0.4, fontSize: 14, bold: true, color: C.accent3, align: 'center' })
  badge(s, 'storage', 1.95, 1.55, 1.0, C.accent5)
  ;[['add', '登録'], ['find', '照会'], ['edit', '更新'], ['del', '削除']].forEach(([ic, label], i) => {
    const cx = 0.5 + 0.975 * (i + 0.5)
    node(s, ic, cx, 2.75, 0.55, label, { fill: C.accent5, size: 11, labelW: 0.95 })
  })
  T(s, '人が画面を開くまで、待っている', { x: 0.6, y: 3.85, w: 3.7, h: 0.5, fontSize: 12.5, bold: true, color: C.accent3, align: 'center', valign: 'middle' })
  // 矢印
  arrow(s, 4.5, 2.8, 5.5, 2.8, { color: C.accent2, width: 4 })
  T(s, 'Bizアシスタント', { x: 4.35, y: 2.3, w: 1.3, h: 0.35, fontSize: 9.5, bold: true, color: C.accent2, align: 'center', margin: 0 })
  // これから
  box(s, 5.6, 1.0, 3.9, 3.6, 'E3F1EE', { line: C.accent4, r: 0.14 })
  T(s, '考えて動くシステム', { x: 5.6, y: 1.06, w: 3.9, h: 0.4, fontSize: 14, bold: true, color: C.accent4, align: 'center' })
  badge(s, 'robot', 7.05, 1.55, 1.0, C.accent1)
  ;[['brain', '考える', C.accent1], ['memo', '覚える', C.accent6], ['run', '自分から動く', C.accent4]].forEach(([ic, label, fill], i) => {
    const cx = 5.6 + 1.3 * (i + 0.5)
    node(s, ic, cx, 2.72, 0.6, label, { fill, size: 11.5, labelW: 1.3 })
  })
  T(s, '自分から知らせ、頼み、まとめる', { x: 5.7, y: 3.85, w: 3.7, h: 0.5, fontSize: 12.5, bold: true, color: C.accent4, align: 'center', valign: 'middle' })
  punch(s, '画面を開く仕事から、チャットで決める仕事へ')
  s.addNotes('これまでの IT システムは、登録・照会・更新・削除といった記録と、決められた業務処理を確実にこなします。ただし、人が画面を開いて操作するまで、システムは待っているだけです。Bizアシスタントを付けると、システムが自分で状況を読み、大事なことを見分け、覚えていることを生かして、必要な人に自分から知らせ、頼み、まとめるようになります。人は画面を回る代わりに、チャットで確かめて決めるだけになります。')
}

function slideWorries(sec) {
  const s = content(sec, 'その仕事、AI 社員に任せられます')
  const worries = [['keyboard', '入力と確認'], ['warn', '気づくのが遅い'], ['run', '担当者を追う'], ['doc', '報告書づくり'], ['groupOff', '人手が足りない']]
  worries.forEach(([ic, label], i) => {
    const y = 1.0 + i * 0.8
    badge(s, ic, 0.6, y, 0.62, C.accent3)
    T(s, label, { x: 1.35, y, w: 2.0, h: 0.62, fontSize: 14, bold: true, color: C.text2, valign: 'middle' })
  })
  arrow(s, 3.45, 2.9, 4.55, 2.9, { color: C.accent1, width: 4 })
  badge(s, 'robot', 4.75, 1.85, 2.1, C.accent1)
  T(s, 'AI 社員', { x: 4.6, y: 4.05, w: 2.4, h: 0.45, fontSize: 18, bold: true, color: C.text2, align: 'center' })
  const goods = [['eye', '先に気づく'], ['bell', '必要な人に届く'], ['plan', '案を下書き'], ['report', '報告は自動']]
  goods.forEach(([ic, label], i) => {
    const y = 1.15 + i * 0.92
    badge(s, ic, 7.2, y, 0.62, C.accent4)
    T(s, label, { x: 7.95, y, w: 1.6, h: 0.62, fontSize: 14, bold: true, color: C.accent4, valign: 'middle' })
  })
  s.addNotes('入力と確認に追われる、大事な変化に気づくのが遅れる、承認や提出のために担当者を追いかける、報告書を作る、そして人手が足りない。多くの会社で共通の悩みです。情報はすでにシステムの中にあるのに、人が画面を開かなければ誰も気づきません。AI 社員はシステムの変化を先に見つけ、必要な人にだけ届け、案を下書きし、報告をまとめます。')
}

function slidePowers(sec) {
  const s = content(sec, '3 つの力：考える・覚える・自分から動く')
  const cols = [
    ['brain', '考える', C.accent1, [['search', '状況を読む'], ['idea', '大事なことを見分ける'], ['plan', '案を下書きする']]],
    ['memo', '覚える', C.accent6, [['thumb', '一人ひとりの好み'], ['rule', '会社のルール・手順'], ['history', '前の話の続き']]],
    ['run', '自分から動く', C.accent4, [['eye', '見張って知らせる'], ['person', '必要な人に頼む'], ['report', 'まとめて報告する']]],
  ]
  cols.forEach(([ic, title, fill, rows], i) => {
    const x = 0.5 + i * 3.05
    box(s, x, 1.0, 2.85, 3.65, C.background2, { line: fill, r: 0.14 })
    badge(s, ic, x + (2.85 - 0.95) / 2, 1.15, 0.95, fill)
    T(s, title, { x, y: 2.15, w: 2.85, h: 0.48, fontSize: 19, bold: true, color: fill, align: 'center', valign: 'middle' })
    rows.forEach(([ri, label], j) => {
      const y = 2.8 + j * 0.6
      icon(s, ri, x + 0.25, y + 0.04, 0.38, i === 0 ? 'teal' : i === 1 ? 'dark' : 'green')
      T(s, label, { x: x + 0.72, y, w: 2.05, h: 0.46, fontSize: 12, bold: true, color: C.text2, valign: 'middle', margin: 0 })
    })
  })
  punch(s, '決めるのは、いつも人')
  s.addNotes('AI 社員の力は 3 つです。1 つ目は「考える」。本人の権限の範囲で業務のデータを読み、いま大事なことを見分け、計画書や修正の案を下書きします。2 つ目は「覚える」。一人ひとりの好み、会社のルールや手順、前に話したことを覚えているので、毎回説明し直す必要がありません。3 つ目は「自分から動く」。言われる前に見張って知らせ、必要な人に頼み、まとめて報告します。そして、確定・承認・金額など最後に決めるのは、いつも人です。')
}

function slideThink(sec) {
  const s = content(sec, '考える：読んで、見分けて、案を出す')
  chain(s, [
    ['storage', '業務データ', C.accent6], ['search', '読む'], ['brain', '見分ける'], ['plan', '案を出す'], ['tap', '人が採用', C.accent2], ['check', '記録', C.accent4],
  ], 0.6, 1.05, 8.8, 0.85, { size: 13 })
  box(s, 0.6, 2.42, 4.75, 0.34, C.background2, { line: C.background2, r: 0.17 })
  T(s, '本人の権限の範囲で', { x: 0.6, y: 2.42, w: 4.75, h: 0.34, fontSize: 11, bold: true, color: C.accent1, align: 'center', valign: 'middle', margin: 0 })
  const sides = [
    [0.5, 'AI がすること', 'E3F1EE', C.accent4, 'green', [['search', '読む'], ['idea', '見分ける'], ['plan', '下書き']]],
    [5.1, 'AI がしないこと', 'FBEDEA', C.accent3, 'red', [['done', '確定'], ['approve', '承認'], ['savings', '金額の決定']]],
  ]
  sides.forEach(([x, title, fill, line, ic, items]) => {
    box(s, x, 3.0, 4.4, 1.62, fill, { line, r: 0.14 })
    T(s, title, { x, y: 3.06, w: 4.4, h: 0.38, fontSize: 13.5, bold: true, color: line, align: 'center', valign: 'middle' })
    items.forEach(([ii, label], j) => {
      const cx = x + 4.4 / 3 * (j + 0.5)
      icon(s, ii === 'approve' ? 'tap' : ii, cx - 0.25, 3.5, 0.5, ic)
      T(s, label, { x: cx - 0.7, y: 4.05, w: 1.4, h: 0.36, fontSize: 12, bold: true, color: C.text2, align: 'center', margin: 0 })
    })
  })
  punch(s, '採用しなければ、何も変わらない')
  s.addNotes('AI 社員は、本人の権限の範囲で業務データを読み、いま対応が必要なものを見分け、計画書の下書きや記録の修正案を出します。担当者が内容を確かめ、必要なら直して「採用」したときに初めて、業務システムに記録されます。確定・承認・金額の決定は AI にはできない作りで、採用しなければシステムの中身は何も変わりません。')
}

function slideMemory(sec) {
  const s = content(sec, '覚える：だから、話が早い')
  const ins = [['thumb', '好み'], ['chat', '前の話'], ['rule', '会社のルール'], ['doc', '手順・マニュアル']]
  ins.forEach(([ic, label], i) => {
    const y = 1.0 + i * 0.85
    badge(s, ic, 0.6, y, 0.62, C.accent6)
    T(s, label, { x: 1.32, y, w: 1.9, h: 0.62, fontSize: 13.5, bold: true, color: C.text2, valign: 'middle' })
    arrow(s, 3.2, y + 0.31, 3.75, 2.6, { color: C.accent5, width: 1.75 })
  })
  badge(s, 'brain', 3.85, 1.6, 2.0, C.accent1)
  T(s, '記憶', { x: 3.85, y: 3.68, w: 2.0, h: 0.45, fontSize: 18, bold: true, color: C.text2, align: 'center' })
  const outs = [['idea', '説明し直さない'], ['history', '続きから話せる'], ['star', '会社らしく答える']]
  outs.forEach(([ic, label], i) => {
    const y = 1.1 + i * 1.0
    arrow(s, 5.95, 2.6, 6.55, y + 0.31, { color: C.accent4, width: 1.75 })
    badge(s, ic, 6.65, y, 0.62, C.accent4)
    T(s, label, { x: 7.37, y, w: 2.2, h: 0.62, fontSize: 14, bold: true, color: C.accent4, valign: 'middle' })
  })
  icon(s, 'privacy', 2.3, 4.32, 0.42, 'red')
  T(s, '名前や健康のことなど、個人の情報は覚えない', { x: 2.8, y: 4.3, w: 5.5, h: 0.46, fontSize: 14, bold: true, color: C.accent3, valign: 'middle' })
  s.addNotes('AI 社員は、一人ひとりの好み（「報告は結論だけに」など）、前に話したことの続き、会社のルール、手順やマニュアルを覚えています。だから毎回説明し直す必要がなく、話の続きから進められ、会社らしい答え方ができます。個人の記憶は本人だけのもので、管理者にも中身は見えません。名前や健康のことなど個人の情報は覚えない決まりで、保存の前に確かめます。業務のデータそのものは覚えず、毎回システムから最新の内容を読みます。')
}

function slideAct(sec) {
  const s = content(sec, '自分から動く：言われる前に、職責を果たす')
  ring(s, [
    ['eye', '見張る'], ['bell', '気づく'], ['chat', '知らせる'], ['person', '頼む'], ['hourglass', '催促する'], ['report', 'まとめる'],
  ], 5.0, 3.05, 3.2, 1.45, 0.74, { labelSize: 12.5 })
  T(s, [{ text: '職責を自分で果たす', options: { bold: true, fontSize: 19, color: C.text2, breakLine: true } }, { text: '24 時間・休まず', options: { fontSize: 12, color: C.accent5 } }], { x: 3.4, y: 2.6, w: 3.2, h: 0.95, align: 'center', valign: 'middle' })
  s.addNotes('AI 社員は、言われるのを待ちません。システムの変化を 24 時間見張り、期限切れや未提出に気づき、関係する人に知らせ、対応すべき人に頼み、進まなければ催促し、朝と夕方にまとめて報告します。これまで管理者や事務の方が、毎日の手作業でやっていた仕事です。通知を控える時間帯は本人が決められ、夜間は急ぎのものだけが届きます。')
}

function slideDay(sec) {
  const s = content(sec, 'AI 社員のいる一日')
  const cards = [
    ['08:30', 'sun', '定時の報告', C.text2, 'report', '対応が必要なこと 2 件、\nご参考 1 件を\nまとめました', null],
    ['09:20', 'warn', '至急の知らせ', C.accent3, 'urgent', '09:00 開始予定の\n訪問が、まだ\n始まっていません', null],
    ['14:00', 'tap', '外出先で承認', C.accent6, 'approve', '10 月分の請求の\n確定を\nお願いします', [['承認', C.accent4], ['差戻', C.accent5]]],
    ['16:00', 'idea', 'AI の提案', C.accent2, 'request', 'AI の提案が 2 件。\n採用か見送りかを\nお決めください', null],
  ]
  box(s, 0.9, 1.78, 8.2, 0.06, 'D5DEDC', { shape: S.RECTANGLE })
  cards.forEach(([time, ic, title, fill, kind, text, buttons], i) => {
    const x = 0.5 + i * 2.3, cx = x + 1.075
    T(s, time, { x, y: 0.98, w: 2.15, h: 0.4, fontSize: 17, bold: true, color: fill, align: 'center', valign: 'middle', margin: 0 })
    badge(s, ic, cx - 0.35, 1.45, 0.7, fill)
    T(s, title, { x, y: 2.2, w: 2.15, h: 0.38, fontSize: 13.5, bold: true, color: C.text2, align: 'center', valign: 'middle', margin: 0 })
    const [label, lc] = LABEL[kind]
    box(s, x, 2.7, 2.15, 1.75, C.background1, { line: 'D5DEDC', r: 0.08, shadow: true })
    box(s, x, 2.78, 0.05, 1.59, lc, { shape: S.RECTANGLE })
    T(s, [{ text: label, options: { bold: true, fontSize: 11, color: lc, breakLine: true } }, { text, options: { fontSize: 12.5 } }], { x: x + 0.14, y: 2.8, w: 1.95, h: buttons ? 1.2 : 1.55, paraSpaceAfter: 4 })
    if (buttons) buttons.forEach(([b, f], j) => chip(s, x + 0.15 + j * 0.95, 4.03, 0.85, 0.3, b, { fill: f, color: C.background1, size: 10 }))
  })
  T(s, '例：介護事業所（ケアビリング）。内容はすべて架空です', { x: 0.5, y: 4.62, w: 9, h: 0.3, fontSize: 10.5, color: C.accent5, align: 'center' })
  s.addNotes('AI 社員のいる一日を、介護事業所の例で見ていきます。ケアビリングという介護の業務システムで、この仕組みはすでに実装され、デモ環境で動いています（内容はすべて架空です）。朝 8 時半の定時のご報告、9 時 20 分の至急の知らせ、14 時の外出先での承認、16 時の AI の提案。メッセージの先頭の見出しで、読むだけでよいのか、対応が必要なのか、急ぎなのかがひと目でわかります。')
}

function slideMorning(sec) {
  const s = content(sec, '朝のまとめも、至急の知らせも、チャットに')
  phone(s, 0.5, 0.98, 2.3, 4.0, '08:30', [
    { kind: 'report', title: '', body: 'おはようございます。\n■ 対応が必要なこと\n・承認待ちの記録 3 件\n・未提出の記録 2 件\n■ ご参考\n・本日の訪問 12 件', h: 1.95 },
    { mine: 'ありがとう。承認は昼までにします', h: 0.5 },
  ])
  points(s, 2.95, 1.25, 1.95, [['sun', '朝と夕方に\n届く'], ['rule', '対応と参考を\n分ける'], ['check', '問題なければ\nひとこと']])
  phone(s, 5.05, 0.98, 2.3, 4.0, '09:20', [
    { kind: 'urgent', title: '未開始の訪問', body: '09:00 開始予定の訪問が、まだ始まっていません（20 分経過）。担当の職員に状況を確認してください。', h: 1.85, buttons: [['業務 Web を開く', C.accent1]] },
    { mine: '担当に電話しました', h: 0.4 },
  ])
  points(s, 7.5, 1.25, 2.0, [['eye', '異変を\n先に知らせる', C.accent3], ['person', 'してほしい\nことまで', C.accent3], ['tap', 'ボタンで\n画面へ', C.accent3]])
  s.addNotes('朝 8 時半、管理者のチャットに「定時のご報告」が届きます。夕方にも届き、時刻は変えられます。中身は「対応が必要なこと」と「ご参考」に分かれ、誰に何をお願いするかまで書いてあります。問題がない日は「異常なし」とひとことで終わります。9 時 20 分、9 時に始まるはずの訪問が始まっていないことに AI 社員が気づき、サービス責任者に【至急】で知らせます。してほしいことが書いてあり、ボタンで該当の画面が開きます。チャットには件数と日付だけを書き、利用者の名前や記録の中身は書きません。')
}

function slideDecide(sec) {
  const s = content(sec, '決めるのは、チャットのワンタップで')
  phone(s, 0.5, 0.98, 2.3, 4.0, '14:00', [
    { kind: 'approve', title: '請求の確定', body: '対象：2026-10\n期限：10/28 17:00\n内容を確認し、選んでください。', h: 1.6, buttons: [['承認', C.accent4], ['差戻', C.accent5]] },
    { mine: '承認', h: 0.38 },
    { kind: 'info', title: '', body: '承認しました。結果は業務システムに記録しました。', h: 0.95 },
  ])
  points(s, 2.95, 1.25, 1.95, [['tap', 'ワンタップで\n決まる', C.accent6], ['lock', '承認できる\n人にだけ', C.accent6], ['history', '結果は\nシステムに記録', C.accent6]])
  phone(s, 5.05, 0.98, 2.3, 4.0, '16:00', [
    { kind: 'request', title: 'AI の提案', body: 'AI の提案が 2 件届きました（計画書の下書き 1・記録の修正 1）。業務 Web で確認し、採用か見送りかをお決めください。', h: 2.05, buttons: [['提案を見る', C.accent1]] },
    { mine: '確認します', h: 0.4 },
  ])
  points(s, 7.5, 1.25, 2.0, [['plan', '下書きは\nAI', C.accent2], ['edit', '確認と修正は\n人が行う', C.accent2], ['check', '採用して\n初めて反映', C.accent2]])
  s.addNotes('14 時、請求の確定の承認依頼が、承認できる管理者のチャットにだけ届きます。外出先でも「承認」を押すだけで決まり、結果はその場で業務システムに記録されます。承認の規則は業務システムの中にあり、Web の画面で承認するときと同じ規則で判断されます。1 人が決めると、ほかの人のカードは自動で無効になります。16 時、AI 社員が計画書の下書きや記録の修正案を用意します。担当者が中身を確かめ、必要なら直して「採用」したときに初めて反映されます。')
}

function slidePersona(sec) {
  const s = content(sec, '会社が決めた名前と人柄で、使い方も案内')
  const st = [['user', '呼び名\n「さくら」'], ['chat', '話し方'], ['store', '会社の紹介'], ['star', '性格・背景']]
  st.forEach(([ic, label], i) => tile(s, ic, 0.5 + (i % 2) * 2.0, 1.0 + Math.floor(i / 2) * 1.85, 1.85, 1.7, label, { size: 12.5 }))
  phone(s, 4.7, 0.98, 2.3, 4.0, '', [
    { mine: 'モニタリングはどこで入力するの？', h: 0.62 },
    { kind: 'guide', title: 'モニタリング', body: '「モニタリング」の画面で月を選び、担当の方の行の「記録する」から入力します。\nこちらから開けます：https://…', h: 2.0 },
  ])
  points(s, 7.2, 1.25, 2.3, [['robot', 'AI だと\n名乗る', C.accent4], ['doc', 'マニュアルから\n答える', C.accent4], ['link', '開ける画面へ\n案内', C.accent4]])
  s.addNotes('AI 社員には、会社が決めた名前と人柄を持たせられます。管理者が画面で、呼び名、話し方、会社の紹介、性格や背景を決めます。署名は「さくら（ケアビリング AI 秘書）」のようになり、AI であることを示します。人と間違えさせることはしません。名前や人柄はあくまで話し方の設定で、本人の権限を超えない、確定は人がする、という決まりは変わりません。システムの使い方もチャットで聞けます。AI 社員はそのシステムのマニュアルだけを根拠に答え、その人が開ける画面へのリンクを付けます。マニュアルに無いことは推測で答えず、わからないと伝えます。（画面の内容は架空の例です。）')
}

function slideRecipients(sec) {
  const s = content(sec, '一人ひとりに、関係することだけ')
  node(s, 'bell', 1.05, 1.85, 0.85, '訪問記録が未提出', { fill: C.accent6, size: 11.5, labelW: 1.6 })
  arrow(s, 1.6, 2.28, 2.2, 2.28, { color: C.accent5, width: 2.5 })
  badge(s, 'storage', 2.3, 1.73, 1.1, C.accent2, 'ink')
  T(s, [{ text: '業務システム', options: { bold: true, fontSize: 12.5, color: C.text2, breakLine: true } }, { text: '届け先を決める', options: { bold: true, fontSize: 11, color: C.accent2 } }], { x: 1.9, y: 2.9, w: 1.9, h: 0.6, align: 'center', margin: 0 })
  const rows = [
    ['person', '担当の職員', C.accent2, 'request', '記録の提出をお願いします', false],
    ['owner', 'サービス責任者', C.accent1, 'info', '未提出 2 件（担当へ依頼済み）', false],
    ['team', 'ほかの職員', 'B9C6C4', null, '届きません', true],
  ]
  rows.forEach(([ic, who, fill, kind, text, off], i) => {
    const y = 1.0 + i * 1.12
    arrow(s, 3.5, 2.28, 4.6, y + 0.32, { color: off ? 'B9C6C4' : C.accent5, width: 1.75, dash: off ? 'dash' : undefined })
    badge(s, ic, 4.7, y, 0.64, fill)
    T(s, who, { x: 5.42, y, w: 1.35, h: 0.64, fontSize: 12, bold: true, color: off ? C.accent5 : C.text2, valign: 'middle', margin: 0 })
    if (off) {
      box(s, 6.8, y + 0.02, 2.7, 0.6, C.background1, { line: 'B9C6C4', dash: 'dash', r: 0.08 })
      T(s, text, { x: 6.8, y: y + 0.02, w: 2.7, h: 0.6, fontSize: 11.5, bold: true, color: C.accent5, align: 'center', valign: 'middle' })
    } else {
      const [label, lc] = LABEL[kind]
      box(s, 6.8, y + 0.02, 2.7, 0.6, C.background1, { line: 'D5DEDC', r: 0.08, shadow: true })
      T(s, [{ text: label, options: { bold: true, fontSize: 9, color: lc, breakLine: true } }, { text, options: { fontSize: 10 } }], { x: 6.9, y: y + 0.04, w: 2.55, h: 0.56, valign: 'middle' })
    }
  })
  icon(s, 'groupOff', 4.75, 4.25, 0.42, 'gray')
  T(s, 'グループチャットには、業務の中身を流さない', { x: 5.25, y: 4.23, w: 4.3, h: 0.46, fontSize: 12, bold: true, color: C.accent5, valign: 'middle' })
  punch(s, '誰に届けるかは、AI ではなく業務システムが決める')
  s.addNotes('AI 社員が送るメッセージは、関係する人にだけ届きます。たとえば訪問記録が未提出のとき、担当の職員には【対応のお願い】、サービス責任者には【ご報告】が届き、ほかの職員には届きません。誰に届けるかは、役割・所属・担当の範囲をもとに業務システムが決め、AI が宛先を選ぶことはありません。グループチャットには、業務の中身は流さないのが既定です。')
}

function slideArch(sec, { short = false } = {}) {
  const s = content(sec, short ? 'どの IT システムにも、AI 社員をつなぐ' : 'しくみ：いまの業務システムに、AI 社員をつなぐ')
  // 業務システム
  box(s, 0.5, 1.0, 2.35, 3.45, C.background2, { line: C.accent5, r: 0.14 })
  icon(s, 'storage', 1.33, 1.12, 0.7, 'dark')
  T(s, short ? '業務システム\n（業種を問わず）' : '業務システム', { x: 0.5, y: 1.85, w: 2.35, h: short ? 0.62 : 0.4, fontSize: 13.5, bold: true, color: C.text2, align: 'center', valign: 'middle' })
  const inner = short
    ? [['elderly', '介護'], ['inspect', '設備点検'], ['receipt', '請求・会計'], ['staff', '人事・勤怠']]
    : [['storage', 'データ'], ['rule', 'ルール'], ['tap', '承認'], ['history', '記録']]
  inner.forEach(([ic, label], i) => {
    const x = 0.65 + (i % 2) * 1.1, y = (short ? 2.62 : 2.45) + Math.floor(i / 2) * 0.82
    icon(s, ic, x + 0.3, y, 0.42, 'teal')
    T(s, label, { x: x - 0.05, y: y + 0.44, w: 1.1, h: 0.3, fontSize: 10.5, bold: true, color: C.text2, align: 'center', margin: 0 })
  })
  // ブリッジ
  arrow(s, 2.92, 2.72, 3.25, 2.72, { color: C.accent2, width: 3, both: true })
  box(s, 3.3, 1.55, 1.0, 2.35, C.accent2, { r: 0.14 })
  icon(s, 'link', 3.5, 1.85, 0.6, 'ink')
  T(s, 'ブリッジ', { x: 3.3, y: 2.55, w: 1.0, h: 0.38, fontSize: 12.5, bold: true, color: C.text1, align: 'center', valign: 'middle', margin: 0 })
  T(s, 'つなぐ\n部分', { x: 3.3, y: 2.95, w: 1.0, h: 0.6, fontSize: 9.5, color: C.text1, align: 'center', margin: 0 })
  arrow(s, 4.35, 2.72, 4.68, 2.72, { color: C.accent2, width: 3, both: true })
  // AI 社員
  box(s, 4.73, 1.0, 2.1, 3.45, C.accent1, { r: 0.14 })
  icon(s, 'robot', 5.35, 1.2, 0.85, 'orange')
  T(s, 'AI 社員', { x: 4.73, y: 2.12, w: 2.1, h: 0.45, fontSize: 16, bold: true, color: C.background1, align: 'center', valign: 'middle' })
  ;[['brain', '考える'], ['memo', '覚える'], ['run', '動く']].forEach(([ic, label], i) => {
    const y = 2.68 + i * 0.52
    icon(s, ic, 5.15, y, 0.38, 'w')
    T(s, label, { x: 5.62, y, w: 1.1, h: 0.38, fontSize: 12, bold: true, color: C.background1, valign: 'middle', margin: 0 })
  })
  arrow(s, 6.9, 2.72, 7.23, 2.72, { color: C.accent1, width: 3, both: true })
  // いつものチャット
  box(s, 7.28, 1.0, 2.22, 3.45, C.background1, { line: C.accent1, r: 0.14 })
  T(s, 'いつものチャット', { x: 7.28, y: 1.08, w: 2.22, h: 0.38, fontSize: 12.5, bold: true, color: C.text2, align: 'center', valign: 'middle' })
  ;[['line', 'green', 'LINE'], ['teams', 'dark', 'Teams'], ['slack', 'teal', 'Slack'], ['wechat', 'green', 'WeChat']].forEach(([ic, c, label], i) => {
    const x = 7.45 + (i % 2) * 0.95, y = 1.55 + Math.floor(i / 2) * 0.72
    icon(s, ic, x + 0.22, y, 0.4, c)
    T(s, label, { x: x - 0.05, y: y + 0.41, w: 0.95, h: 0.24, fontSize: 8.5, color: C.accent5, align: 'center', margin: 0 })
  })
  T(s, 'ほか', { x: 7.28, y: 2.98, w: 2.22, h: 0.24, fontSize: 9, color: C.accent5, align: 'center', margin: 0 })
  ;[['person', '職員'], ['owner', '管理者']].forEach(([ic, label], i) => {
    const cx = 7.85 + i * 1.1
    node(s, ic, cx, 3.3, 0.52, label, { fill: C.accent6, size: 10, labelW: 1.0 })
  })
  punch(s, short ? '業種・言語・作り方を問わず、同じ方法で' : '決めた結果は、業務システムの中に記録', short ? C.accent1 : C.accent3)
  s.addNotes(short
    ? '介護、設備点検、請求・会計、人事・勤怠など、どの業務システムにも同じ方法でつなげます。業務システムに「ブリッジ」と呼ぶつなぐ部分を足すと、AI 社員が付き、LINE、Teams、Slack、WeChat など職員がふだん使っているチャットで働きます。データ・ルール・承認は業務システムの中のままで、決めた結果も業務システムに記録されます。'
    : '全体像です。左が御社の業務システムで、データ、ルール、承認、記録は今のシステムの中のままです。そこに「ブリッジ」と呼ぶ、つなぐ部分を足します。真ん中の AI 社員が、考え、覚え、自分から動き、LINE、Teams、Slack、WeChat、WeCom、Lark など、職員がふだん使っているチャットで働きます。最終的に決めるのは人で、承認や確定は業務システムの中に記録されます。')
}

function slideAnySystem(sec) {
  const s = content(sec, '業種を選ばない、汎用のしくみ')
  const left = [['elderly', '介護', '導入済み'], ['inspect', '設備点検', '見本'], ['receipt', '請求・会計'], ['staff', '人事・勤怠']]
  const right = [['truck', '物流'], ['build', '建設'], ['store', '店舗・販売'], ['event', '予約・受付']]
  const hub = [5.0, 2.62]
  ;[[left, 0.5], [right, 7.1]].forEach(([list, x]) => {
    list.forEach(([ic, label, tag], i) => {
      const y = 1.0 + i * 0.92
      arrow(s, x < 5 ? x + 2.45 : x - 0.05, y + 0.36, x < 5 ? 3.95 : 6.05, hub[1], { color: 'B9C6C4', width: 1.5, head: false })
      box(s, x, y, 2.4, 0.72, tag ? 'E3F1EE' : C.background2, { line: tag ? C.accent4 : C.accent1, r: 0.36 })
      icon(s, ic, x + 0.2, y + 0.13, 0.46, tag ? 'green' : 'teal')
      T(s, label, { x: x + 0.75, y, w: 1.0, h: 0.72, fontSize: 13, bold: true, color: C.text2, valign: 'middle', margin: 0 })
      if (tag) chip(s, x + 1.55, y + 0.21, 0.75, 0.3, tag, { fill: C.accent4, color: C.background1, size: 9 })
    })
  })
  badge(s, 'hub', hub[0] - 1.0, hub[1] - 1.0, 2.0, C.accent1)
  T(s, 'どの IT システムも\n同じ方法で', { x: 3.6, y: 3.7, w: 2.8, h: 0.7, fontSize: 14, bold: true, color: C.text2, align: 'center' })
  T(s, '介護は導入済み、設備点検は見本。ほかは同じ方法でつなげる業務の例です', { x: 0.5, y: 4.75, w: 9, h: 0.3, fontSize: 10.5, color: C.accent5, align: 'center' })
  s.addNotes('Bizアシスタントは、特定の業種向けの製品ではありません。自分の職員・役割・ログインを持つ業務システムなら、業種・言語・作り方を問わず、同じ方法でつなげます。介護の業務システム「ケアビリング」は導入済みで、設備点検は見本として新しく作ったシステムです。物流、建設、店舗・販売、予約・受付なども、同じ方法でつなげる業務の例です。新しく業務システムを作る場合も、同じ仕組みが使えます。')
}

function slideConnect(sec) {
  const s = content(sec, 'システムに足すのは、「ブリッジ」だけ')
  box(s, 0.5, 1.0, 4.1, 3.65, C.background2, { line: C.accent5, r: 0.14 })
  T(s, '業務システムに足すもの', { x: 0.5, y: 1.06, w: 4.1, h: 0.4, fontSize: 13.5, bold: true, color: C.text2, align: 'center', valign: 'middle' })
  ;[['link', '決まった形の窓口'], ['doc', 'システムの自己紹介'], ['ok', '自分のログインで本人連携'], ['rule', '届け先の規則（システムが判断）']].forEach(([ic, label], i) => {
    const y = 1.6 + i * 0.74
    badge(s, ic, 0.72, y, 0.52, C.accent2, 'ink')
    T(s, label, { x: 1.36, y, w: 3.15, h: 0.52, fontSize: 12.5, bold: true, color: C.text2, valign: 'middle', margin: 0 })
  })
  T(s, '＋', { x: 4.6, y: 2.45, w: 0.8, h: 0.6, fontSize: 30, bold: true, color: C.accent2, align: 'center', valign: 'middle', margin: 0 })
  box(s, 5.4, 1.0, 4.1, 3.65, C.text2, { r: 0.14 })
  T(s, 'Bizアシスタントが用意するもの', { x: 5.4, y: 1.06, w: 4.1, h: 0.4, fontSize: 13.5, bold: true, color: C.background1, align: 'center', valign: 'middle' })
  ;[['chat', 'チャットとの接続'], ['robot', 'AI 社員のしくみ'], ['bell', '知らせ・承認・報告'], ['brain', '記憶と人柄'], ['shield', '送信の守り'], ['test', 'テスト一式']].forEach(([ic, label], i) => {
    const x = 5.55 + (i % 2) * 1.95, y = 1.62 + Math.floor(i / 2) * 0.98
    icon(s, ic, x, y + 0.04, 0.42, 'orange')
    T(s, label, { x: x + 0.48, y, w: 1.42, h: 0.5, fontSize: 11, bold: true, color: C.background1, valign: 'middle', margin: 0 })
  })
  punch(s, '新しく作るシステムも、同じしくみで', C.accent1)
  s.addNotes('業務システムの側に足していただくのは「ブリッジ」と呼ぶ部分です。AI が業務データを読み、提案を受け取るための決まった形の窓口、何を知らせ誰が何をしてよいかを書いたシステムの自己紹介、職員が自分のログインのまま自分のチャットを結び付ける画面、そして誰に知らせるかを判断する規則です。どれも業務システムが自分で持つべき判断で、AI には任せません。チャットとの接続、AI 社員の仕組み、知らせ・承認・報告、記憶と人柄、送信の守り、確かめるためのテスト一式は、Bizアシスタントが用意します。どのくらいの作業になるかは、最初の診断で見積もります。')
}

function slideSafety(sec) {
  const s = content(sec, 'AI に任せても安心な、6 つのしくみ')
  const items = [['tap', '決めるのは人'], ['eye', '読む・提案するだけ'], ['lock', '本人の権限まで'], ['rule', '届け先はシステムが決める'], ['privacy', '個人情報を残さない'], ['history', 'すべて記録に残る']]
  items.forEach(([ic, label], i) => {
    const x = 0.5 + (i % 3) * 3.05, y = 1.0 + Math.floor(i / 3) * 1.95
    tile(s, ic, x, y, 2.85, 1.78, label, { fill: i === 0 ? C.text2 : C.background2, line: i === 0 ? C.text2 : C.accent1, iconColor: i === 0 ? 'orange' : 'teal', textColor: i === 0 ? C.background1 : C.text2, size: 14.5 })
  })
  s.addNotes('AI に任せても安心な理由は 6 つです。確定・承認・発行・支払・金額の決定は、いつも人が業務システムで行います。AI は読むことと提案することだけです。AI が使えるのはその職員の権限の範囲までで、それを超えることはできません。誰に届けるかは業務システムが決めます。チャットには個人の情報を書かず、送る前に確かめます。通知・承認・提案の採否はすべて記録に残り、後から確かめられます。これらの約束は、52 項目の自動チェックで確かめています。')
}

function slideOpsAI(sec) {
  const s = content(sec, 'システムも、自分で育つ')
  box(s, 0.5, 1.0, 2.75, 1.65, 'E3F1EE', { line: C.accent4, r: 0.14 })
  icon(s, 'code', 0.68, 1.15, 0.5, 'green')
  T(s, '開発環境', { x: 1.25, y: 1.12, w: 1.9, h: 0.5, fontSize: 14, bold: true, color: C.accent4, valign: 'middle', margin: 0 })
  T(s, 'AI が直して、\nそのまま反映', { x: 0.65, y: 1.72, w: 2.5, h: 0.8, fontSize: 13, bold: true, color: C.text2, valign: 'middle' })
  box(s, 0.5, 2.9, 2.75, 1.65, 'FBEDEA', { line: C.accent3, r: 0.14 })
  icon(s, 'shield', 0.68, 3.05, 0.5, 'red')
  T(s, '本番', { x: 1.25, y: 3.02, w: 1.9, h: 0.5, fontSize: 14, bold: true, color: C.accent3, valign: 'middle', margin: 0 })
  T(s, '確かめてから、\n担当者が承認', { x: 0.65, y: 3.62, w: 2.5, h: 0.8, fontSize: 13, bold: true, color: C.text2, valign: 'middle' })
  ring(s, [
    ['bell', '見つける'], ['search', '調べる'], ['plan', '計画'], ['tap', '承認', C.accent2],
    ['code', '直す'], ['test', '試す'], ['rocket', '反映'], ['brain', '覚える'],
  ], 6.55, 2.95, 2.45, 1.42, 0.62, { labelSize: 11 })
  T(s, [{ text: '運用 AI', options: { bold: true, fontSize: 19, color: C.text2, breakLine: true } }, { text: '使うほど育つ', options: { fontSize: 11.5, color: C.accent5 } }], { x: 5.35, y: 2.5, w: 2.4, h: 0.9, align: 'center', valign: 'middle' })
  s.addNotes('Bizアシスタントには、もう一人の AI「運用 AI」がいます。AI 社員が職員と一緒に働くのに対し、運用 AI はシステムそのものを見守り、直し、育てます。不具合やエラー、チームの要望を見つけ、調べ、計画を出し、人の承認（オレンジ）を経て直し、テストし、反映して、学んだことを覚えます。開発環境では AI が直してそのまま反映します。本番は、検証環境で確かめてから、担当者がチャットで判断します。AI が本番を一人で変えることはありません。運用 AI は業務システムとは別のサーバーで動くので、システムが止まっても記録を残して動き続けます。')
}

function slideEffect(sec) {
  const s = content(sec, '試算例：1 日 30 分の削減が、月 300 時間に')
  chip(s, 6.3, 0.98, 3.2, 0.36, '試算例（前提を置いた参考値）', { fill: C.accent2, color: C.text1, size: 11.5 })
  const parts = [['team', '30 名', '職員'], ['clock', '30 分', '1 人 1 日'], ['event', '20 日', 'ひと月']]
  parts.forEach(([ic, v, label], i) => {
    const x = 0.5 + i * 1.8
    box(s, x, 1.5, 1.5, 1.85, C.background2, { line: C.accent1 })
    icon(s, ic, x + 0.5, 1.62, 0.5, 'teal')
    T(s, v, { x, y: 2.15, w: 1.5, h: 0.6, fontSize: 24, bold: true, color: C.accent1, align: 'center', valign: 'middle', margin: 0 })
    T(s, label, { x, y: 2.78, w: 1.5, h: 0.36, fontSize: 11.5, bold: true, color: C.text2, align: 'center', margin: 0 })
    if (i < 2) T(s, '×', { x: x + 1.5, y: 2.1, w: 0.3, h: 0.6, fontSize: 20, bold: true, color: C.accent5, align: 'center', valign: 'middle', margin: 0 })
  })
  T(s, '＝', { x: 5.6, y: 2.1, w: 0.5, h: 0.6, fontSize: 24, bold: true, color: C.accent5, align: 'center', valign: 'middle', margin: 0 })
  box(s, 6.1, 1.5, 3.4, 1.85, C.accent1, { r: 0.14 })
  T(s, '300 時間', { x: 6.1, y: 1.65, w: 3.4, h: 1.0, fontSize: 40, bold: true, color: C.background1, align: 'center', valign: 'middle' })
  T(s, '1 か月あたり', { x: 6.1, y: 2.65, w: 3.4, h: 0.45, fontSize: 14, bold: true, color: C.background2, align: 'center' })
  T(s, '減る時間', { x: 0.5, y: 3.6, w: 1.3, h: 0.5, fontSize: 12.5, bold: true, color: C.accent5, valign: 'middle' })
  ;[['search', '確認'], ['hourglass', '催促'], ['tap', '承認の手間'], ['doc', '報告書']].forEach(([ic, label], i) => {
    const x = 1.8 + i * 1.95
    box(s, x, 3.6, 1.8, 0.5, C.background1, { line: C.accent1, r: 0.25 })
    icon(s, ic, x + 0.15, 3.66, 0.38, 'teal')
    T(s, label, { x: x + 0.58, y: 3.6, w: 1.2, h: 0.5, fontSize: 12, bold: true, color: C.text2, valign: 'middle', margin: 0 })
  })
  T(s, '時間あたり人件費 2,000 円とすると、月約 60 万円に相当。実際の効果は業務と使い方で変わります', { x: 0.5, y: 4.45, w: 9, h: 0.5, fontSize: 11.5, color: C.accent5, align: 'center', valign: 'middle' })
  s.addNotes('効果の大きさをイメージしていただくための試算例です。実績や保証ではなく、前提を置いた参考値です。対象の職員 30 名、1 人あたり 1 日 30 分、確認・催促・承認・報告の時間が減るとし、月 20 日稼働とすると、月 300 時間になります。時間あたりの人件費を 2,000 円と置くと、月約 60 万円に相当する時間です。実際には御社の人数や業務によって大きく変わりますので、御社の数字で一緒に試算させてください。')
}

function slideProof(sec) {
  const s = content(sec, '実績：介護の業務システムで動いています')
  box(s, 0.5, 1.0, 3.6, 3.65, C.text2, { r: 0.14 })
  badge(s, 'elderly', 1.65, 1.2, 1.3, C.accent1)
  T(s, 'ケアビリング', { x: 0.5, y: 2.6, w: 3.6, h: 0.5, fontSize: 20, bold: true, color: C.background1, align: 'center', valign: 'middle' })
  T(s, '介護事業所の請求・記録・シフト', { x: 0.5, y: 3.12, w: 3.6, h: 0.4, fontSize: 12, color: C.background2, align: 'center' })
  chip(s, 1.15, 3.75, 2.3, 0.42, 'デモ環境で稼働中', { fill: C.accent2, color: C.text1, size: 12.5 })
  const stats = [['6 種類', 'チャットに対応'], ['52 項目', '安全の自動チェック'], ['9 つ', 'AI 社員の部品'], ['2 分', '検知から自動更新\n（開発環境）']]
  stats.forEach(([v, label], i) => {
    const x = 4.4 + (i % 2) * 2.6, y = 1.0 + Math.floor(i / 2) * 1.88
    box(s, x, y, 2.5, 1.75, C.background2, { line: C.accent1 })
    T(s, v, { x, y: y + 0.12, w: 2.5, h: 0.8, fontSize: 30, bold: true, color: C.accent1, align: 'center', valign: 'middle' })
    T(s, label, { x, y: y + 0.95, w: 2.5, h: 0.7, fontSize: 12, bold: true, color: C.text2, align: 'center', valign: 'top' })
  })
  s.addNotes('介護事業所向けの業務システム「ケアビリング」が、この仕組みで AI 社員と働く最初の導入例です。請求・訪問記録・シフト・帳票の業務で実装済みで、デモ環境で動いています。チャットは Slack、LINE、Teams、WeCom、個人の WeChat、Lark の 6 種類に対応しています。安全の約束は 52 項目の自動チェックで確かめ、AI 社員の働きは 9 つの部品で用意しています。運用 AI は、開発環境で新しい版を検知してから 2 分で入れ替えを終えた記録があります（2026-11-12、人の操作なし）。')
}

function slideAdopt(sec) {
  const s = content(sec, '導入は、ひとつの業務から')
  chain(s, [
    ['search', '診断', C.accent6], ['link', 'ブリッジ', C.accent2], ['ok', '本人連携'], ['test', '試行'], ['rocket', '本番'], ['trendUp', '広げる', C.accent4],
  ], 0.6, 1.1, 8.8, 0.95, { size: 13 })
  box(s, 0.5, 2.65, 9.0, 0.9, C.background2, { line: C.background2, r: 0.45 })
  arrow(s, 0.9, 3.1, 9.1, 3.1, { color: C.accent4, width: 4 })
  T(s, '効果を見ながら、業務と人を広げる', { x: 1.5, y: 2.7, w: 7, h: 0.38, fontSize: 14, bold: true, color: C.accent4, align: 'center' })
  ;[['search', '診断で作業量を見積もる'], ['chat', '職員はいつものチャット'], ['eye', '小さく始めて確かめる']].forEach(([ic, label], i) => {
    const x = 0.5 + i * 3.05
    box(s, x, 3.8, 2.85, 0.7, C.background1, { line: C.accent1, r: 0.35 })
    icon(s, ic, x + 0.2, 3.92, 0.46, 'teal')
    T(s, label, { x: x + 0.75, y: 3.8, w: 2.05, h: 0.7, fontSize: 12, bold: true, color: C.text2, valign: 'middle', margin: 0 })
  })
  punch(s, 'まずは、ひとつの業務から', C.accent1)
  s.addNotes('導入は、いまのシステムと業務の診断から始めます。ブリッジを足し、職員が自分のチャットを結び付け、ひとつの業務で試します。効果と使われ方を確かめてから本番に移り、業務と対象の人を広げていきます。期間は業務の範囲と今のシステムの状態によって変わるため、診断のときにお示しします。')
}

function slideClosing(sec, { short = false } = {}) {
  const s = pres.addSlide({ masterName: 'TITLE_DARK', sectionTitle: sec })
  s.addText('記録するシステムを、\n考えて動くシステムに', { placeholder: 'title', fontFace: F.head, lang: LANG })
  s.addText([{ text: 'Bizアシスタント', options: { bold: true, color: C.accent2, breakLine: true } }, { text: short ? 'まずは、ひとつの業務から' : 'どの IT システムにも、AI 社員を' }], { placeholder: 'body', fontFace: F.body, lang: LANG })
  const tiles = short
    ? [['brain', '考える'], ['memo', '覚える'], ['run', '自分から動く'], ['tap', '決めるのは人'], ['loop', '自分で育つ'], ['savings', '月 300 時間\n（試算例）']]
    : [['brain', '考える'], ['memo', '覚える'], ['run', '自分から動く'], ['tap', '決めるのは人'], ['hub', 'どのシステムにも'], ['loop', '自分で育つ']]
  tiles.forEach(([ic, label], i) => {
    const x = 6.1 + (i % 2) * 1.75, y = 0.55 + Math.floor(i / 2) * 1.55
    const last = i === 5
    box(s, x, y, 1.6, 1.4, last ? C.accent2 : C.accent1, { r: 0.14 })
    icon(s, ic, x + 0.5, y + 0.14, 0.6, last ? 'ink' : 'w')
    T(s, label, { x: x + 0.05, y: y + 0.78, w: 1.5, h: 0.55, fontSize: 11.5, bold: true, color: last ? C.text1 : C.background1, align: 'center', valign: 'middle', margin: 0 })
  })
  s.addNotes(short
    ? 'Bizアシスタントは、記録して待つだけだった IT システムを、考え、覚え、自分から職責を果たすシステムに変えます。決めるのはいつも人で、システムは運用 AI によって自分で育ちます。試算例では、30 名の職場で月 300 時間ほどの確認・催促・報告の時間が減ります。まずは、ひとつの業務から始めましょう。'
    : 'まとめです。Bizアシスタントは、記録して待つだけだった IT システムを、考え、覚え、自分から職責を果たすシステムに変えます。決めるのはいつも人です。業種を問わずどのシステムにもつなげ、運用 AI によってシステムそのものも育ちます。まずは、ひとつの業務の診断から始めましょう。')
}

// ════════════════════════════════════════════════════════════════════════
function build() {
  pres.addSection({ title: 'はじめに' })
  slideCover('はじめに')
  slideBeforeAfter('はじめに')
  slideWorries('はじめに')
  pres.addSection({ title: '3 つの力' })
  slidePowers('3 つの力')
  slideThink('3 つの力')
  slideMemory('3 つの力')
  slideAct('3 つの力')
  pres.addSection({ title: '一日の様子' })
  slideDay('一日の様子')
  slideMorning('一日の様子')
  slideDecide('一日の様子')
  slidePersona('一日の様子')
  slideRecipients('一日の様子')
  pres.addSection({ title: 'しくみ' })
  slideArch('しくみ')
  slideAnySystem('しくみ')
  slideConnect('しくみ')
  slideSafety('しくみ')
  pres.addSection({ title: '自分で育つ' })
  slideOpsAI('自分で育つ')
  pres.addSection({ title: '効果と導入' })
  slideEffect('効果と導入')
  slideProof('効果と導入')
  slideAdopt('効果と導入')
  pres.addSection({ title: 'まとめ' })
  slideClosing('まとめ')
}

// 精簡版（8 枚）：表紙 → これまでとこれから → 3 つの力 → 一日 → どのシステムにも → 安心 → 自分で育つ → まとめ
function buildShort() {
  const sec = 'Bizアシスタント'
  pres.addSection({ title: sec })
  slideCover(sec)
  slideBeforeAfter(sec)
  slidePowers(sec)
  slideDay(sec)
  slideArch(sec, { short: true })
  slideSafety(sec)
  slideOpsAI(sec)
  slideClosing(sec, { short: true })
}

// ── theme post-processing（運用 AI の営業資料と同じ。言語は ja-JP） ─────────
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
  if (SHORT) buildShort()
  else build()
  await pres.writeFile({ fileName: OUT })
  await finishTheme(OUT, THEME)
  console.log('wrote', OUT)
})().catch((e) => { console.error(e); process.exit(1) })
