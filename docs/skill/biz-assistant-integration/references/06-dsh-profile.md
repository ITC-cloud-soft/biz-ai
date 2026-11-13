# 06 DSH の製品 profile に登録する・自動タスクを有効にする

正本：`docs/GUIDELINE.md` b.5・b.7・a.4・d.7・d.8、`<framework>/profile/template/cordis.patch.yml`（コメントに見本）、`profile/template/auto-tasks/README.md`、`plugins/*/README.md`。

## 1. profile を写して埋める

1. `<framework>/profile/template/` を自分の製品（例 `<product>/dsh-profile/`）にコピーし、`cordis.patch.yml` の `<placeholder>` をすべて埋める
   （YAML のコメントの中の `<…>` は数えない）。雛形の `auto-tasks/example-report-overdue.json`（見本のアプリのタスク）は消すか自分のタスクに置き換える。
2. **アプリのボット**を作り `botId` を控える（Slack App・LINE 公式アカウント・Teams Bot・WeCom の自社開発アプリ・Lark アプリ。個人 WeChat は 1 アカウント 1 ボットなので複数アプリに `multiApp: true`）。
   ボットの認証情報はユーザーに入れてもらう。
3. **レジストリ**（`bridge-apps`）に書く：

```yaml
- id: bridge-apps
  name: '@dsh-bridge/dsh-core'
  config:
    strict: true                                  # アプリが 2 つ以上なら必須
    applications:
      - id: order-desk                            # = manifest の system.id
        name: 受注管理                              # 【受注管理】と署名「— 受注管理 AI 秘書」
        namespace: order                          # ツールは order_*
        paths: v1
        apiUrlEnv: ORDER_API_URL                  # 呼ぶたびに読む
        serviceTokenEnv: ORDER_SERVICE_TOKEN      # トークンそのものは yml に書かない
        manifestUrl: /bridge/v1/manifest          # etag / 304
        generateTools: true                       # manifest の読取ツールを生成
        agents: [order-assistant]
        delegation: { unattendedPolicy: deny }    # 自動タスクは既定で業務データ無し
        bots:
          - { platform: slack, botId: <受注管理の Slack App の bot id> }
```

   - `manifestFile: pkg:…` は DSH の profile から解決できるパッケージのときだけ。別リポジトリなら絶対パスか、省いて `manifestUrl` だけ。
4. 手書きのツール（提案ツールなど。`access: propose` のツールは生成されない）は `bridge-tools` の `toolModules`、通知の文面は `bridge-notify` の `templateModules`
   （GUIDELINE c 節。業務データは `kit.requestJson` だけで読み、書込みは `kit.proposeTool` の提案だけ。業務 DB・秘密に触れない）。

## 2. 送信の設定は閉じた値のまま（d.8）

雛形は次の値で出荷される。**消さず、書き方も変えない**（`check.mjs` は文字の形で確かめるので、1 行に 1 つの値・`name:` の行を残す。`config: { … }` の 1 行に書き換えると `closed_value` で落ちる）。

| 部品 | 値 | 意味 |
|---|---|---|
| IM（dsh-im） | `forwardPluginSources: []` | 起動の答えを会話に写さない |
| 定時実行（dsh-proactive） | `modelTools: reclaim`、`deliveryGuard: required` | モデルに任意の宛先を指定させない、守りが無ければ送らない |
| 自動タスク（dsh-auto-tasks） | `restrictDelivery: true`、`mail: false` | 固定の配信先・メールを使わない |
| bridge-identity / bridge-tools | `groupChat: deny` | グループ会話では業務を扱わない |
| bridge-notify | `aiReportGuard: screen`、`proactiveDelivery: deny`、`audienceFallback: none`、`audienceText: template` | 定時報告の本文検査、業務アラームを送らない、受信者の代替なし、自動タスクの報告は固定の文面 |

- **開けるのは明示の opt-in だけ**：その行を製品の patch で変え、理由をコメントに残す。既にある項目に値だけ足す（同じ id の項目を 2 つ作らない）。
- `install.mjs` は固定の配信先（`--auto-task-session / --auto-task-bot / --auto-task-target`）を拒否する（exit 2）。

## 3. そのほかの設定

- **AI 社員のプリセット**：雛形の `business-assistant` を製品に合わせ、manifest の playbook の `agent` ごとに同じ形のプリセットを足す。persona の固定の規則の文は残す。
  マニュアルを使うなら `prefix` に `helpRules('<ns>_help_search')`（`@dsh-bridge/dsh-core`）が返す文を node で出力して**そのまま貼る**。
- **リンクの検査**：bridge-identity に `linkGuard: { webUrl: <既定のアプリの業務 Web の URL>, webUrls: { <application-id>: <URL> } }` を**すべてのアプリについて**書く。
  検査が働くのは URL と manifest の `web.routes` の両方があるときだけ（`check.mjs` の規則 `link_guard`）。
- **アプリが 2 つ以上**：既定でないアプリごとに `bridge-notify` / `bridge-approvals` の `applications.<id>.webUrl`（と `bots`）、`bridge-assistant` の `agents[].application`、
  `linkGuard.webUrls.<id>`、自動タスクの委託（下の 4）を書く。書かないと空のまま動く。
- 雛形の bundle には長期記憶（bridge-memory）・プロフィール（bridge-persona）・文書の読み取り（bridge-reader）が入っている。業務システムに対応する経路が無ければ、それぞれ手元の検査だけ・プロフィール無し・何もしない、で動く。

## 4. 入れて動かす

```sh
node <framework>/profile/scripts/install.mjs --source <product>/dsh-profile --home <隔離した home> --profile <名前>   # 個人の ~/.dsh は拒否される
node <framework>/profile/scripts/check.mjs <product>/dsh-profile/cordis.patch.yml                                  # 送信の設定・link_guard・placeholder
```

- DSH は隔離した home で動かす（GUIDELINE a.4 のコマンド例）。DSH が出す `dsh web: …?token=…` は owner の資格情報なので、ブラウザに渡さず gateway だけが使う。
  DSH は作業ディレクトリの `.env` も読むので、リポジトリの直下では起動しない。デモ環境・本番が使うポートは使わない。
- 秘密（サービストークン・ボットの認証情報・モデルのキー）は環境変数か秘密の保管場所から。ユーザーに入れてもらう。

## 5. 自動タスクを有効にする（b.7）

自動タスクのターンには発信者がいないので、既定では業務データを読めない（`unattendedPolicy: deny`）。

```sh
# 仕事の種類ごとに委託先を分ける（推奨）
node <framework>/profile/scripts/install.mjs --home <home> --auto-task-delegate billing=line:<userId>,ops=line:<userId>,inspector=each
# manifest の playbook（DSH が一度起動し、plugin-events がデプロイした後）を id で有効にする
node <framework>/profile/scripts/install.mjs --home <home> --skip-install --enable-auto-tasks pb_<application-id>_<playbook>
node <framework>/profile/scripts/install.mjs --home <home> --auto-task-delegate off    # deny に戻す
```

- `<class>=<platform>:<userId>`：その分類の playbook はその職員の委託で動く。広い役割（管理者など）を選ばない（`unattendedWarnRoles` で警告を出せる）。
- `<class>=each`：回ごとに起動 event の本人の委託。業務システムの `hooks.eventDelegations` が要る。id を名指ししたときだけ有効になる。
- `--auto-task-delegate` が効くのは**既定のアプリ**（`default: true` かアプリが 1 つ）だけ。既定でないアプリは製品の patch の `bridge-tools.applications.<id>` に手で書き、
  `check.mjs` は `--allow unattendedPolicy` で走らせ、その行の上に理由（どの分類を・どの狭い役割の職員に）をコメントで残す。
- playbook の `agent` のプリセットを製品 profile に定義しておく。許されるのは読取と、その playbook の `tools` に挙がった提案だけ。
- タスクの有効化に再起動は不要。委託（patch）とプラグインの変更は DSH の再起動が要る。
