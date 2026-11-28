// persona.js — AI 社員のプロフィール（呼び名・口調・会社の紹介・性格・背景）を system prompt の節にする（docs/AI_EMPLOYEE_PROFILE.md §2）。
//
// 固定の規則（FIXED_RULES）が先、プロフィールは後ろの「人物の設定」。プロフィールは規則・権限・ツールを変えられない：
// 節の頭に「上の規則と食い違うときは規則に従う」と書く。AI であることは隠さない（D8）。プロフィールの検査（保存前）は
// @dsh-bridge/protocol の validateAiProfile（業務システム側）。ここは表示だけで、届いた値をもう一度 1 行・長さで切る（念のための網）。
// 節の言語は業務システムの manifest の system.locale（ja / en / zh。既定 ja）。文言は messages.js の PERSONA_MESSAGES。
import { signatureOf } from './secretary.js'
import { PERSONA_MESSAGES, frameLocale, localeOf } from './messages.js'

/** すべての AI 社員に共通の規則（profile の雛形の persona と同じ趣旨。アプリの preset の文が先に来る場合も重ねて書く）。日本語（en / zh は PERSONA_MESSAGES）。 */
export const FIXED_RULES = PERSONA_MESSAGES.ja.rules

export const TONE_TEXT = PERSONA_MESSAGES.ja.tones

const LIMIT = { nickname: 20, firstPerson: 10, toneNote: 100, company: 2000, personality: 300, background: 500, example: 100, examples: 3 }
const one = (s, max) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, max)
const block = (s, max) => String(s ?? '').replace(/\r\n?/g, '\n').replace(/\n{3,}/g, '\n\n').trim().slice(0, max)

/** その AI 社員（DSH の preset の id）に効くプロフィール（agents の上書きを重ねる）。 */
export function profileForAgent(profile, agentId) {
  if (!profile || typeof profile !== 'object') return null
  const over = agentId && profile.agents && typeof profile.agents === 'object' ? profile.agents[agentId] : null
  if (!over || typeof over !== 'object') return profile
  const merged = { ...profile }
  for (const k of ['nickname', 'personality', 'background']) if (typeof over[k] === 'string' && over[k].trim()) merged[k] = over[k]
  return merged
}

/** 呼び名（無ければ ''）。 */
export function nicknameOf(profile, agentId) {
  const p = profileForAgent(profile, agentId)
  return p ? one(p.nickname, LIMIT.nickname) : ''
}

/**
 * アプリケーションの署名（呼び名があれば `— <呼び名>（<アプリ名> AI 秘書）`、無ければ `— <アプリ名> AI 秘書`）。
 * app はレジストリのアプリケーション（aiProfile() が無い・例外なら呼び名なし）。agentId は preset の上書き（通知は undefined）。
 */
export function appSignature(app, agentId) {
  let profile = null
  try { profile = typeof app?.aiProfile === 'function' ? app.aiProfile() : null } catch { profile = null }
  return signatureOf(app?.name, nicknameOf(profile, agentId), { locale: localeOf(app) })
}

/** アプリケーションの呼び名（無ければ ''）。 */
export function appNickname(app, agentId) {
  try { return nicknameOf(typeof app?.aiProfile === 'function' ? app.aiProfile() : null, agentId) } catch { return '' }
}

/**
 * system prompt の節（プロフィールが無い・呼び名が空なら ''）。
 * @param {object} args
 * @param {object|null} args.profile   GET /bridge/v1/ai-profile の profile
 * @param {string} [args.agentId]      DSH の preset の id（agents の上書き）
 * @param {string} [args.appName]      アプリケーションの表示名（署名と「〇〇の AI 社員」）
 * @param {boolean} [args.rules]       固定の規則も書く（既定 true）
 * @param {string} [args.locale]       節の言語（ja / en / zh か BCP 47。業務システムの manifest の system.locale。既定 ja）
 */
export function renderPersona({ profile, agentId, appName = '', rules = true, locale } = {}) {
  const t = PERSONA_MESSAGES[frameLocale(locale)]
  const p = profileForAgent(profile, agentId)
  const nickname = p ? one(p.nickname, LIMIT.nickname) : ''
  if (!nickname) return ''
  const app = one(appName, 80)
  const lines = []
  if (rules) {
    lines.push(t.rulesHead)
    t.rules.forEach((r, i) => lines.push(`${i + 1}. ${r}`))
    lines.push('')
  }
  lines.push(t.personaHead)
  lines.push(t.personaIntro)
  lines.push(t.nickname(nickname, app))
  const firstPerson = one(p.firstPerson, LIMIT.firstPerson)
  if (firstPerson) lines.push(t.firstPerson(firstPerson))
  const tone = t.tones[p.tone?.preset] ?? t.tones.polite
  const note = one(p.tone?.note, LIMIT.toneNote)
  lines.push(t.tone(tone, note))
  const personality = block(p.personality, LIMIT.personality)
  if (personality) lines.push(t.personality(personality.replace(/\n/g, ' ')))
  const background = block(p.background, LIMIT.background)
  if (background) lines.push(t.background(background.replace(/\n/g, ' ')))
  const examples = (Array.isArray(p.examples) ? p.examples : []).slice(0, LIMIT.examples).map((e) => one(e, LIMIT.example)).filter(Boolean)
  if (examples.length) {
    lines.push(t.examplesHead)
    for (const e of examples) lines.push(t.example(e))
  }
  const company = block(p.company, LIMIT.company)
  if (company) {
    lines.push('')
    lines.push(t.companyHead)
    lines.push(company)
  }
  return lines.join('\n')
}
