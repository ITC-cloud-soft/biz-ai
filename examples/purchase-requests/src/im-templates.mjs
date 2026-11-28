// The chat notifications of purchase-requests in English and Chinese: a bridge-notify template module (the extension point
// `templateModules`, plugins/notify). bridge-notify's own frame is Japanese, so for a Japanese instance this module answers
// null and the manifest templates are rendered by the framework. The language is the instance's: the manifest it serves
// (system.locale). Only the typed numbers of the template parameters are filled in.
import { localeOf, messagesFor } from './messages.mjs'

export const name = 'purchase-requests'
export const types = ['purchase.unanswered', 'purchase.decided']

const number = (v) => (Number.isInteger(v) && v >= 0 && v < 1e9 ? v : undefined)
const fill = (text, params) => String(text).replace(/\{([A-Za-z0-9_]+)\}/g, (_, k) => String(number(params?.[k]) ?? '—'))

/** render(input) → the message (title, lines, signature, url) or null (another module / the manifest renders it). */
export function render({ template, params = {}, url = null, manifest, appName }) {
  const locale = localeOf(manifest?.system?.locale)
  const m = messagesFor(locale)
  const t = m.templates[template]
  if (!m.im || !t) return null
  const intent = t.action ? 'action' : 'info'
  const title = `${m.im.labels[intent]}${t.title}`
  const lines = [fill(t.description, params), t.action ? `${m.im.ask}${fill(t.action, params)}` : t.note].filter(Boolean)
  const signature = m.im.signature(appName || m.systemName)
  return {
    intent,
    label: m.im.labels[intent],
    title,
    text: [...lines, signature].join('\n'),
    body: [title, ...lines, url ? `${m.im.openLink}${url}` : '', signature].filter(Boolean).join('\n'),
    url: url || null,
    lines,
    signature,
  }
}

export default { name, types, render }
