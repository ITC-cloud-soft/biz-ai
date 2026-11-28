#!/usr/bin/env node
// Starts purchase-requests with fictional seed data (memory store: everything is gone after a restart).
//
//   PURCHASE_PORT (19760) · PURCHASE_HOST (127.0.0.1) · PURCHASE_LOCALE (en | ja | zh, default en)
//   PURCHASE_SERVICE_TOKEN / PURCHASE_BFF_SECRET (dev values unless NODE_ENV=production)
//   PURCHASE_SEED_PASSWORD (dev default: purchase-dev) — the password of the fictional employees
import { randomBytes } from 'node:crypto'
import { startServer } from './app.mjs'

const env = process.env
const production = env.NODE_ENV === 'production'
const secret = (name, dev) => {
  if (env[name]) return env[name]
  if (production) throw new Error(`${name} is required with NODE_ENV=production`)
  return dev
}
const serviceToken = secret('PURCHASE_SERVICE_TOKEN', 'purchase-dev-service-token-000000000')
const bffSecret = secret('PURCHASE_BFF_SECRET', 'purchase-dev-bff-secret-0000000000000')
const seedPassword = env.PURCHASE_SEED_PASSWORD || (production ? randomBytes(18).toString('base64url') : 'purchase-dev')
const locale = env.PURCHASE_LOCALE || 'en'

const server = await startServer({ port: Number(env.PURCHASE_PORT || 19760), host: env.PURCHASE_HOST || '127.0.0.1', locale, serviceToken, bffSecret, log: console.log })
const { app } = server

// fictional employees: two approvers, staff1 reports to approver1; one request of staff1 that has already waited 3 days
const users = {}
for (const [loginId, role, displayName, approver] of [
  ['admin', 'admin', 'Avery Admin'], ['approver1', 'manager', 'Morgan Approver'], ['approver2', 'manager', 'Jordan Approver'],
  ['staff1', 'staff', 'Sam Staff', 'approver1'], ['staff2', 'staff', 'Riley Staff', 'approver2'],
]) {
  users[loginId] = await app.createUser({ loginId, password: seedPassword, role, displayName, approverId: approver ? users[approver].id : null })
}
const { purchaseRequest } = await app.requestPurchase(users.staff1, { item: 'Laptop stand', quantity: 2, amount: 12800 })
app.data.requests.get(purchaseRequest.id).createdAt = new Date(Date.now() - 3 * 86_400_000)

console.log(`purchase-requests (${locale}) on ${server.base} — employees admin / approver1 / approver2 / staff1 / staff2${env.PURCHASE_SEED_PASSWORD || production ? '' : ' (password purchase-dev)'}`)
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, async () => { await server.stop(); process.exit(0) })
