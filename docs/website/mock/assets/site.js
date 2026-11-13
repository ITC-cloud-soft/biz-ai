/* Bizアシスタント site mock — shared header / footer, language switch (ja / en / zh), effects.
 * Text in the pages is Japanese; an element with data-i18n="key" is replaced by I18N.en[key] / I18N.zh[key] (assets/i18n-*.js).
 * The original Japanese is kept in data-ja, so switching back needs no dictionary. */
(() => {
  const GH = 'https://github.com/ITC-cloud-soft/biz-ai'
  const LANGS = [['ja', '日本語'], ['en', 'English'], ['zh', '中文']]
  const page = document.body.dataset.page || 'home'
  const ghIcon = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.7 5.39-5.26 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z"/></svg>'
  const logo = '<span class="logo-mark"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round"><path d="M3 17c4-8 14-8 18 0"/><path d="M7 17v-4M12 17v-6M17 17v-4"/></svg></span>'
  const NAV = [
    ['how', 'how-it-works.html', '仕組み'], ['cap', 'capabilities.html', '機能'], ['trust', 'trust.html', '安全'], ['int', 'integration.html', 'つなぎ方'],
    ['dev', 'developers.html', '開発者'], ['docs', 'docs.html', 'ドキュメント'], ['community', 'community.html', 'コミュニティ'], ['ops', 'ops-ai-bot.html', '運用AI Bot'],
  ]
  const navLinks = NAV.map(([k, href, t]) => `<a href="${href}" data-i18n="nav.${k}" class="${k === page ? 'active' : ''} ${k === 'community' ? 'community' : ''}">${t}</a>`).join('')

  // ── header ──
  const header = document.getElementById('site-header')
  if (header) {
    header.className = 'nav'
    header.innerHTML = `<div class="wrap">
      <a href="index.html" class="logo" aria-label="Bizアシスタント">${logo}<span>Bizアシスタント<small>BIZ ASSISTANT FRAMEWORK</small></span></a>
      <nav class="links" aria-label="main">${navLinks}</nav>
      <div class="nav-cta">
        <a class="gh" href="${GH}" target="_blank" rel="noopener" aria-label="GitHub" title="GitHub">${ghIcon}</a>
        <div class="lang"><button class="lang-btn" id="langBtn" aria-haspopup="true" aria-expanded="false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg><span id="langCurrent">日本語</span></button>
          <div class="lang-menu" id="langMenu" role="menu">${LANGS.map(([c, n]) => `<button role="menuitem" data-lang="${c}">${n}</button>`).join('')}</div></div>
        <a href="contact.html" class="btn btn-primary btn-sm" data-i18n="nav.cta">導入を相談する</a>
      </div>
      <button class="burger" aria-label="menu" aria-expanded="false" id="burger">☰</button>
    </div>`
    const mm = document.createElement('div')
    mm.className = 'mobile-menu'; mm.id = 'mmenu'
    mm.innerHTML = `${NAV.map(([k, href, t]) => `<a href="${href}" data-i18n="nav.${k}">${t}</a>`).join('')}
      <a href="${GH}" target="_blank" rel="noopener">GitHub ↗</a><a href="contact.html" data-i18n="nav.cta">導入を相談する</a>
      <div class="langs">${LANGS.map(([c, n]) => `<button data-lang="${c}">${n}</button>`).join('')}</div>`
    header.after(mm)
  }

  // ── footer ──
  const footer = document.getElementById('site-footer')
  if (footer) {
    footer.innerHTML = `<div class="wrap"><div class="cols">
      <div><a href="index.html" class="logo">${logo}<span>Bizアシスタント</span></a><p style="margin-top:12px;max-width:300px" data-i18n="ft.tagline">どの IT システムも、考えて動く AI 社員の職場へ。Biz Assistant Framework（Bridge v1）。</p></div>
      <div><h5 data-i18n="ft.prod">製品</h5><a href="index.html">Bizアシスタント</a><a href="ops-ai-bot.html">運用AI Bot</a><a href="https://metacoder.myaiportal.net/">MetaCoder</a></div>
      <div><h5 data-i18n="ft.docs">ドキュメント</h5><a href="docs.html#guide" data-i18n="ft.guide">技術解説</a><a href="docs.html#guideline" data-i18n="ft.guideline">開発ガイドライン</a><a href="docs.html#skill" data-i18n="ft.skill">導入 skill</a><a href="developers.html#api" data-i18n="ft.api">API リファレンス</a><a href="faq.html">FAQ</a></div>
      <div><h5 data-i18n="ft.comm">コミュニティ</h5><a href="community.html" data-i18n="ft.forum">フォーラム</a><a href="${GH}" target="_blank" rel="noopener">GitHub</a><a href="${GH}/discussions" target="_blank" rel="noopener">Discussions</a><a href="${GH}/issues" target="_blank" rel="noopener">Issues</a></div>
      <div><h5 data-i18n="ft.co">会社</h5><a href="contact.html#company" data-i18n="ft.about">会社情報</a><a href="contact.html" data-i18n="ft.contact">お問い合わせ</a><a href="contact.html#privacy" data-i18n="ft.privacy">プライバシー</a></div>
    </div><div class="copy" data-i18n="ft.copy">© 2026 ITC · Bizアシスタント ／ 画面・数値の例はすべて架空です。</div></div>`
  }

  // ── i18n ──
  const pick = () => {
    const q = new URLSearchParams(location.search).get('lang')
    if (LANGS.some(([c]) => c === q)) return q
    try { const s = localStorage.getItem('biz-lang'); if (LANGS.some(([c]) => c === s)) return s } catch {}
    const n = (navigator.language || '').toLowerCase()
    return n.startsWith('zh') ? 'zh' : n.startsWith('en') ? 'en' : 'ja'
  }
  const missing = new Set()
  function apply(lang) {
    const dict = (window.I18N || {})[lang] || {}
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : lang
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      if (el.dataset.ja === undefined) el.dataset.ja = el.innerHTML
      const k = el.dataset.i18n
      if (lang === 'ja') el.innerHTML = el.dataset.ja
      else if (dict[k] !== undefined) el.innerHTML = dict[k]
      else { el.innerHTML = el.dataset.ja; missing.add(k) }
    })
    document.querySelectorAll('[data-i18n-ph]').forEach((el) => {
      if (el.dataset.phJa === undefined) el.dataset.phJa = el.placeholder
      el.placeholder = lang === 'ja' ? el.dataset.phJa : (dict[el.dataset.i18nPh] ?? el.dataset.phJa)
    })
    const cur = document.getElementById('langCurrent'); if (cur) cur.textContent = LANGS.find(([c]) => c === lang)[1]
    document.querySelectorAll('[data-lang]').forEach((b) => b.setAttribute('aria-current', b.dataset.lang === lang))
    try { localStorage.setItem('biz-lang', lang) } catch {}
    window.BIZ_LANG = lang
    document.dispatchEvent(new CustomEvent('biz:lang', { detail: lang }))
    if (missing.size) console.warn('i18n missing', lang, [...missing])
  }
  window.BIZ_MISSING = missing
  apply(pick())
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-lang]'); if (b) { apply(b.dataset.lang); document.getElementById('langMenu')?.classList.remove('open'); return }
    const lb = e.target.closest('#langBtn'); const menu = document.getElementById('langMenu')
    if (lb) { const o = menu.classList.toggle('open'); lb.setAttribute('aria-expanded', o); return }
    if (menu && !e.target.closest('.lang')) menu.classList.remove('open')
  })

  // ── mobile menu ──
  const burger = document.getElementById('burger'), mmenu = document.getElementById('mmenu')
  if (burger) {
    burger.addEventListener('click', () => { const o = mmenu.classList.toggle('open'); burger.setAttribute('aria-expanded', o) })
    mmenu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => mmenu.classList.remove('open')))
  }

  // ── background stars ──
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
  const cv = document.getElementById('stars')
  if (cv) {
    const cx = cv.getContext('2d'); let W, H, pts = []
    const resize = () => { W = cv.width = innerWidth; H = cv.height = innerHeight
      pts = Array.from({ length: Math.min(90, Math.floor(W / 14)) }, () => ({ x: Math.random() * W, y: Math.random() * H, v: .15 + Math.random() * .35, r: Math.random() * 1.4 + .3 })) }
    resize(); addEventListener('resize', resize)
    const draw = () => {
      cx.clearRect(0, 0, W, H)
      for (const p of pts) { cx.fillStyle = `rgba(150,200,255,${.25 + p.r / 3})`; cx.beginPath(); cx.arc(p.x, p.y, p.r, 0, 7); cx.fill(); if (!reduce) { p.y -= p.v; if (p.y < -5) { p.y = H + 5; p.x = Math.random() * W } } }
      for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) { const a = pts[i], b = pts[j], d = Math.hypot(a.x - b.x, a.y - b.y)
        if (d < 110) { cx.strokeStyle = `rgba(0,229,255,${(1 - d / 110) * .12})`; cx.beginPath(); cx.moveTo(a.x, a.y); cx.lineTo(b.x, b.y); cx.stroke() } }
      if (!reduce) requestAnimationFrame(draw)
    }
    draw()
  }

  // ── reveal / count / tabs / filters / chat sequence ──
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); if (e.target.classList.contains('eras')) e.target.style.setProperty('--fill', 1); io.unobserve(e.target) } }), { threshold: .12 })
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el))
  const cio = new IntersectionObserver((es) => es.forEach((e) => { if (!e.isIntersecting || reduce) return; const el = e.target, n = +el.dataset.count; let i = 0
    const tick = () => { i = Math.min(n, i + Math.ceil(n / 30)); el.textContent = i; if (i < n) requestAnimationFrame(tick) }; tick(); cio.unobserve(el) }), { threshold: .6 })
  document.querySelectorAll('[data-count]').forEach((el) => cio.observe(el))
  document.querySelectorAll('.tabs').forEach((tabs) => tabs.querySelectorAll('.tab').forEach((t) => t.addEventListener('click', () => {
    tabs.querySelectorAll('.tab').forEach((x) => x.setAttribute('aria-selected', x === t))
    document.querySelectorAll(`.tabpanel[data-group="${tabs.dataset.group}"]`).forEach((p) => p.classList.toggle('on', p.id === t.dataset.tab))
  })))
  document.querySelectorAll('.threads .head').forEach((h) => h.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
    h.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', x === b))
    const f = b.dataset.filter
    h.parentElement.querySelectorAll('.thread').forEach((t) => { t.style.display = !f || f === 'all' || t.dataset.cat === f || (f === 'solved' && t.dataset.solved) ? '' : 'none' })
  })))
  document.querySelectorAll('[data-d]').forEach((el) => setTimeout(() => { el.classList.add('show'); if (el.classList.contains('typing')) el.style.opacity = 1 }, reduce ? 0 : +el.dataset.d))
  document.querySelectorAll('form[data-mock]').forEach((f) => f.addEventListener('submit', (e) => { e.preventDefault(); const m = f.querySelector('.sent'); if (m) m.hidden = false }))
})()
