# 04 manifest を書いて検証する

正本：`docs/GUIDELINE.md` b.1・d.2・d.5、`packages/protocol/README.md`、JSON Schema（`packages/protocol` 内）。
始める見本：`examples/equipment-inspection/bridge.manifest.yaml`（推奨）か `packages/protocol/manifests/example.manifest.yaml`。
（`packages/protocol/manifests/equipment-inspection.manifest.yaml` は検証用の写しでマニュアルのツールを含まない。始めるのは examples の方。）

## 1. セクションと書くこと

| セクション | 書くこと | 注意 |
|---|---|---|
| `bridge` / `version` | `bridge: 1`、manifest の版（SemVer か日付） | etag は内容から作られる |
| `system` | `id`（= DSH でのアプリ id）・`name`・`locale`・`timezone` | id はレジストリの `applications[].id` と同じ |
| `roles` | 役割ごとの `label`・`scope`・`delegation: none | read | propose` | AI 委託の上限。conformance の fixtures で全役割を写す（M3） |
| `entities` | データの種類と個人情報の分類（none < personal < financial < sensitive < health）、`link` | `approval`・`sns_identity` も宣言する |
| `audienceRules` | 受信者の規則の名前と説明 | 解決するのは業務システムの `recipientsFor`。DSH は受信者を作らない |
| `events` | 型ごとの `label`・`aggregate`・`payload`（**許可リスト**）・`severity`・`audience`・`notify`・`playbook` | payload は ID・日付・件数・状態だけ |
| `templates` | 通知の文面：`intent`（info / action / urgent / approval / consult）、action / urgent には `action`、`description`、`params` の型 | 引数は数値・日付・時刻などだけ（自由記述の文字列型は無い） |
| `tools` | AI の業務ツール：`name`（`<namespace>_*`）・`http`・`access: read | propose`・`roles`・`pii`・`input` | 書込みは必ず `access: propose`（`POST /bridge/v1/proposals`） |
| `playbooks` | 自動タスク：`agent`・`trigger`・`instructions`（禁止事項を書く）・`tools`・`audience`・`delegation`・`delivery`・`guard`・`enabled: false` | `agent` は製品 profile のプリセットになる |
| `reports` | 定時報告：`cron`・`audience`・`sections`・`sectionsByRole` | 委託で読むときに役割ごとのセクションだけ |
| `help` / `web.routes` | マニュアル検索のツール、業務 Web の画面のパスの型 | リンクの検査に `web.routes` が要る（マニュアルを使わなくても書く） |

## 2. 必ず宣言する 3 つの event（MUST）

server-kit と業務コードがこの payload のキーで書くので、無いと連携の解除と承認の作成が失敗し、conformance の L9・A1〜A4・E2 が落ちる。

```yaml
entities:
  approval:     { label: 承認, pii: none }
  sns_identity: { label: SNS 連携, pii: personal }
events:
  approval.requested:
    { label: …の承認依頼, aggregate: approval, severity: info, internal: approvals_im, audience: { rule: <承認者の規則> },
      payload: [approvalId, subjectType, subjectId, requiredRole, expiresAt] }
  approval.decided:
    { label: …の承認の決定, aggregate: approval, severity: info, internal: approvals_im,
      payload: [approvalId, subjectType, subjectId, decision, status, channel, decidedByUserId] }
  sns_identity.unlinked:
    { label: SNS 連携の解除, aggregate: sns_identity, severity: info, internal: identity, payload: [identityId, userId, platform] }
```

一覧の正本は `@dsh-bridge/protocol` の `INTERNAL_EVENTS`。`approval.decided` は `internal` を付けずに通知の event にしてもよい（payload は同じ）。

## 3. 検証（CI に入れる）

```sh
node <framework>/packages/protocol/bin/bridge-validate.mjs manifest bridge.manifest.yaml --strict
```

- `--strict` が無いと警告があっても exit 0 になるので、合格の判定には必ず付ける。
- スキーマに加え、相互参照（ツールの roles が存在する、playbook のツールが存在する、通知する event に audience と宣言済みのテンプレートがある、
  `<class>=each` の playbook が event で起動する…）と、個人情報らしい payload のキー・テンプレートの引数名（`residentName`・`comment`・`memo` など。`…Id` は可）を検査する。
- 業務のテストで `validateManifest(m).warnings` が空であることを確かめてもよい（見本 `test/domain.test.mjs`）。

## 4. 書くときの判断

- **ツールの roles**：その役割の職員が業務 Web で見られる範囲を超えない。AI の権限は「AI 許可リスト（tools の roles）∩ 職員の役割」。
- **event の粒度**：通知・自動タスク・報告で使う変化だけ。payload に氏名・連絡先・自由記述・健康情報・金額の内訳を入れない。
- **文面**：すべてのテンプレートに `intent`、action / urgent には `action`（お願いしたいこと）。事実の文は件数・日付だけ。枠（ラベル・あいさつ・署名・リンク）はプラグインが付ける。
- **playbook の instructions**：何も確定しない、氏名・個人情報をメモ・報告に書かない、業務データはツールだけで読む、何も無ければ静かに終える、を書く
  （`<framework>/profile/template/auto-tasks/README.md` の「Instruction rules」）。`enabled: false` で出し、運用者が有効にする。
- **夜間**：夜に届けてよい種別（安否など）だけ `notify.quiet: exempt`。頻繁な種別はまとめ送信（`digestMinutes`）。
- **版**：v1 の中では足すだけ。出さなくなった event の型は消さずに `deprecated: true`。
