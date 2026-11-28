// purchase-requests — a business system that speaks first, in one file.
//
// Staff request purchases; their approver decides on the web. When a request has waited 3 days, the system does not wait
// for anyone to look: it tells the approver it names (and only them) in their own chat, with the card [Approve] [Reject].
// The decision is recorded here and the requester is told. Asked "where is my request?", the AI answers with the asker's
// own rights: staff see their own requests only, and the approver is never the requester.
//
// Everything Bridge v1 needs comes from @dsh-bridge/server-kit; this file holds what knows the business: its data, its
// login and the hooks (who exists, who is told, who decides, what the AI may propose). The store is the kit's MEMORY store
// and the data are plain maps: nothing to install, nothing survives a restart. One instance speaks one language
// (locale en / ja / zh, src/messages.mjs): its manifest, approval card and replies.
import { randomUUID } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import {
  createBridgeApp, createMemoryStore, DUMMY_PASSWORD_HASH, fail, hashPassword, header, listen, loadManifest, newToken, POLICY,
  sha256, strictKeys, todayIn, UUID_RE, verifyPassword,
} from '@dsh-bridge/server-kit'
import { LOCALES, messagesFor } from './messages.mjs'

export const MANIFEST_FILE = fileURLToPath(new URL('../bridge.manifest.yaml', import.meta.url))
export const ROLES = Object.freeze(['admin', 'manager', 'staff'])
const SESSION_COOKIE = 'pr_session'
const SESSION_TTL_MS = 12 * 3600_000
export const UNANSWERED_DAYS = 3
const APPROVAL_TTL_DAYS = 14
const LOGIN_FAILURES = 5 // per login id per 10 minutes
const MANAGERS = ['admin', 'manager']
const REQUEST_NO_RE = /^PR-(\d{4,6})$/
const DAY_MS = 86_400_000

/** The manifest in the instance's language (names, labels and template texts; the rules stay the same). */
export function localizedManifest(locale) {
  const m = messagesFor(locale)
  const manifest = structuredClone(loadManifest({ file: MANIFEST_FILE }).manifest)
  Object.assign(manifest.system, { name: m.systemName, locale: m.systemLocale })
  for (const [type, label] of Object.entries(m.events)) manifest.events[type].label = label
  for (const [id, t] of Object.entries(m.templates)) {
    manifest.templates[id].description = t.description
    if (t.action) manifest.templates[id].action = t.action
  }
  return manifest
}

/** createPurchaseApp({ serviceToken, bffSecret, locale?, now?, log? }) -> { handler, kit, router, store, data, createUser, ... } */
export async function createPurchaseApp({ serviceToken, bffSecret, orgId = 'example-org', locale = 'en', now = () => new Date(), log = () => {} }) {
  if (!LOCALES.includes(locale)) throw new TypeError(`createPurchaseApp: locale must be one of ${LOCALES.join(', ')}`)
  const m = messagesFor(locale)
  const store = createMemoryStore({ now })
  const data = { users: new Map(), sessions: new Map(), requests: new Map(), byNo: new Map(), approvals: new Map(), seq: 1040 }
  const daysSince = (date) => Math.floor((now().getTime() - date.getTime()) / DAY_MS)
  const employee = (u) => u && { id: u.id, role: u.role, active: u.active }
  const day = (d) => (d ? todayIn('UTC', d) : null)

  // ── the business's own login (the kit never sees passwords) ───────────────────────────────────────────────────────
  async function createUser({ loginId, password, role, displayName, approverId = null }) {
    const u = { id: randomUUID(), loginId, role, displayName, approverId, active: true, passwordHash: await hashPassword(password) }
    data.users.set(u.id, u)
    return u
  }
  function sessionOf(req) {
    const auth = header(req, 'authorization')
    let token = auth && /^Bearer\s+/i.test(auth) ? auth.replace(/^Bearer\s+/i, '').trim() : null
    for (const part of String(header(req, 'cookie') ?? '').split(';')) {
      const [k, ...v] = part.trim().split('=')
      if (!token && k === SESSION_COOKIE) token = decodeURIComponent(v.join('='))
    }
    const s = token && data.sessions.get(sha256(token))
    return s && !s.revoked && s.expiresAt > now() ? s : null
  }
  const sessionCookie = (token, maxAge) => `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}`

  // ── who decides: the approver named for the requester (or every manager when none is named), never the requester ────
  const isApprover = (u, requesterId) => Boolean(u && u.active !== false && MANAGERS.includes(u.role) && String(u.id) !== String(requesterId))
  function approversOf(r) {
    const requester = data.users.get(r.requesterUserId)
    const named = requester?.approverId ? data.users.get(requester.approverId) : null
    if (isApprover(named, r.requesterUserId)) return [named]
    return [...data.users.values()].filter((u) => isApprover(u, r.requesterUserId))
  }
  /** The web and the chat card use the same rule: a named or eligible approver, or an administrator — not the requester. */
  function mayDecide(a, user) {
    const r = data.requests.get(a.subjectId)
    if (!r || !isApprover(user, r.requesterUserId) || String(user.id) === String(a.requestedBy)) return false
    return user.role === 'admin' || approversOf(r).some((x) => x.id === user.id)
  }

  const requestJson = (r) => ({
    id: r.id, no: r.no, requesterUserId: r.requesterUserId, item: r.item, quantity: r.quantity, amount: r.amount, currency: 'JPY',
    status: r.status, requestedOn: day(r.createdAt), decidedOn: day(r.decidedAt),
  })
  const approvalJson = (a) => ({ id: a.id, subjectType: a.subjectType, subjectId: a.subjectId, status: a.status, expiresAt: a.expiresAt.toISOString(), decidedBy: a.decidedBy ?? null, channel: a.channel ?? null })
  const visibleTo = (user) => (r) => user.role !== 'staff' || r.requesterUserId === user.id
  const unanswered = (minDays = UNANSWERED_DAYS) => [...data.requests.values()].filter((r) => r.status === 'pending' && daysSince(r.createdAt) >= minDays)
  const numberOf = (r) => Number(REQUEST_NO_RE.exec(r.no)[1])

  function checkRequest(b) {
    if (typeof b.item !== 'string' || !b.item.trim() || b.item.length > 60) fail(400, 'invalid_item')
    if (!Number.isInteger(b.quantity) || b.quantity < 1 || b.quantity > 999) fail(400, 'invalid_quantity')
    if (!Number.isInteger(b.amount) || b.amount < 1 || b.amount > 10_000_000) fail(400, 'invalid_amount')
  }

  /** A request and its approval. The approval opens in chat only when the request has waited (scanUnanswered). */
  async function requestPurchase(user, body) {
    strictKeys(body, ['item', 'quantity', 'amount'])
    checkRequest(body)
    data.seq += 1
    const r = { id: randomUUID(), no: `PR-${data.seq}`, requesterUserId: user.id, item: body.item.trim(), quantity: body.quantity, amount: body.amount, status: 'pending', createdAt: now(), decidedAt: null }
    const a = { id: randomUUID(), subjectType: 'purchase_request', subjectId: r.id, requiredRole: 'manager', requestedBy: user.id, status: 'pending', expiresAt: new Date(now().getTime() + APPROVAL_TTL_DAYS * DAY_MS) }
    Object.assign(r, { approvalId: a.id })
    data.requests.set(r.id, r)
    data.byNo.set(r.no, r.id)
    data.approvals.set(a.id, a)
    return { purchaseRequest: requestJson(r), approval: approvalJson(a) }
  }

  /**
   * The system speaks first: one purchase.unanswered per request that has waited `minDays`, and in the same transaction
   * (outbox) approval.requested — the card goes to the approvers' chat. The scheduler of a real system runs it.
   */
  async function scanUnanswered(minDays = UNANSWERED_DAYS) {
    const created = []
    for (const r of unanswered(minDays).filter((x) => !x.escalated)) {
      const a = data.approvals.get(r.approvalId)
      const ids = await kit.tx(async (t) => {
        const eventId = await kit.emitEvent(t, {
          type: 'purchase.unanswered', aggregateType: 'purchase_request', aggregateId: r.id,
          payload: { purchaseRequestId: r.id, requesterUserId: r.requesterUserId, requestNumber: numberOf(r), daysWaiting: daysSince(r.createdAt) },
        })
        const approvalEventId = await kit.emitEvent(t, {
          type: 'approval.requested', aggregateType: 'approval', aggregateId: a.id,
          payload: { approvalId: a.id, subjectType: a.subjectType, subjectId: a.subjectId, requiredRole: a.requiredRole, expiresAt: a.expiresAt.toISOString() },
        })
        return { eventId, approvalEventId }
      })
      r.escalated = true // the memory store cannot roll maps back: change them after the events are written
      created.push({ purchaseRequestId: r.id, requestNo: r.no, approvalId: a.id, ...ids })
    }
    return created
  }

  /** A person's decision (web or chat card) inside the caller's transaction: approval.decided + purchase.decided. */
  async function decide(t, a, { action, actor, channel }) {
    if (a.status !== 'pending') fail(409, 'already_decided')
    if (a.expiresAt <= now()) fail(409, 'approval_expired')
    const r = data.requests.get(a.subjectId)
    const status = action === 'approve' ? 'approved' : 'rejected'
    await kit.emitEvent(t, {
      type: 'approval.decided', aggregateType: 'approval', aggregateId: a.id,
      payload: { approvalId: a.id, subjectType: a.subjectType, subjectId: a.subjectId, decision: action, status, channel, decidedByUserId: actor.id },
    })
    await kit.emitEvent(t, {
      type: 'purchase.decided', aggregateType: 'purchase_request', aggregateId: r.id,
      payload: { purchaseRequestId: r.id, requesterUserId: r.requesterUserId, requestNumber: numberOf(r), decision: status },
    })
    Object.assign(a, { status, decidedBy: actor.id, channel })
    Object.assign(r, { status, decidedAt: now(), decidedBy: actor.id, channel })
    return approvalJson(a)
  }

  // ── the hooks: the only Bridge code that knows this business ─────────────────────────────────────────────────────
  const hooks = {
    employees: {
      get: async (id) => employee(data.users.get(String(id))),
      getMany: async (ids) => ids.map((id) => employee(data.users.get(String(id)))).filter(Boolean),
      list: async ({ roles } = {}) => [...data.users.values()].filter((u) => u.active && (!roles || roles.includes(u.role))).map(employee),
    },
    authenticate: async (req) => {
      const s = sessionOf(req)
      const u = s && data.users.get(s.userId)
      return u?.active ? { user: { id: u.id, role: u.role }, sessionId: s.sessionId } : null
    },
    isSessionLive: async (sessionId) => [...data.sessions.values()].some((s) => s.sessionId === sessionId && !s.revoked && s.expiresAt > now()),

    /** Who is told, with which typed parameters (never names). The system decides, not the AI. */
    recipientsFor: async (event) => {
      if (!['purchase.unanswered', 'purchase.decided'].includes(event.type)) return null
      const r = data.requests.get(event.payload.purchaseRequestId)
      if (!r) return { stale: 'deleted' }
      const link = `/purchase-requests/${r.id}`
      if (event.type === 'purchase.decided') {
        const requester = data.users.get(r.requesterUserId)
        return {
          users: requester?.active ? [employee(requester)] : [],
          template: event.payload.decision === 'approved' ? 'purchase.approved' : 'purchase.rejected',
          dedupeKey: `purchase.decided:${r.id}`, link, paramsFor: () => ({ requestNumber: numberOf(r) }),
        }
      }
      if (r.status !== 'pending') return { stale: 'decided' }
      return {
        users: approversOf(r).map(employee), // only the approver(s) the system names: not the requester, not the other staff
        dedupeKey: `purchase.unanswered:${r.id}`, link,
        paramsFor: () => ({ requestNumber: numberOf(r), daysWaiting: event.payload.daysWaiting }),
      }
    },

    approvals: {
      get: async (id) => data.approvals.get(String(id)) ?? null,
      approvers: async (a) => {
        const r = data.requests.get(a.subjectId)
        return r ? approversOf(r).filter((u) => mayDecide(a, u)).map(employee) : []
      },
      /** The chat card: the request number, the item, the amount and how long it has waited — no names. */
      card: async (a) => {
        const r = data.requests.get(a.subjectId)
        const waited = r ? daysSince(r.createdAt) : 0
        return {
          title: m.card.title,
          fields: r ? [
            { label: m.card.fields.request, value: r.no },
            { label: m.card.fields.item, value: m.item(r.item, r.quantity) },
            { label: m.card.fields.amount, value: m.amount(r.amount) },
            { label: m.card.fields.waiting, value: m.days(waited) },
          ] : [],
          body: m.card.body,
          wording: { lead: m.card.lead(r?.no ?? '-', waited), ask: m.card.ask, buttons: m.card.buttons, replies: m.card.replies, statusBody: m.card.statusBody },
        }
      },
      mayDecide: async (a, user) => mayDecide(a, data.users.get(String(user?.id)) ?? user), // the same rule as the web
      decide: (a, decision, ctx) => decide(ctx.t, a, decision),
    },

    /** What the AI may propose (a person accepts or rejects every proposal; apply runs only then). */
    proposalKinds: {
      purchase_quantity: {
        roles: ['admin', 'manager', 'staff'],
        async validate(p, ctx, principal) {
          strictKeys(p, ['purchaseRequestId', 'quantity', 'reason'], 'invalid_payload')
          if (typeof p.purchaseRequestId !== 'string' || !UUID_RE.test(p.purchaseRequestId)) fail(400, 'invalid_payload')
          if (!Number.isInteger(p.quantity) || p.quantity < 1 || p.quantity > 999) fail(400, 'invalid_payload')
          const r = data.requests.get(p.purchaseRequestId)
          if (!r || r.status !== 'pending') fail(422, 'purchase_request_not_pending')
          if (principal?.user?.role === 'staff' && r.requesterUserId !== principal.user.id) fail(422, 'purchase_request_not_pending') // staff: their own only
        },
        async apply(p) { data.requests.get(p.purchaseRequestId).quantity = p.quantity },
      },
      purchase_cancel: {
        roles: MANAGERS,
        async validate(p) {
          strictKeys(p, ['purchaseRequestId'], 'invalid_payload')
          if (!data.requests.get(String(p.purchaseRequestId))) fail(422, 'purchase_request_not_found')
        },
        async apply(p) { data.requests.get(p.purchaseRequestId).status = 'cancelled' },
      },
    },

    /** The scheduled report: counts per section, scoped by role (staff: their own). */
    reports: {
      compute: async (viewer) => {
        const mine = [...data.requests.values()].filter(visibleTo({ role: viewer.role, id: viewer.id }))
        const pending = mine.filter((r) => r.status === 'pending')
        return { sections: { pending: { count: pending.length }, waiting_3_days: { count: pending.filter((r) => daysSince(r.createdAt) >= UNANSWERED_DAYS).length } }, attention: pending.length }
      },
    },

    /** Names live only here, in the roster: a text that contains one is refused by long-term memory. */
    piiScan: async (text) => {
      const hay = String(text).normalize('NFKC').toLowerCase()
      const hit = [...data.users.values()].some((u) => u.displayName.length >= 2 && hay.includes(u.displayName.normalize('NFKC').toLowerCase()))
      return { kinds: hit ? ['staff_name'] : [] }
    },
  }

  const bridge = await createBridgeApp({
    manifest: { manifest: localizedManifest(locale) }, store, serviceToken, bffSecret, orgId, service: 'purchase-requests', version: '0.1.0', hooks, now, log,
    roles: { reportReaders: MANAGERS, reportRunners: ['admin'], proposalReviewers: MANAGERS, admins: ['admin'] },
  })
  const { kit, router } = bridge

  // ── the business web API (/api/*), on the kit's router and gate ─────────────────────────────────────────────────────
  // A read endpoint the AI may call is a manifest tool (kit.readToolPolicy); every write is people only.
  const HUMAN = { allow: ['user'] }
  const HUMAN_MANAGERS = { allow: ['user'], roles: MANAGERS }
  const ADMIN = { allow: ['user'], roles: ['admin'] }

  router.add('POST', '/api/auth/login', POLICY.PUBLIC, async ({ body }) => {
    const b = body ?? {}
    strictKeys(b, ['loginId', 'password'])
    if (typeof b.loginId !== 'string' || !b.loginId || b.loginId.length > 64 || typeof b.password !== 'string' || b.password.length > 200) fail(400, 'invalid_credentials')
    if (await store.countHits('login_failure', b.loginId, 10) >= LOGIN_FAILURES) fail(429, 'too_many_attempts')
    const u = [...data.users.values()].find((x) => x.loginId === b.loginId)
    const ok = await verifyPassword(b.password, u?.passwordHash ?? DUMMY_PASSWORD_HASH) // same work whether or not the id exists
    if (!u || !ok || !u.active) {
      await store.addHit('login_failure', b.loginId)
      fail(401, 'invalid_credentials')
    }
    const token = newToken('prs')
    const s = { sessionId: randomUUID(), userId: u.id, expiresAt: new Date(now().getTime() + SESSION_TTL_MS), revoked: false }
    data.sessions.set(sha256(token), s)
    return { status: 200, body: { ok: true, user: { id: u.id, role: u.role } }, headers: { 'set-cookie': sessionCookie(token, SESSION_TTL_MS / 1000) } }
  })

  router.add('POST', '/api/auth/logout', HUMAN, async ({ principal }) => {
    for (const s of data.sessions.values()) if (s.sessionId === principal.sessionId) s.revoked = true
    await store.revokeTicketsBySession(principal.sessionId)
    return { status: 200, body: { ok: true }, headers: { 'set-cookie': sessionCookie('', 0) } }
  })

  router.add('GET', '/api/me', HUMAN, async ({ principal }) => {
    const u = data.users.get(principal.user.id)
    return { status: 200, body: { ok: true, user: { id: u.id, loginId: u.loginId, displayName: u.displayName, role: u.role, approverId: u.approverId } } }
  })

  router.add('GET', '/api/purchase-requests', kit.readToolPolicy('GET /api/purchase-requests', [...ROLES]), async ({ principal, query }) => {
    const status = query.get('status') ?? 'all'
    if (!['pending', 'approved', 'rejected', 'cancelled', 'all'].includes(status)) fail(400, 'invalid_status')
    const list = [...data.requests.values()].filter(visibleTo(principal.user)).filter((r) => status === 'all' || r.status === status)
    return { status: 200, body: { ok: true, purchaseRequests: list.map(requestJson) } }
  })

  router.add('GET', '/api/purchase-requests/unanswered', kit.readToolPolicy('GET /api/purchase-requests/unanswered', MANAGERS), async () => ({
    status: 200,
    body: { ok: true, purchaseRequests: unanswered().map((r) => ({ id: r.id, no: r.no, amount: r.amount, daysWaiting: daysSince(r.createdAt) })) },
  }))

  // one request by its number; another employee's request is "not found" for staff (its existence is not disclosed)
  router.add('GET', '/api/purchase-requests/:requestNo', kit.readToolPolicy('GET /api/purchase-requests/{requestNo}', [...ROLES]), async ({ principal, params }) => {
    if (!REQUEST_NO_RE.test(params.requestNo)) fail(400, 'invalid_request_no')
    const r = data.requests.get(data.byNo.get(params.requestNo) ?? '')
    if (!r || !visibleTo(principal.user)(r)) fail(404, 'purchase_request_not_found')
    return { status: 200, body: { ok: true, purchaseRequest: requestJson(r) } }
  })

  router.add('POST', '/api/purchase-requests', HUMAN, async ({ principal, body }) => ({ status: 201, body: { ok: true, ...(await requestPurchase(principal.user, body ?? {})) } }))

  router.add('POST', '/api/approvals/:approvalId/decision', HUMAN_MANAGERS, async ({ principal, params, body }) => {
    const b = body ?? {}
    strictKeys(b, ['action'])
    if (!['approve', 'reject'].includes(b.action)) fail(400, 'invalid_action')
    const a = data.approvals.get(params.approvalId)
    if (!a) fail(404, 'approval_not_found')
    if (!mayDecide(a, data.users.get(principal.user.id))) fail(403, 'role_not_permitted')
    const approval = await kit.tx(async (t) => {
      const out = await decide(t, a, { action: b.action, actor: principal.user, channel: 'web' })
      await t.revokeApprovalDeliveries({ approvalId: a.id }) // the chat cards of this approval stop working
      return out
    })
    return { status: 200, body: { ok: true, approval } }
  })

  router.add('POST', '/api/admin/users', ADMIN, async ({ body }) => {
    const b = body ?? {}
    strictKeys(b, ['loginId', 'password', 'role', 'displayName', 'approverId'])
    if (typeof b.loginId !== 'string' || !/^[A-Za-z0-9._-]{3,64}$/.test(b.loginId)) fail(400, 'invalid_login_id')
    if (typeof b.password !== 'string' || b.password.length < 8 || b.password.length > 200) fail(400, 'invalid_password')
    if (!ROLES.includes(b.role)) fail(400, 'invalid_role')
    if (typeof b.displayName !== 'string' || !b.displayName.trim() || b.displayName.length > 60) fail(400, 'invalid_display_name')
    if (b.approverId !== undefined && b.approverId !== null && !MANAGERS.includes(data.users.get(String(b.approverId))?.role)) fail(400, 'invalid_approver')
    if ([...data.users.values()].some((u) => u.loginId === b.loginId)) fail(409, 'login_id_taken')
    const u = await createUser(b)
    return { status: 201, body: { ok: true, user: { id: u.id, loginId: u.loginId, role: u.role, active: u.active, approverId: u.approverId } } }
  })

  router.add('PATCH', '/api/admin/users/:userId', ADMIN, async ({ principal, params, body }) => {
    const b = body ?? {}
    strictKeys(b, ['active'])
    if (typeof b.active !== 'boolean') fail(400, 'invalid_active')
    const u = data.users.get(params.userId)
    if (!u) fail(404, 'user_not_found')
    if (u.id === principal.user.id && b.active === false) fail(422, 'cannot_deactivate_self')
    u.active = b.active
    // deactivation ends the employee's sessions and delegations at once (the kit re-checks hooks.employees on every use)
    if (!u.active) {
      for (const s of data.sessions.values()) if (s.userId === u.id) s.revoked = true
      await store.revokeDelegationsByUser(u.id)
    }
    return { status: 200, body: { ok: true, user: employee(u) } }
  })

  router.add('POST', '/api/admin/unanswered-scan', HUMAN_MANAGERS, async ({ body }) => {
    const b = body ?? {}
    strictKeys(b, ['minDays'])
    const minDays = b.minDays ?? UNANSWERED_DAYS
    if (!Number.isInteger(minDays) || minDays < 0 || minDays > 30) fail(400, 'invalid_min_days')
    return { status: 200, body: { ok: true, created: await scanUnanswered(minDays) } }
  })

  return { ...bridge, kit, router, store, data, locale, createUser, requestPurchase, scanUnanswered, approversOf }
}

/** A running instance (server.mjs, the tests, the demo). */
export async function startServer({ port = 0, host = '127.0.0.1', ...options }) {
  const app = await createPurchaseApp(options)
  const http = await listen(app.handler, { port, host })
  return { app, base: http.base, stop: http.stop }
}
