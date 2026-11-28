#!/usr/bin/env node
// Records the chat view (demo-view/<lang>.html) as an animated GIF and an MP4: docs/images/speaks-first-<lang>.gif / .mp4.
// Frame by frame (the page renders any moment with window.__seek(ms)), so the result does not depend on the machine's speed.
//
//   node examples/purchase-requests/demo/record.mjs [--lang en|ja|zh|all] [--fps 15] [--shots <ms,ms,...>]
//
// Needs, already installed (nothing is downloaded): playwright-core with its Chromium (PLAYWRIGHT_CORE = the package
// directory, or `playwright-core` resolvable from here) and ffmpeg (FFMPEG = the executable, or `ffmpeg` on PATH).
// --shots writes PNG stills of those moments into demo/.work/ instead of recording.
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, rmSync, statSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const EXAMPLE = resolve(here, '..')
const FRAMEWORK = resolve(EXAMPLE, '..', '..')
const OUT = join(FRAMEWORK, 'docs', 'images')
const argv = process.argv.slice(2)
const opt = (name, fallback) => (argv.includes(name) ? argv[argv.indexOf(name) + 1] : fallback)
const LANGS = opt('--lang', 'all') === 'all' ? ['en', 'ja', 'zh'] : [opt('--lang')]
const FPS = Number(opt('--fps', 15))
const SHOTS = opt('--shots', null)
const FFMPEG = process.env.FFMPEG || 'ffmpeg'
const HOLD_MS = 1500

async function loadPlaywright() {
  const dir = process.env.PLAYWRIGHT_CORE
  if (dir) return import(pathToFileURL(join(dir, 'index.mjs')).href)
  try {
    return import(pathToFileURL(createRequire(import.meta.url).resolve('playwright-core')).href)
  } catch {
    console.error('playwright-core not found: set PLAYWRIGHT_CORE=<path to an installed playwright-core package> (nothing is downloaded)')
    process.exit(2)
  }
}
const ffmpeg = (args) => {
  const r = spawnSync(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-y', ...args], { encoding: 'utf8', windowsHide: true })
  if (r.status !== 0) throw new Error(`ffmpeg failed: ${r.stderr || r.error?.message}`)
}

const { chromium } = await loadPlaywright()
const browser = await chromium.launch({ headless: true })
try {
  for (const lang of LANGS) {
    const page = await browser.newPage({ viewport: { width: 800, height: 520 }, deviceScaleFactor: 1 })
    await page.goto(`${pathToFileURL(join(EXAMPLE, 'demo-view', `${lang}.html`)).href}?still`)
    await page.evaluate(() => document.fonts.ready)
    const duration = await page.evaluate(() => window.__duration)
    const stage = page.locator('#stage')
    const frames = join(here, '.work', `frames-${lang}`)
    rmSync(frames, { recursive: true, force: true })
    mkdirSync(frames, { recursive: true })
    if (SHOTS) {
      for (const t of SHOTS.split(',').map(Number)) {
        await page.evaluate((ms) => window.__seek(ms), t)
        await stage.screenshot({ path: join(here, '.work', `shot-${lang}-${t}.png`) })
      }
      console.log(`stills → demo/.work/shot-${lang}-*.png`)
      await page.close()
      continue
    }
    const count = Math.ceil(((duration + HOLD_MS) / 1000) * FPS)
    for (let i = 0; i < count; i += 1) {
      await page.evaluate((ms) => window.__seek(ms), (i * 1000) / FPS)
      await stage.screenshot({ path: join(frames, `f${String(i).padStart(4, '0')}.png`) })
    }
    await page.close()
    mkdirSync(OUT, { recursive: true })
    const input = ['-framerate', String(FPS), '-i', join(frames, 'f%04d.png')]
    const gif = join(OUT, `speaks-first-${lang}.gif`)
    const mp4 = join(OUT, `speaks-first-${lang}.mp4`)
    ffmpeg([...input, '-vf', 'split[a][b];[a]palettegen=max_colors=128:stats_mode=diff[p];[b][p]paletteuse=dither=none:diff_mode=rectangle', '-loop', '0', gif])
    ffmpeg([...input, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '26', '-preset', 'slow', '-movflags', '+faststart', mp4])
    rmSync(frames, { recursive: true, force: true })
    const kb = (f) => (existsSync(f) ? `${Math.round(statSync(f).size / 1024)} KB` : 'missing')
    console.log(`${lang}: ${count} frames at ${FPS} fps → docs/images/speaks-first-${lang}.gif (${kb(gif)}), .mp4 (${kb(mp4)})`)
  }
} finally {
  await browser.close()
}
