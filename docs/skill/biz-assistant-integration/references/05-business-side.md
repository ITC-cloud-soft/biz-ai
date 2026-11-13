# 05 業務側を実装する：hooks・event・受信者・承認・提案・報告

正本：`docs/GUIDELINE.md` b.2・b.3・d.1・d.3・d.8、`packages/server-kit/README.md`「Hooks」、見本 `examples/equipment-inspection/src/hooks.mjs`・`src/domain.mjs`・`src/routes.mjs`。

## 1. hooks の契約

どの hook も `ctx = { db, t, emitEvent, now, lock? }` を受け取る（`ctx.db` はそのときのトランザクションの client）。

| hook | 必須 | 返すもの・守ること |
|---|---|---|
| `employees.get(id, ctx)` / `employees.list({ roles }, ctx)` | 必須 | `{ id, role, active }`（`list` は有効な職員だけ）。委託の利用・連携・決定のたびに確かめる。無効にした職員はすべてのトークンを即時に失う。`getMany` は任意 |
| `authenticate(req)` | `/me/*` に必須 | 既存のセッション（cookie / bearer）→ `{ user: { id, role }, sessionId }` |
| `isSessionLive(sessionId, ctx)` | conformance S4 のため実質必須 | Web アシスタントのチケットと委託を Web セッションと一緒に終わらせる |
| `recipientsFor(event, ctx)` | 通知に必須 | `null`（通知しない）／`{ stale: '理由' }`（状況が変わり不要）／`{ users, paramsFor(user), link, dedupeKey, template? }` |
| `approvals.{get, approvers, card, mayDecide, decide}` | 必須（52 / 52） | 規則は Web と**同じ関数**。`get` は **camelCase**（`expiresAt`・`requestedBy`。DB の生の行を返さない。`ctx.lock` なら `FOR UPDATE`）。`card` は ID・金額・期限だけ（任意で `wording`）。`decide` は `ctx.t` の中で決定を書き `approval.decided` を出す。独自の状態名なら `state(a)` で `'pending'` に写す |
| `proposalKinds[kind]` | 提案に必須 | `{ roles, validate(payload, ctx, principal), apply(payload, actor, ctx, proposal) }`。`apply` は人が採択したときだけ、kit のトランザクションの中で動く。**業務の書込みは `ctx.db` で**。`connector_write` は外部連携が使う名前 |
| `reports` | 必須（52 / 52） | `{ kind?, compute(viewer, ctx) }` → `{ sections: { <名前>: 件数の object }, attention, date? }`。kit が `viewer.sections` だけを残す |
| `piiScan(text, ctx)` | 名前を持つシステムは必須 | `{ kinds: string[] }`（区分だけ。当たった文字列は返さない）。例外は 503 `pii_scan_failed`（記憶は保存しない） |
| `eventDelegations[type]` | `<class>=each` に必須 | `{ eligible(event, user, ctx), personOf?(event), maxAgeHours? }`。発行と毎回の利用で確かめる |

その他の選択肢：`roles: { reportReaders, reportRunners, proposalReviewers, admins }`（提案を採択できる人の既定は報告の読み手）、`aiProfile: false`、`attachments`、`connectors`、`help`、`personalBotPlatforms`。

## 2. AI に読ませる API と、人だけの書込み

```js
bridge.router.add('GET', '/api/orders/overdue', bridge.kit.readToolPolicy('GET /api/orders/overdue', ['admin', 'manager']), handler)
bridge.router.add('POST', '/api/orders', { allow: ['user'] }, handler)   // 書込みは人のセッションだけ（委託は 403）
```

- `readToolPolicy` の役割は manifest の同じツールの `roles` と一致させる（conformance D4）。
- 業務の書込み API はすべて conformance の `writeProbes` に挙げる（D5）。
- 金額は業務システムが計算する。提案の入力に金額を入れない（手書きの提案ツールなら `forbidden: ['amount']`）。

## 3. event をトランザクションで書く（outbox）

```js
return kit.tx(async (t) => {
  const { rows } = await t.db.query('insert into shipment (...) values (...) returning id', [...])
  await kit.emitEvent(t, {
    type: 'shipment.completed', aggregateType: 'shipment', aggregateId: rows[0].id,
    payload: { shipmentId: rows[0].id, orderId, shippedOn },     // manifest の許可リストのキーだけ
  })
  return { status: 201, body: { ok: true, id: rows[0].id } }
})
```

- **MUST** 業務の変化と同じトランザクション（後から差分を拾うと、commit されなかった変化を知らせる・commit された変化を落とす）。
- **MUST** payload はその型の許可リストのキーだけ。違反は `EventRejected`（業務の行も残らない）。
- Web で承認を決めたら `t.revokeApprovalDeliveries({ approvalId })` でチャットのカードを無効にする。
- 定期の業務処理（期限超過の走査など）は `startScheduler({ kit, tasks: [{ name, everyMinutes, run }] })`。冪等（期限・日付ごとに 1 回）に。
  外部連携の規則を使うなら `{ name: 'connector-rules', everyMinutes: 1, run: () => kit.connectors.tick() }`。

## 4. 受信者の決め方（d.8 の MUST）

```js
async function recipientsFor(event, ctx) {
  if (event.type !== 'order.overdue') return null
  const { orderId, dueDate } = event.payload
  const o = (await ctx.db.query('select status, due_date, branch_id, owner_user_id from orders where id = $1', [orderId])).rows[0]
  if (!o || o.status === 'cancelled') return { stale: 'order_closed' }
  if (o.due_date > dueDate) return { stale: 'rescheduled' }
  const candidates = /* 担当者 + その支店の manager（有効な職員だけ） */ []
  const users = []
  for (const u of candidates) if (await mayViewOrder(u, o, ctx)) users.push(u)   // 関門：Web の認可と同じ関数
  if (users.length === 0) return { stale: 'no_scope' }
  return {
    users, template: 'order.overdue', dedupeKey: `order.overdue:${orderId}:${dueDate}`,
    link: `/orders/${orderId}`,                                     // ID だけのパス。開くときに業務 Web が改めて認可する
    paramsFor: (u) => ({ count: /* その人が見られる範囲の件数 */ 0, dueDate }),   // 数値と日付だけ
  }
}
```

1. event ごとの規則（役割・本人あて・除く人）に、event の**対象**（顧客・支店・部署・法人全体…）を持たせる。
2. 役割の受信者は対象の範囲の職員だけにする。
3. **関門**：1 人ずつ「その人が業務 Web で同じ対象を見られるか」を Web の認可と同じ関数で確かめる。落とした人は送らず、監査に ID と理由の符号だけ残す。
4. 件数は受信者が見られる範囲で数える。回付（`audience.fallback`）は受け手が 0 人のときだけ。
5. 範囲が決められなければ誰にも送らない。役割の全員に送るのは、その event が本当に法人全体のものだけ。

## 5. 業務のテストで確かめること（最低限）

- 状態の変化と event が同じトランザクション（manifest が拒む payload なら業務の行も残らない）
- `recipientsFor` の関門（範囲の外の職員が入らない・状況が変われば `stale`）
- Web の承認が `mayDecide` を使い 1 回で決まる
- 委託トークンで業務の書込みが 403 `delegation_not_permitted`
- `hooks.piiScan` が名簿の名前に区分を返す
- （BFF があれば）ブラウザの `POST /bridge/v1/me/personal-bots` を秘密付きで中継しない
