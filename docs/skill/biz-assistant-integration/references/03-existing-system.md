# 03 既存の業務システムにつなぐ

正本：`docs/GUIDELINE.md` b.2・b.2'・b.10、`packages/server-kit/README.md`、`packages/protocol/README.md`、`packages/protocol/openapi/bridge-v1.yaml`。

## A. Node.js のシステムに server-kit を載せる

既存のサーバに `createBridgeApp` を足し、hooks を既存の表・関数につなぐ。Bridge の部分（連携コード・委託・outbox・通知の解決・承認カード・報告・提案・manifest 配信・
個人ボットの登録・プロフィール・添付・pii-scan）は kit が持つ。

```js
import { createBridgeApp, createPool, createPostgresStore } from '@dsh-bridge/server-kit'
const store = createPostgresStore({ pool: await createPool(process.env.MY_DATABASE_URL) })
await store.migrate()                                   // bridge_* の表（冪等）
const bridge = await createBridgeApp({
  manifest: { file: './bridge.manifest.yaml' },
  store,
  serviceToken: process.env.MY_SERVICE_TOKEN,           // DSH の x-service-token
  bffSecret: process.env.MY_BFF_SECRET,                 // 業務 Web の BFF の x-bff-secret
  orgId: 'my-org', service: 'my-system', version: '1.0.0',
  hooks: { employees, authenticate, isSessionLive, recipientsFor, approvals, proposalKinds, reports, piiScan },
})
// node:http なら bridge.handler、express なら bridge.middleware を既存のサーバに組み込む
```

- 既存の DB に `bridge_*` の表が足される（業務の表は変えない）。DB の接続は既存と同じでよい。
- `authenticate(req)` は**既存のセッション**（cookie / bearer）から `{ user: { id, role }, sessionId }` を返す。kit はパスワードを見ない。
- 状態を変える既存の処理に、同じトランザクションで `kit.emitEvent` を足す（既存のトランザクションの接続を kit に渡せるかを確かめる。
  渡せなければ、その処理を `kit.tx` の中に移す）。詳しくは `05-business-side.md`。
- AI に読ませる既存の GET には `readToolPolicy` を付けて委託を受け付ける。書込みの API は委託を 403 にする（`delegation_not_permitted`）。

## B. 同じ働きの API がある：別名で載せる

```js
import { aliasTableFromOpenApi, camelRows, registerAliasRoutes } from '@dsh-bridge/server-kit'
const table = [
  { operationId: 'lookupIdentity', method: 'GET', path: '/identity', aliases: [{ method: 'GET', path: '/api/ai/identity', status: 'exact' }] },
  { operationId: 'listMyIdentities', method: 'GET', path: '/me/identities', aliases: [{ method: 'GET', path: '/api/sns-identities', status: 'shape' }] },
]   // または aliasTableFromOpenApi(注釈付きの bridge-v1.yaml, { key: 'x-alias' })
registerAliasRoutes(router, { table, from: legacyRouter, adapters: { listMyIdentities: camelRows('identities') } })
```

- `status`：`exact`（同じ形）・`shape`（変換が要る：`adapters`）・`missing`（まだ無い → 足してから別名を付ける）。主体ごとに別のルートなら `for: ['service' | 'delegated' | 'user']`。
- 解決できない別名は `skipped` に出し、黙って配信しない。
- 対応表を注釈付きの `bridge-v1.yaml` の `x-alias` に書けば、`bridge-validate aliases <file> --extension x-alias --label my-app` で一覧、`lintOpenApi` で検査できる。
- DSH 側は `pathProfiles`（`/bridge/v1` でない経路）でも合わせられる（`06-dsh-profile.md`、GUIDELINE c 節）。

## C. Node.js 以外の言語

- `packages/protocol/openapi/bridge-v1.yaml` をそのまま実装する。すべての応答に `bridge-protocol: 1`、エラーは `{ ok: false, error: <lower_snake_case> }`。
- server-kit が持つ規則（連携コードの 1 回限り・試行の制限、委託 ≤ 5 分と「AI 許可リスト ∩ 役割」、payload の許可リスト、承認の 1 回、個人ボットの持ち主の規則、
  プロフィールの `validateAiProfile` 相当など）を自分で実装する。迷ったら server-kit の該当部分を読む。
- 検証は conformance suite（汎用の HTTP adapter）で 52 / 52（`10-verification.md`）。

## D. 外付けモード（試行）

既存システムのコードに手を入れず、外に**ブリッジ専用のサービス**（server-kit の上、`bridge_*` は自分の DB）を置き、既存システムの API を呼んで Bridge v1 を出す。
判定は `01-assessment.md` の 4 能力。満たし方が変わる項目：

| # | 外付けでの満たし方 |
|---|---|
| 1 | 読取ツールは外付けの経路で、中で既存の読取 API を**本人として**呼ぶ。提案は外付けに置き、採択時だけ `apply` が既存の書込み API を採択した人として呼ぶ |
| 3 | SNS 連携の画面は外付けが配る。ログインは既存の IdP の OIDC / SAML、または既存のセッションを確かめる口。`authenticate` は既存の職員 ID を返す。別の ID 体系を作らない |
| 4 | `recipientsFor` は既存の API から担当・承認者・所属を取って決める。取れなければ通知しない（外付けで割り当ての規則を作らない） |
| 5 | 取り込み：CDC か条件を満たす webhook から、**1 つのトランザクション**で「取り込んだ変化 ID の記録」と `kit.emitEvent` を書く（同じ変化 ID の 2 回目は何もしない）。ポーリングは状態の知らせだけ |
| 6 | `employees` は既存の職員 API から。キャッシュしない。万能のサービスアカウントで読んで外付けで絞らない |
| 7 | 承認は既存の承認 API を本人として呼ぶ。規則を外付けに写さない |
| 8 | `isSessionLive` は既存のセッションを確かめる口を呼ぶ |

- 取り込みのコード例・webhook の 5 条件・遅れの監視・順序の扱いは GUIDELINE b.10 の「試行の規則：event の取り込み」をそのまま守る。
- 外付けブリッジ自身のテストで「同じ変化を 2 回送っても event は 1 つ」「commit 前に止めて再送しても 1 つ」「2xx は commit の後」を確かめる（52 項目はこれを確かめない）。
- 説明で言ってよいのは「既存システムに SSO・API・変化の知らせがあれば、コードを変えずにつなげる」まで。「どのシステムも変えずに」とは言わない。
- 後で業務を 1 つずつ新しいシステム（server-kit）へ移せる（Bridge v1 が継ぎ目なので DSH 側は変わらない）。
