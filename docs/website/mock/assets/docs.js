// Documentation pages (technical-guide.html, guideline.html): show the article of the current language, update the hero,
// and render mermaid diagrams only when their article is visible (mermaid cannot measure hidden elements).
const MERMAID = 'https://cdn.jsdelivr.net/npm/mermaid@11.4.1/dist/mermaid.esm.min.mjs'
let mermaid = null

async function renderVisible() {
  const nodes = [...document.querySelectorAll('article.md:not([hidden]) pre.mermaid:not([data-processed])')]
  if (!nodes.length) return
  try {
    if (!mermaid) {
      mermaid = (await import(MERMAID)).default
      mermaid.initialize({
        startOnLoad: false, theme: 'dark', securityLevel: 'strict',
        themeVariables: { background: '#060A1E', primaryColor: '#121A42', primaryTextColor: '#E8EEFF', primaryBorderColor: '#00E5FF', lineColor: '#7C5CFF', fontFamily: 'Inter, "Noto Sans JP", "Noto Sans SC", sans-serif' },
      })
    }
    await mermaid.run({ nodes })
  } catch (e) {
    console.warn('mermaid', e) // the diagram source stays readable as text
  }
}

function show(lang) {
  const doc = window.BIZ_DOC || {}
  document.querySelectorAll('[data-doc-lang]').forEach((el) => { el.hidden = el.dataset.docLang !== lang })
  const t = doc.title?.[lang] ?? doc.title?.ja
  if (t) {
    document.getElementById('docTitle').textContent = t
    document.getElementById('docCrumb').textContent = t
    document.title = `${t} — ${lang === 'ja' ? 'Bizアシスタント' : 'Biz Assistant'}`
  }
  const l = doc.lead?.[lang] ?? doc.lead?.ja
  if (l) document.getElementById('docLead').textContent = l
  renderVisible()
}

document.addEventListener('biz:lang', (e) => show(e.detail))
show(window.BIZ_LANG || 'ja')

// mobile table of contents: close after choosing a section
document.addEventListener('click', (e) => {
  const a = e.target.closest('.mtoc a'); if (a) a.closest('details').open = false
})
