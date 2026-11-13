# 08 任意の機能

正本：`docs/GUIDELINE.md` b.8・b.9・d.10〜d.13、`packages/help/README.md`、`plugins/memory/README.md`、`plugins/persona/README.md`、`plugins/reader/README.md`、
`docs/AI_EMPLOYEE_PROFILE.md`、`docs/ASSISTANT_ATTACHMENTS.md`、`docs/DOCUMENT_READS.md`。

## 1. SNS で使い方に答える（マニュアル、b.8）

1. **マニュアル**：1 画面 = 1 節（`## 画面名`、`<a id="manual-…"></a>`、表：URL・メニュー・使える役割・関連する画面・キーワード、本文：できること・操作の流れ・注意・よくある質問）。
   形式は `packages/help/README.md`。言い換えは `_synonyms.yml`、節を持たない経路は `_exclude.txt`（理由を書く）。
2. **索引と CI**：マニュアルと業務システムの**経路の表**（`[{ path, roles }]`：ルーターと Guard から）を読み、`buildHelpIndex` → JSON をコミット。
   CI で `serializeIndex(buildHelpIndex(...))` と比べ、`check*`（経路・網羅・役割・メニュー名・アンカー・リンク）が空であることを確かめる。
   manifest の `web.routes` も同じスクリプトで書く（`setManifestWebRoutes`）。画面が少なければ見本の簡易形（起動時に索引を作り `check*` だけ確かめる）でよい。
3. **API**：`createBridgeApp({ help: createHelpService(index, { webBase, roleLabels, manualPage }) })`。質問を記録するなら個人情報を残さない。
4. **manifest**：`help: { tool: <ns>_help_search }` と、そのツール（`GET /bridge/v1/help/search`、read、全役割）。persona に `helpRules('<ns>_help_search')` の文を貼る。
5. **DSH**：`linkGuard` に業務 Web の URL（すべてのアプリ）。
6. **業務 Web**：`manualPage`（既定 `/help/{chapter}#{id}`）にヘルプ画面。その経路も `web.routes` に入る。

規則：答えは返った節だけから（見つからなければそう言う）。URL は返ったものをそのまま。開けない画面は URL を出さず頼む相手を伝える。

## 2. 長期記憶（bridge-memory、d.10）

- 雛形に既定で入っている。業務システムは `POST /bridge/v1/pii-scan` を持つ（server-kit は既定で持つ：形の検査）。
- **名前を持つシステムは `hooks.piiScan` を実装する**（名簿で名前〔姓・名・かな〕を探し、区分だけを返す）。形の検査は名前を知らない。
- 記憶に入れるのは好み・進行中の用件・メモ（本人）と、手順・判断理由・運用上の好み（組織）だけ。業務データ・個人情報・健康情報は入れない。
- 名前・分類・期限を変えるなら `createMemoryPlugin`（fork しない）。

## 3. AI 社員のプロフィール（bridge-persona、d.11）

- server-kit は既定で `GET /bridge/v1/ai-profile` と管理の経路を持つ（`roles.admins`、`aiProfile: false` で無効）。自前なら `validateAiProfile` で検査し、版と監査（版の番号だけ）。
- 業務 Web に管理者だけの「AI 社員の設定」（`AiProfilePage`、既定は呼び名 1 つ）。
- プロフィールで権限・ツール・安全の規則を変えない。署名は「— <呼び名>（<アプリ名> AI 秘書）」で AI であることを示す。実在の人物と紛らわしい呼び名は避ける。

## 4. AI アシスタントへのファイル添付（d.12）

- server-kit は既定で `/bridge/v1/assistant/attachments/prepare`・`attachment-settings`・管理の経路を持つ。自前なら `@dsh-bridge/server-kit/extract`。
- **スキャンの PDF の扱いを決める**（ユーザーの決定）：`createBridgeApp({ attachments: { ocr } })` に OCR エンジンの関数（画像は外に出ない）／書かない＝モデルに画像として送る／`false`。
  個人情報・健康情報の書類を扱うなら engine か `false`。
- BFF は `prepareAssistantAttachments`、パネルに `AssistantAttachmentPicker` と「添付した内容は AI のモデルに送られます」の一文、回答は `AssistantMarkdown`、管理者に `AttachmentSettingsCard`。
- 種類は拡張子と先頭バイトの両方で判定、上限 5 ファイル・10 MB・合計 20 MB（小さくはできる）。原本も変換した文字も保存しない。

## 5. 外部連携（接続先・操作・規則、b.9・d.13）

1. `createBridgeApp({ connectors: { secretKey } })`：`secretKey` は 32 文字以上、環境変数から（リポジトリ・yml に書かない。本番で既定値を拒む）。表は `store.migrate()` が作る。
2. 規則：`startScheduler` に `kit.connectors.tick()`（毎分）。trigger は event か cron、`mode` は `approval`（既定）／`auto`（read と、理由付きで許した冪等な write）／`propose-by-ai`。
3. 書く操作は人の承認：AI は `connector_write` の提案を作る。`onApprovalNeeded` で業務システムの承認の仕組みへ渡す。
4. DSH：bridge-tools が `<namespace>_ext_<接続先>_<操作>` を作る。DSH の profile に接続先の URL・秘密を書かない。
5. 業務 Web：管理者だけの `ExternalConnectorsPage`。BFF は `/bridge/v1/admin/connector*` を本人の cookie のまま転送。
6. まず read の 1〜2 個から。接続先は https と許可したホストだけ。記録・監査・IM の知らせは ID・件数・状態だけ。

## 6. スキャン文書を AI が読む（bridge-reader）

- 業務システムが読めなかった文書（画像・文字の層の無い PDF）を、ページの画像（1 件 10 ページまで）として `GET /bridge/v1/document-reads` に並べ、
  bridge-reader が書き写した結果を `POST /bridge/v1/document-reads/{readId}/result` で受け取る。
- 返った文字から作った項目は**すべて人の確認が要る**状態にする（自動で確定しない）。ページの画像はモデルの提供元に送られるので、止める設定を持ち画面で案内する。
