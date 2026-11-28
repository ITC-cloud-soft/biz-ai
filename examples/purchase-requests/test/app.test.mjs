// The business rules of purchase-requests through its own API and the Bridge (no database: the memory store).
import { after, before, test } from 'node:test'
import assert from 'node:assert/strict'
import { startServer } from '../src/app.mjs'

const SERVICE = 'purchase-test-service-token-000000000'
const S = { 'x-service-token': SERVICE }
let srv, base
const people = {}

const call = async (method, path, { headers = {}, body } = {}) => {
  const res = await fetch(`${base}${path}`, { method, headers: { ...(body !== undefined ? { 'content-type': 'application/json' } : {}), ...headers }, body: body !== undefined ? JSON.stringify(body) : undefined })
  const text = await res.text()
  return { status: res.status, body: text ? JSON.parse(text) : null, headers: res.headers }
}
const events = async () => (await call('GET', '/bridge/v1/events?after=0&limit=500', { headers: S })).body.events
const backdate = (id, days) => { srv.app.data.requests.get(id).createdAt = new Date(Date.now() - days * 86_400_000) }
const request = async (who, body = { item: 'Desk lamp', quantity: 1, amount: 4200 }) => call('POST', '/api/purchase-requests', { headers: people[who].headers, body })

before(async () => {
  srv = await startServer({ serviceToken: SERVICE, bffSecret: 'purchase-test-bff-secret-0000000000000' })
  base = srv.base
  const ids = {}
  for (const [loginId, role, approver] of [['admin', 'admin'], ['approver1', 'manager'], ['approver2', 'manager'], ['staff1', 'staff', 'approver1'], ['staff2', 'staff', 'approver2']]) {
    const u = await srv.app.createUser({ loginId, password: 'password-1234', role, displayName: `Test ${loginId}`, approverId: approver ? ids[approver] : null })
    ids[loginId] = u.id
    const r = await call('POST', '/api/auth/login', { body: { loginId, password: 'password-1234' } })
    people[loginId] = { id: u.id, headers: { cookie: r.headers.get('set-cookie').split(';')[0] } }
  }
})
after(() => srv?.stop())

test('a waiting request speaks first: after 3 days, once, purchase.unanswered + approval.requested to the named approver only', async () => {
  const r = await request('staff1', { item: 'Laptop stand', quantity: 2, amount: 12800 })
  assert.equal(r.status, 201)
  assert.match(r.body.purchaseRequest.no, /^PR-\d{4}$/)
  const id = r.body.purchaseRequest.id
  const opened = (list) => list.some((e) => e.type === 'approval.requested' && e.payload.approvalId === r.body.approval.id)
  assert.equal(opened(await events()), false, 'no chat card while the request is fresh')
  assert.equal((await call('POST', '/api/admin/unanswered-scan', { headers: people.approver1.headers, body: {} })).body.created.some((x) => x.purchaseRequestId === id), false)

  backdate(id, 3)
  const scan = await call('POST', '/api/admin/unanswered-scan', { headers: people.approver1.headers, body: {} })
  const hit = scan.body.created.find((x) => x.purchaseRequestId === id)
  assert.ok(hit, 'the 3-day-old request is brought up')
  assert.equal((await call('POST', '/api/admin/unanswered-scan', { headers: people.approver1.headers, body: {} })).body.created.length, 0, 'once per request')
  const list = await events()
  assert.ok(opened(list), 'the approval opens in chat in the same transaction')
  const event = list.find((e) => String(e.id) === String(hit.eventId))
  assert.equal(event.type, 'purchase.unanswered')
  assert.deepEqual(Object.keys(event.payload).sort(), ['daysWaiting', 'purchaseRequestId', 'requestNumber', 'requesterUserId'])

  const who = await srv.app.kit.hooks.recipientsFor(event)
  assert.deepEqual(who.users.map((u) => u.id), [people.approver1.id], 'the named approver only: not the requester, not approver2, not the admin, not staff2')
  assert.deepEqual(who.paramsFor(who.users[0]), { requestNumber: Number(r.body.purchaseRequest.no.slice(3)), daysWaiting: 3 })
  const a = srv.app.data.approvals.get(r.body.approval.id)
  assert.deepEqual((await srv.app.kit.hooks.approvals.approvers(a)).map((u) => u.id), [people.approver1.id], 'the card goes to the named approver only')
  const card = await srv.app.kit.hooks.approvals.card(a)
  assert.deepEqual(card.fields.map((f) => f.value), [r.body.purchaseRequest.no, 'Laptop stand × 2', '¥12,800', '3 days'])
  assert.ok(!JSON.stringify(card).includes('Test staff1'), 'no names on the card')
  assert.equal((await call('POST', '/api/admin/unanswered-scan', { headers: people.staff1.headers, body: {} })).status, 403, 'staff cannot run the scan')
})

test('the approver is never the requester: own requests cannot be decided (web and card rule), a non-named approver cannot either', async () => {
  // an approver's own request: they are not among its approvers and cannot decide it
  const own = await request('approver1')
  const a = srv.app.data.approvals.get(own.body.approval.id)
  const approvers = (await srv.app.kit.hooks.approvals.approvers(a)).map((u) => u.id)
  assert.ok(!approvers.includes(people.approver1.id), 'the requester is not an approver of their own request')
  assert.ok(approvers.includes(people.approver2.id))
  assert.equal(await srv.app.kit.hooks.approvals.mayDecide(a, { id: people.approver1.id, role: 'manager' }), false, 'the card rule')
  assert.equal((await call('POST', `/api/approvals/${a.id}/decision`, { headers: people.approver1.headers, body: { action: 'approve' } })).status, 403, 'the web rule')
  assert.equal((await call('POST', `/api/approvals/${a.id}/decision`, { headers: people.approver2.headers, body: { action: 'approve' } })).status, 200)

  // staff1's request is approver1's: approver2 (not named) and staff cannot decide it; the admin can
  const r = await request('staff1')
  const id = r.body.approval.id
  assert.equal((await call('POST', `/api/approvals/${id}/decision`, { headers: people.staff1.headers, body: { action: 'approve' } })).status, 403)
  assert.equal((await call('POST', `/api/approvals/${id}/decision`, { headers: people.approver2.headers, body: { action: 'approve' } })).status, 403)
  assert.equal(await srv.app.kit.hooks.approvals.mayDecide(srv.app.data.approvals.get(id), { id: people.admin.id, role: 'admin' }), true)
})

test('a decision is recorded and told to the requester only (purchase.decided, approved / rejected template); never twice', async () => {
  const r = await request('staff1', { item: 'Headset', quantity: 1, amount: 8900 })
  const ok = await call('POST', `/api/approvals/${r.body.approval.id}/decision`, { headers: people.approver1.headers, body: { action: 'approve' } })
  assert.equal(ok.body.approval.status, 'approved')
  assert.equal((await call('POST', `/api/approvals/${r.body.approval.id}/decision`, { headers: people.admin.headers, body: { action: 'reject' } })).status, 409)
  const stored = srv.app.data.requests.get(r.body.purchaseRequest.id)
  assert.equal(stored.status, 'approved')
  const decided = (await events()).find((e) => e.type === 'purchase.decided' && e.payload.purchaseRequestId === stored.id)
  assert.equal(decided.payload.decision, 'approved')
  const who = await srv.app.kit.hooks.recipientsFor(decided)
  assert.deepEqual(who.users.map((u) => u.id), [people.staff1.id])
  assert.equal(who.template, 'purchase.approved')

  const back = await request('staff1')
  await call('POST', `/api/approvals/${back.body.approval.id}/decision`, { headers: people.approver1.headers, body: { action: 'reject' } })
  const rejected = (await events()).find((e) => e.type === 'purchase.decided' && e.payload.purchaseRequestId === back.body.purchaseRequest.id)
  assert.equal((await srv.app.kit.hooks.recipientsFor(rejected)).template, 'purchase.rejected')
})

test('staff see their own requests only: the list, and one request by number (another one is not found)', async () => {
  const mine = await request('staff2', { item: 'Whiteboard markers', quantity: 10, amount: 1500 })
  const no = mine.body.purchaseRequest.no
  const list = await call('GET', '/api/purchase-requests', { headers: people.staff2.headers })
  assert.ok(list.body.purchaseRequests.length >= 1)
  assert.ok(list.body.purchaseRequests.every((x) => x.requesterUserId === people.staff2.id))
  assert.equal((await call('GET', `/api/purchase-requests/${no}`, { headers: people.staff2.headers })).body.purchaseRequest.item, 'Whiteboard markers')
  const other = await call('GET', `/api/purchase-requests/${no}`, { headers: people.staff1.headers })
  assert.equal(other.status, 404)
  assert.equal(other.body.error, 'purchase_request_not_found')
  assert.equal((await call('GET', `/api/purchase-requests/${no}`, { headers: people.approver2.headers })).status, 200)
  assert.equal((await call('GET', '/api/purchase-requests/unanswered', { headers: people.approver2.headers })).status, 200)
  assert.equal((await call('GET', '/api/purchase-requests/not-a-number', { headers: people.approver2.headers })).status, 400)
  assert.equal((await request('staff2', { item: '', quantity: 1, amount: 1 })).status, 400)
  assert.equal((await request('staff2', { item: 'x', quantity: 0, amount: 1 })).status, 400)
})

test('the daily report counts by role: staff see their own pending requests only', async () => {
  const staff = await srv.app.kit.hooks.reports.compute({ id: people.staff2.id, role: 'staff' })
  const all = await srv.app.kit.hooks.reports.compute({ id: people.approver1.id, role: 'manager' })
  assert.ok(staff.sections.pending.count < all.sections.pending.count)
})

test('one instance, one language: the manifest, the card and the replies (ja / zh)', async () => {
  for (const [locale, name, title, unit] of [['ja', '購買申請', '購買申請', '円'], ['zh', '采购申请', '采购申请', '¥']]) {
    const s = await startServer({ serviceToken: SERVICE, bffSecret: 'purchase-test-bff-secret-0000000000000', locale })
    try {
      const manifest = await (await fetch(`${s.base}/bridge/v1/manifest`, { headers: S })).json()
      assert.equal(manifest.system.name, name)
      assert.equal(manifest.system.locale.slice(0, 2), locale)
      assert.match(manifest.templates['purchase.unanswered'].description, /PR-\{requestNumber\}/)
      const staff = await s.app.createUser({ loginId: 'staff', password: 'password-1234', role: 'staff', displayName: 'Test staff' })
      const { approval } = await s.app.requestPurchase(staff, { item: 'Monitor arm', quantity: 1, amount: 9800 })
      const card = await s.app.kit.hooks.approvals.card(s.app.data.approvals.get(approval.id))
      assert.equal(card.title, title)
      assert.ok(card.fields.some((f) => f.value.includes(unit)))
      assert.ok(card.wording.replies.approved.length > 0)
    } finally {
      await s.stop()
    }
  }
  await assert.rejects(startServer({ serviceToken: SERVICE, bffSecret: 'x', locale: 'fr' }), /locale/)
})
