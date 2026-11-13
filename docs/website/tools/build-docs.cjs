// Build the documentation pages of the website mock from the repository's Markdown (ja = original, en / zh = translations).
//   NODE_PATH=<dir with markdown-it 14> node docs/website/tools/build-docs.cjs
// Output: docs/website/mock/technical-guide.html, docs/website/mock/guideline.html — one page per document, the three languages
// as <article data-doc-lang> blocks switched by the site's language menu (assets/site.js dispatches `biz:lang`).
'use strict'
const fs = require('fs')
const path = require('path')
const MarkdownIt = require('markdown-it')

const ROOT = path.resolve(__dirname, '../../..') // repository root
const MOCK = path.join(ROOT, 'docs/website/mock')
const GH = 'https://github.com/ITC-cloud-soft/biz-ai'
const LANGS = ['ja', 'en', 'zh']
const SUFFIX = { ja: '', en: '.en', zh: '.zh-CN' }

const DOCS = [
  {
    id: 'technical-guide',
    file: 'docs/slides/manual/biz-assistant-framework-technical-guide.md',
    page: 'technical-guide.html',
    eyebrow: 'Technical guide',
    title: { ja: 'Biz Assistant Framework 技術解説', en: 'Biz Assistant Framework Technical Guide', zh: 'Biz Assistant Framework 技术解说' },
    lead: {
      ja: '技術担当者向け。構成・Bridge v1 と manifest・主な流れ・安全と個人情報・つなぎ方と作り方・品質と提供状況。',
      en: 'For engineers: architecture, Bridge v1 and the manifest, the main flows, safety and personal data, connecting and building a system, quality and status.',
      zh: '面向技术人员：架构、Bridge v1 与 manifest、主要流程、安全与个人信息、接入与构建方式、质量与提供状况。',
    },
  },
  {
    id: 'guideline',
    file: 'docs/GUIDELINE.md',
    page: 'guideline.html',
    eyebrow: 'Development guideline',
    title: { ja: '開発ガイドライン', en: 'Development Guideline', zh: '开发指南' },
    lead: {
      ja: '業務システムを AI 社員につなぐための正本：チェックリスト・手順・拡張点・MUST / SHOULD・テスト・版の管理・FAQ。',
      en: 'The source of truth for connecting a business system to AI employees: checklist, steps, extension points, MUST / SHOULD rules, testing, versioning, FAQ.',
      zh: '把业务系统接入 AI 员工的权威文档：检查清单、步骤、扩展点、MUST / SHOULD 规则、测试、版本管理、FAQ。',
    },
  },
]

const UI = {
  ja: { toc: '目次', src: 'GitHub で Markdown を見る', note: '', other: 'ほかのドキュメント' },
  en: { toc: 'Contents', src: 'View the Markdown on GitHub', note: 'Translated from the Japanese original. If they differ, the Japanese version is authoritative.', other: 'Other documents' },
  zh: { toc: '目录', src: '在 GitHub 上查看 Markdown', note: '本文译自日文原文。如有出入，以日文版为准。', other: '其他文档' },
}

// GitHub-compatible heading slug
function slug(text) {
  return text.trim().toLowerCase()
    .replace(/<[^>]+>/g, '')
    .replace(/[^\p{L}\p{M}\p{N}\p{Pc}\- ]/gu, '')
    .replace(/ /g, '-')
}
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function langFile(doc, lang) {
  const ext = path.extname(doc.file)
  return doc.file.slice(0, -ext.length) + SUFFIX[lang] + ext
}

// Pass 1: headings (level, text, slug) of every document and language
function headingsOf(src) {
  const md = new MarkdownIt({ html: true })
  const tokens = md.parse(src, {})
  const out = []; const seen = {}
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].type !== 'heading_open') continue
    const text = tokens[i + 1].children.filter((t) => t.type === 'text' || t.type === 'code_inline').map((t) => t.content).join('')
    let s = slug(text)
    if (seen[s] !== undefined) { seen[s]++; s = `${s}-${seen[s]}` } else seen[s] = 0
    out.push({ level: +tokens[i].tag.slice(1), text, slug: s })
  }
  return out
}

const SRC = {}; const HEAD = {}; const MAP = {}
for (const doc of DOCS) {
  SRC[doc.id] = {}; HEAD[doc.id] = {}; MAP[doc.id] = {}
  for (const lang of LANGS) {
    const f = path.join(ROOT, langFile(doc, lang))
    if (!fs.existsSync(f)) { console.warn(`missing ${langFile(doc, lang)} — the ${lang} article falls back to Japanese`); continue }
    SRC[doc.id][lang] = fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n')
    HEAD[doc.id][lang] = headingsOf(SRC[doc.id][lang])
  }
  const ja = HEAD[doc.id].ja
  for (const lang of LANGS) {
    const h = HEAD[doc.id][lang]
    if (!h) continue
    if (h.length !== ja.length) console.warn(`${doc.id} ${lang}: ${h.length} headings vs ${ja.length} in Japanese — anchors fall back to their own`)
    const m = {}
    ja.forEach((x, i) => { if (h.length === ja.length) m[x.slug] = h[i].slug })
    MAP[doc.id][lang] = m
  }
}

const BROKEN = []
function mapAnchor(docId, lang, anchor) {
  const a = decodeURIComponent(anchor)
  const own = (HEAD[docId][lang] || HEAD[docId].ja).map((h) => h.slug)
  if (own.includes(a)) return a
  const m = MAP[docId][lang] || {}
  if (m[a]) return m[a]
  BROKEN.push(`${docId}/${lang}: #${a}`)
  return a
}

// Translations are written with the Japanese link targets; point them at their own language (anchors and the sibling
// translated documents) so the .en.md / .zh-CN.md files also work on GitHub. Idempotent.
for (const doc of DOCS) {
  for (const lang of ['en', 'zh']) {
    const src = SRC[doc.id][lang]
    if (!src) continue
    const baseDir = path.posix.dirname(doc.file)
    let inFence = false
    const fixed = src.split('\n').map((line) => {
      if (/^\s*```/.test(line)) { inFence = !inFence; return line }
      if (inFence) return line
      return line.replace(/\]\(([^)\s]+)\)/g, (m, href) => {
        if (href.startsWith('#')) return `](#${mapAnchor(doc.id, lang, href.slice(1))})`
        if (/^[a-z]+:/i.test(href)) return m
        const [p, anchor] = href.split('#')
        const repoPath = path.posix.normalize(path.posix.join(baseDir, p))
        const target = DOCS.find((d) => d.file === repoPath || langFile(d, lang) === repoPath)
        if (!target || !SRC[target.id][lang]) return m
        const rel = path.posix.relative(baseDir, langFile(target, lang))
        return `](${rel}${anchor ? '#' + mapAnchor(target.id, lang, anchor) : ''})`
      })
    }).join('\n')
    if (fixed !== src) {
      fs.writeFileSync(path.join(ROOT, langFile(doc, lang)), fixed)
      SRC[doc.id][lang] = fixed
      console.log(`fixed links in ${langFile(doc, lang)}`)
    }
  }
}

function render(doc, lang) {
  const src = SRC[doc.id][lang] ?? SRC[doc.id].ja
  const useLang = SRC[doc.id][lang] ? lang : 'ja'
  const md = new MarkdownIt({ html: true, linkify: false })
  const baseDir = path.posix.dirname(doc.file)
  const seen = {}

  md.core.ruler.push('ids_links', (state) => {
    const t = state.tokens
    for (let i = 0; i < t.length; i++) {
      if (t[i].type === 'heading_open') {
        const text = t[i + 1].children.filter((c) => c.type === 'text' || c.type === 'code_inline').map((c) => c.content).join('')
        let s = slug(text)
        if (seen[s] !== undefined) { seen[s]++; s = `${s}-${seen[s]}` } else seen[s] = 0
        t[i].attrSet('id', s)
      }
      if (t[i].type === 'inline' && t[i].children) {
        for (const c of t[i].children) {
          if (c.type !== 'link_open') continue
          const href = c.attrGet('href') || ''
          c.attrSet('href', rewrite(href))
          if (/^https?:/.test(c.attrGet('href')) && !c.attrGet('href').startsWith('#')) { c.attrSet('target', '_blank'); c.attrSet('rel', 'noopener') }
        }
      }
    }
  })
  function rewrite(href) {
    if (href.startsWith('#')) return '#' + mapAnchor(doc.id, useLang, href.slice(1))
    if (/^[a-z]+:/i.test(href)) return href
    const [p, anchor] = href.split('#')
    const repoPath = path.posix.normalize(path.posix.join(baseDir, p))
    const target = DOCS.find((d) => d.file === repoPath || langFile(d, 'en') === repoPath || langFile(d, 'zh') === repoPath)
    if (target) return target.page + (anchor ? '#' + mapAnchor(target.id, useLang, anchor) : '')
    const isDir = p.endsWith('/') || !path.posix.extname(p)
    return `${GH}/${isDir ? 'tree' : 'blob'}/main/${repoPath.replace(/\/$/, '')}${anchor ? '#' + anchor : ''}`
  }

  md.renderer.rules.fence = (tokens, idx) => {
    const tok = tokens[idx]; const info = (tok.info || '').trim().split(/\s+/)[0]
    if (info === 'mermaid') return `<div class="mmd"><pre class="mermaid">${esc(tok.content)}</pre></div>\n`
    return `<div class="code"><div class="bar"><i></i><i></i><i></i><span>${esc(info || 'text')}</span></div><pre><code>${esc(tok.content)}</code></pre></div>\n`
  }
  md.renderer.rules.table_open = () => '<div class="tbl-wrap"><table class="tbl">\n'
  md.renderer.rules.table_close = () => '</table></div>\n'

  // drop the H1 (the page hero shows the title)
  let body = md.render(src).replace(/<h1[^>]*>[\s\S]*?<\/h1>\n?/, '')
  const heads = (HEAD[doc.id][useLang] || []).filter((h) => h.level === 2)
  const toc = heads.map((h) => `<a href="#${esc(h.slug)}">${esc(h.text)}</a>`).join('')
  return { body, toc, useLang }
}

function page(doc) {
  const others = DOCS.filter((d) => d !== doc)
  const arts = []; const tocs = []
  for (const lang of LANGS) {
    const { body, toc, useLang } = render(doc, lang)
    const htmlLang = useLang === 'zh' ? 'zh-CN' : useLang
    const note = UI[lang].note && useLang === lang ? `<p class="tr-note">${UI[lang].note}</p>` : ''
    arts.push(`<article class="md" lang="${htmlLang}" data-doc-lang="${lang}"${lang === 'ja' ? '' : ' hidden'}>
${note}<details class="mtoc"><summary>${UI[lang].toc}</summary><nav>${toc}</nav></details>
${body}</article>`)
    tocs.push(`<nav class="toc" aria-label="${UI[lang].toc}" data-doc-lang="${lang}"${lang === 'ja' ? '' : ' hidden'}><b>${UI[lang].toc}</b>${toc}
<b class="toc-other">${UI[lang].other}</b>${others.map((o) => `<a href="${o.page}">${esc(o.title[lang])} →</a>`).join('')}
<a href="${GH}/blob/main/${langFile(doc, SRC[doc.id][lang] ? lang : 'ja')}" target="_blank" rel="noopener" class="toc-src">${UI[lang].src} ↗</a></nav>`)
  }
  const meta = JSON.stringify({ title: doc.title, lead: doc.lead })
  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(doc.title.ja)} — Bizアシスタント</title>
<!-- generated by docs/website/tools/build-docs.cjs from ${doc.file} (+ .en / .zh-CN) — do not edit by hand -->
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&family=JetBrains+Mono:wght@400;600&family=Noto+Sans+JP:wght@400;500;700;900&family=Noto+Sans+SC:wght@400;500;700;900&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/site.css">
</head>
<body data-page="docs" data-doc="${doc.id}">
<canvas id="stars" aria-hidden="true"></canvas><div class="grid-bg" aria-hidden="true"></div>
<header id="site-header"></header>
<main>
<section class="page-hero doc-hero">
  <div class="wrap">
    <div class="crumb"><a href="index.html">Home</a> / <a href="docs.html" data-i18n="nav.docs">ドキュメント</a> / <span id="docCrumb">${esc(doc.title.ja)}</span></div>
    <span class="eyebrow" style="margin-top:18px">${esc(doc.eyebrow)}</span>
    <h1 id="docTitle">${esc(doc.title.ja)}</h1>
    <p class="lead" id="docLead">${esc(doc.lead.ja)}</p>
  </div>
</section>
<section style="padding-top:10px">
  <div class="wrap doc-layout doc-read">
    <div class="toc-col">
${tocs.join('\n')}
    </div>
    <div>
${arts.join('\n')}
    </div>
  </div>
</section>
</main>
<footer id="site-footer"></footer>
<script>window.BIZ_DOC = ${meta}</script>
<script src="assets/i18n-en.js"></script><script src="assets/i18n-zh.js"></script><script src="assets/site.js"></script>
<script type="module" src="assets/docs.js"></script>
</body>
</html>
`
}

for (const doc of DOCS) {
  const html = page(doc)
  fs.writeFileSync(path.join(MOCK, doc.page), html)
  console.log(`wrote docs/website/mock/${doc.page} (${(html.length / 1024).toFixed(0)} KB; ${LANGS.filter((l) => SRC[doc.id][l]).join(' / ')})`)
}
if (BROKEN.length) { console.warn(`unresolved anchors (${BROKEN.length}):\n  ` + [...new Set(BROKEN)].join('\n  ')); process.exitCode = 2 }
