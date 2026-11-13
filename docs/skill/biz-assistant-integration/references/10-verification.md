# 10 検証：conformance・完了の条件・最終チェックリスト

正本：`docs/GUIDELINE.md` b.4・「チェックリスト」・「完了の条件（コマンドで確かめる）」・e 節、`packages/protocol/README.md`（52 項目の一覧）。

## 1. conformance suite（52 項目）

```sh
BRIDGE_BASE_URL=http://127.0.0.1:<TEST 環境のポート> \
BRIDGE_SERVICE_TOKEN=<テスト用> BRIDGE_BFF_SECRET=<テスト用> \
BRIDGE_FIXTURES=./test/fixtures.mjs BRIDGE_MANIFEST_FILE=./bridge.manifest.yaml \
node --test <framework>/packages/protocol/conformance/http.test.mjs        # 同じものが bridge-validate conformance
```

- **TEST 環境**に対して走らせる（本番・デモ環境には向けない）。値は毎回生成したテスト用のもの。
- CI では見本の `examples/equipment-inspection/test/conformance.test.mjs` の形（起動・一時 DB・片付けまで 1 つのテスト）にする。
- 自分で起動・DB を用意したい、古いパスに書き換えたいシステムはアプリケーション adapter（`BRIDGE_ADAPTER=./my-app.adapter.mjs`、見本 `conformance/adapters/example-adapter.mjs`）。

### fixtures（`conformance/fixtures.example.mjs` を写し、実物は見本の `test/fixtures.mjs`）

- `employees`：`admin`・`manager`・`staff` の 3 人（ログイン済み）。`newEmployee(role)` は汎用の役割 `admin`・`manager`・`staff`・`billing` を自分の役割へ写す：
  - `admin` = 報告を今すぐ実行できる管理者（それでも他人の連携は見えない）
  - `manager` = 報告を読み、承認と提案の採択ができる役割
  - `staff` / `billing` = 報告を読めない一般の役割
  - `roles` には manifest のすべての役割を挙げる（M3）
- `capabilities`：`approvals: true`（`false` は A1〜A4 が skip）、`personalBots`（`false` は B1〜B4 が skip）、`personalBotPlatform`。
- 提案の見本 2 つ：委託の役割が作れるもの（`proposalSample`：PR1・PR2）と、作れないもの（`proposalForbiddenSample`：PR3）。
- hook：`expireLinkCode`・`expireDelegation`・`revokeSession`・`deactivateEmployee`・`emitNotifiableEvent`（**その employee を受信者に含む** event を作る）・
  `createPendingApproval`・`produceEvents`・`tryEmitEvent`・`writeProbes`（業務の書込み API をすべて挙げる）。
- hook が無い項目は **skip** になる。リリースの条件は skip 無し。

### よく落ちる項目と原因

| 落ちる項目 | よくある原因 |
|---|---|
| R1〜R3、P4・L9・D6・D7・S2・S4、D3 | 報告（manifest の `reports` と `hooks.reports`）が無い |
| A1〜A4 | 承認の hooks が無い、`capabilities.approvals: false`、`approvals.get` が snake_case の行を返している |
| L9・E2 | 3 つの内部 event（`approval.requested`・`approval.decided`・`sns_identity.unlinked`）の宣言漏れ |
| D4 | `readToolPolicy` の役割と manifest の `tools[].roles` が違う |
| D5 | 書込み API が委託を通している、`writeProbes` の漏れ |
| M3 | fixtures の `roles` に manifest の役割が足りない |
| N1〜N3 | `emitNotifiableEvent` の event がその職員を受信者に含まない、`paramsFor` に文字列 |
| S4 | `isSessionLive` が無い |

## 2. 完了の条件（コマンドで確かめる）

| # | 何を | コマンド | 合格 |
|---|---|---|---|
| 1 | manifest | `node <framework>/packages/protocol/bin/bridge-validate.mjs manifest bridge.manifest.yaml --strict` | exit 0 |
| 2 | conformance | 上の 1 節 | `52 passed, 0 known gaps, 0 skipped` |
| 3 | 業務システム自身のテスト | `node --test test/*.test.mjs`（Windows は `--test-isolation=none`） | 全部 pass（最低限の中身は `05-business-side.md` の 5 節） |
| 4 | マニュアル（使うなら） | 業務のテストで `checkAnchors`・`checkSectionPaths`・`checkCoverage`・`checkRoleText`・`checkLinks` が空、索引をコミットする形なら `serializeIndex(buildHelpIndex(...))` が一致 | 空・同じ |
| 5 | 製品 profile | `node <framework>/profile/scripts/install.mjs --source <製品の profile> --home <一時のディレクトリ> --profile <名前> --skip-install` | `template placeholders left` の警告なし |
| 6 | 送信の設定 | `node <framework>/profile/scripts/check.mjs <製品の profile>/cordis.patch.yml`（意図した opt-in だけ `--allow <rule>`、手で書いた自動タスクの委託は `--allow unattendedPolicy`） | exit 0 |
| 7 | 固定の配信先の拒否 | 5 のコマンドに `--auto-task-target x` を足す | exit 2 |
| 8 | 業務 Web | `tsc --noEmit` | エラーなし |
| 9 | framework を変えたときだけ | `<framework>` で `pnpm validate`・`pnpm test` | ok・fail 0 |

- framework の e2e（`pnpm run e2e`）は今は見本専用。新しいシステム・つないだシステムの完了は 1〜8 で判定する。
- 実際のチャット・モデルでの確認は手動。やっていなければ報告に「未確認」と書く。

## 3. 最終チェックリスト（GUIDELINE「チェックリスト」の写し。原文で最新を確かめる）

- [ ] `bridge-validate manifest --strict` が exit 0
- [ ] すべての状態変化が `kit.tx` + `emitEvent`（外付けなら取り込みの規則）
- [ ] 新しいシステムなら：置き場所と依存が b.0 のどちらか、framework の中を書き換えていない
- [ ] 3 つの内部 event を宣言した
- [ ] conformance 52 / 52、`knownGaps` 空、skip 無し
- [ ] レジストリ：`system.id` = アプリ id、ツールは `<namespace>_*`、全ボットを列挙（`strict: true`）、トークンは環境変数の名前だけ
- [ ] 文面：全テンプレートに `intent`、action / urgent に `action`
- [ ] DSH 側のコードは `kit.requestJson` / `kit.proposeTool` だけ
- [ ] 業務 Web：SNS 連携・通知設定・承認・提案の画面。BFF の秘密は BFF 自身の呼び出しだけ
- [ ] 自動タスク：委託の分類と職員（または `each`）、playbook の禁止事項、`agent` のプリセット
- [ ] 受信者：すべての通知 event で範囲を決め、関門で確かめ、決まらなければ送らない
- [ ] 送信の設定：雛形の閉じた値。opt-in は理由付き
- [ ] payload・引数に氏名・自由記述・健康情報・日本語の文を入れていない
- [ ] 個人ボットを使うなら：本人用 RPC・`createOnly`・管理者の一覧から外す
- [ ] リンクの検査：すべてのアプリに `linkGuard` の URL と、manifest に `web.routes`
- [ ] アプリが 2 つ以上なら：既定でないアプリごとの `webUrl`・`bots`・`agents[].application`・`webUrls`・委託
- [ ] 任意の機能を使うなら：マニュアルの CI、`hooks.piiScan`、`AiProfilePage`、添付の設定とスキャン PDF の扱い、外部連携の `secretKey`・承認・規則の task
