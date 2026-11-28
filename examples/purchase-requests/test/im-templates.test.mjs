// The chat notifications in English and Chinese (the bridge-notify template module); Japanese is left to the framework's frame.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { render, types } from '../src/im-templates.mjs'
import { localizedManifest } from '../src/app.mjs'

test('en / zh: the message is written in the language of the instance\'s manifest, from typed numbers only', () => {
  const en = render({ template: 'purchase.unanswered', params: { requestNumber: 1042, daysWaiting: 3 }, manifest: localizedManifest('en'), url: 'https://app.example.test/purchase-requests/x' })
  assert.equal(en.title, '[Action needed] Purchase request waiting')
  assert.deepEqual(en.lines, ['Purchase request PR-1042 has waited 3 day(s) for your decision.', '▶ Approve or reject it with the card in this chat (or in Purchase Requests).'])
  assert.equal(en.signature, '— Purchase Requests AI assistant')
  assert.match(en.body, /Open: https:\/\/app\.example\.test/)

  const zh = render({ template: 'purchase.approved', params: { requestNumber: 1042 }, manifest: localizedManifest('zh') })
  assert.equal(zh.title, '【通知】采购申请已批准')
  assert.equal(zh.lines[0], '你的采购申请 PR-1042 已批准。')
  assert.equal(zh.signature, '— 采购申请 AI 助理')
  assert.equal(zh.url, null)
})

test('ja is rendered by the framework (null); a text parameter is never filled in; unknown templates are left alone', () => {
  assert.equal(render({ template: 'purchase.unanswered', params: { requestNumber: 1042, daysWaiting: 3 }, manifest: localizedManifest('ja') }), null)
  const odd = render({ template: 'purchase.rejected', params: { requestNumber: 'Sam' }, manifest: localizedManifest('en') })
  assert.ok(!odd.text.includes('Sam'))
  assert.match(odd.lines[0], /PR-—/)
  assert.equal(render({ template: 'other.thing', params: {}, manifest: localizedManifest('en') }), null)
  assert.deepEqual(types, ['purchase.unanswered', 'purchase.decided'])
})
