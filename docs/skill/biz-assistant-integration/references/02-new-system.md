# 02 新しい業務システムを framework の上で作る

正本：`docs/GUIDELINE.md` b.0、見本 `examples/equipment-inspection`（README・src・test・manual）。

## 1. 置き場所と依存

`@dsh-bridge/*` は private（0.1.0）で npm に公開されていない。パッケージどうしの依存は `workspace:*`。

| 置き場所 | 依存の書き方 | 向くとき |
|---|---|---|
| framework の workspace の中：`examples/<system-id>/` | `"@dsh-bridge/server-kit": "workspace:*"` など。framework の直下で `pnpm install` | 試作・検証 |
| 別のリポジトリ（製品） | 先に `<framework>` で `pnpm install`。業務システムの `package.json` に `"@dsh-bridge/server-kit": "file:<framework>/packages/server-kit"` などを書き、**npm** で入れる（`npm install`） | 製品 |

- pnpm の `file:` は中の `workspace:*` を解決できず `ERR_PNPM_WORKSPACE_PKG_NOT_FOUND` で止まる。製品のリポジトリでは npm を使う。
- `pg` は server-kit の peer（PostgreSQL の store を使うなら業務システムの依存に足す）。
- web-kit は `.ts` のまま配られるので、業務 Web のバンドラ（Vite など）で読む。

## 2. ファイルの形（見本と同じ分け方）

```
bridge.manifest.yaml      システムの自己紹介（system.id = DSH のアプリ id）            → 04-manifest.md
src/config.mjs            環境変数だけ（秘密の既定値は開発用だけ。本番では必須。他のシステムの DB 名は拒む）
src/auth.mjs              自分のログインとセッション：authenticate(req)・isSessionLive
src/domain.mjs            業務の規則。状態の変化は kit.tx + kit.emitEvent、承認の規則（mayDecide）は 1 か所
src/hooks.mjs             employees・recipientsFor・approvals・proposalKinds・reports・piiScan（・eventDelegations） → 05-business-side.md
src/routes.mjs            業務 API（/api/*）：AI の読取は kit.readToolPolicy、書込みは { allow: ['user'] }
src/help.mjs              マニュアル → 索引 → createHelpService                              → 08-optional-features.md
src/app.mjs, server.mjs   createBridgeApp + store.migrate() + 業務のマイグレーション、startScheduler
src/migrations/*.sql      業務の表（bridge_* は kit が作る）
manual/NN-*.md            1 画面 = 1 節
test/fixtures.mjs         conformance の fixtures                                            → 10-verification.md
test/conformance.test.mjs suite を汎用の HTTP adapter で（見本と同じ名前のファイルを写して直す）
test/*.test.mjs           業務のテスト
<product>/dsh-profile/    profile/template の写しと、手書きのツール・文面のモジュール        → 06-dsh-profile.md
web/                      業務 Web（React + web-kit）                                        → 07-web-and-bff.md
bff/                      業務 Web の BFF（@dsh-bridge/gateway）
```

- `web/` と `bff/` には framework の中に見本が無い（見本は素の JS の 1 画面だけ）。作るときの規則は `07-web-and-bff.md` にある。
  BFF を置かずに業務システムが画面を配る形もできるが、その場合 BFF だけの操作（Web アシスタント・個人ボットの登録）は使えない（秘密をブラウザに出して代わりにしない）。

## 3. 作る順序

1. 見本の `examples/equipment-inspection` を読み、動かす（`<framework>` の GUIDELINE a.2：PostgreSQL・`EQUIPMENT_DATABASE_URL`・`pnpm --filter @dsh-bridge/example-equipment-inspection start`）。
2. 新しいリポジトリ（または `examples/<id>/`）を作り、上の形でファイルを置く。見本からは**構成と書き方**を写し、業務の中身は自分のものにする。
3. `bridge.manifest.yaml` を書き、`bridge-validate manifest --strict` を通す（04）。
4. 業務の表・業務の規則（domain）・hooks・routes を書く（05）。状態の変化はすべて `kit.tx` + `emitEvent`。
5. 業務のテストと conformance（汎用 HTTP adapter）を書いて通す（10）。
6. DSH の profile（06）、業務 Web と BFF（07）、自動タスク（06）、任意の機能（08）。

## 4. 規則

- **MUST NOT** framework の中（`packages/*`・`plugins/*`・`vendor/*`・`profile/template`・`profile/scripts`）を自分のシステムのために書き換えない
  （`examples/<id>` に置くときも同じ）。足りないところは hooks・`toolModules` / `templateModules`・プラグインと profile の設定・製品の profile の写しで補う。
- 役割の名前は自由（conformance の fixtures で suite の汎用の役割 `admin`・`manager`・`staff`・`billing` に写す）。
- 秘密は `src/config.mjs` で環境変数から読み、本番では既定値を拒む（見本の `src/config.mjs` を参照）。
