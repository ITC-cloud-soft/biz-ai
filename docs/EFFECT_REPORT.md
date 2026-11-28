# AI の効果レポート（effect report）

> 2026-11-27。状態：**実装済み**（`@dsh-bridge/server-kit` の `sql/effect-report.*.sql`・`bridge-effect-report`・`runEffectReport`）。
> 要望：「AI を入れた効果（ROI）が測れない。導入のたびに同じ形で、AI がどれだけ使われ、人がどれだけ採択したかを出したい」。

## 0. 結論（先に）

1. **Bridge の表（`bridge_*`）だけ**から、次の数字を出す：使っている人、AI の提案の採択率と決めるまでの時間（種類ごと・週ごと）、
   通知が届いた率、チャットからの承認、定期レポート、コネクタの実行。
2. 業務の表・氏名・提案の中身（`payload`・`comment`）・レポートの本文（`sections`）は**読まない**。数えるだけ。
3. 同じクエリを 3 つの形で使える：
   - SQL ファイルを DB のツールでそのまま実行する（DBA・情報システム部門向け）；
   - コマンド `bridge-effect-report` で Markdown か JSON にする；
   - コードから `runEffectReport()` を呼ぶ（自社の管理画面や月次レポートに載せる）。
4. PostgreSQL と MySQL 8 / TiDB の両方。**同じ行から同じ数字**が出ることをテストで確かめている（§6）。
5. 業務そのものの効果（処理時間・件数）は、業務システムの表から取る（§3）。Bridge の表と合わせて、PoC の判断に使う（§4）。

## 1. 出せる数字

期間は `[from, to)`（終わりの時刻は含まない）、時刻は UTC。

| 節 | 列 | 意味 |
|---|---|---|
| `usage`（使っている人） | `linked_users` | 期間の終わりの時点で、チャットと連携している人数（`bridge_identity`、連携を外した人は除く） |
| | `newly_linked_users` | 期間中に連携した人数 |
| | `ai_users` | AI が本人の代わりに読んだ人数（`bridge_delegation`、イベントで動いた分は除く） |
| | `ai_delegations` | 委任の発行回数。**質問の回数そのものではない**（DSH は委任が有効なあいだ使い回すので、続けての質問は 1 回に数えられる） |
| | `event_delegations` | 業務のイベントを受けて AI が動いた回数（イベント単位の委任） |
| `proposals_by_kind`（提案・種類ごと） | `proposals` / `from_chat` / `automatic` | 期間中に作られた提案。`from_chat` は本人の委任で（チャットから）、`automatic` はサービストークンで（自動の作業から） |
| | `accepted` / `rejected` / `pending` | 人が採択した・却下した・まだ審査待ち（いまの状態） |
| | `adoption_rate` | **採択率** = 採択 ÷（採択 + 却下）。審査待ちは分母に入れない |
| | `median_minutes_to_decide` / `p90_minutes_to_decide` | 提案から人が決めるまでの分。決まった提案だけの中央値と 90 パーセンタイル（最近順位法） |
| | 最後の行 `kind = '(all)'` | 全種類の合計 |
| `proposals_by_week`（提案・週ごと） | `week_start` ほか | 週（UTC の月曜始まり）ごとの件数・採択率・決めるまでの中央値 |
| `notifications_by_type`（通知） | `sent` / `failed` / `undeliverable` / `skipped` / `pending` | 期間中のイベントの通知を、イベントの種類ごとに。`skipped` は本人の設定（種類・夜間）で送らなかった分 |
| | `delivery_rate` | **届いた率** = 送信 ÷（全部 − `skipped`） |
| `approvals_from_chat`（チャットからの承認） | `links` / `approvals` / `used` / `open` / `revoked` / `locked` | チャットに送った承認のリンクの数、承認の件数、使われた・未使用・取り消し・ロック |
| | `use_rate` | 使われた率 = 使われたリンク ÷ 送ったリンク |
| `reports`（定期レポート） | `reports` / `attention_items` | 自動で作ったレポートの数（テスト送信は除く）と、「要対応」として載せた件数の合計 |
| `connector_runs`（コネクタ） | `runs` / `succeeded` / `failed` / `median_duration_ms` | 外部サービスのコネクタの実行と、所要時間の中央値 |

## 2. 使い方

### 2.1 コマンド

```
DATABASE_URL=postgres://<user>:<password>@<host>:5432/<db> \
  npx bridge-effect-report --from 2026-11-01 --to 2026-12-01 --tz Asia/Tokyo
```

- `--from` / `--to` は `--tz` の日付（既定は UTC）。`--to` の日は含まない。上の例は日本時間の 11 月分。
- 既定は Markdown（日本語の見出しと列名）。`--json` で JSON。
- `DATABASE_URL` は業務システムの DB（`bridge_*` の表がある DB）。`mysql://…` なら MySQL / TiDB。**読むだけ**（SELECT と、セッション変数の設定だけ）。
  本番の DB に向けるときは、読み取り専用のユーザーを使う。
- エラーのときも URL は表示しない。

### 2.2 SQL を手で実行する

`packages/server-kit/sql/effect-report.postgres.sql` / `effect-report.mysql.sql`。

1. ファイルの先頭の `set …` の行で期間を書き換えて、実行する（PostgreSQL は `bridge_effect.from_at` / `to_at`、MySQL は
   `@bridge_effect_from` / `@bridge_effect_to`）。
2. そのあと、`-- name: …` で始まる各クエリを実行する。ファイル全体をそのまま流してもよい（`psql -f`、`mysql < file`）。
3. 各クエリの前のコメントが、数字の意味（§1 と同じ）。

### 2.3 コードから

```js
import { createPool, runEffectReport, effectReportMarkdown } from '@dsh-bridge/server-kit'
const pool = await createPool(process.env.DATABASE_URL)
const report = await runEffectReport({ dialect: 'postgres', pool, from: new Date('2026-10-31T15:00:00Z'), to: new Date('2026-11-30T15:00:00Z') })
console.log(report.proposals_by_kind)       // [{ kind, proposals, accepted, adoption_rate, median_minutes_to_decide, … }, …, { kind: '(all)', … }]
console.log(effectReportMarkdown(report))
```

MySQL / TiDB は `dialect: 'mysql'` と `createMysqlPool(url)`。数は数値、率は 0〜1 の数値（分母が 0 のときは `null`）。

## 3. 業務側の数字（業務システムの表から）

効果の本体（1 件の処理にかかる時間、待ち時間、件数、誤り）は、**業務システムがもともと持っている**。
Bridge の表には業務の内容を書かないので、ここは業務の表から取る。例（購買申請の表 `purchase_request` の場合、PostgreSQL）：

```sql
-- 例：週ごとの申請件数と、申請から決定までの時間（時間）の中央値。表と列の名前は、その業務システムのもの
select date_trunc('week', created_at at time zone 'UTC')::date as week_start,
       count(*) as requests,
       round((percentile_cont(0.5) within group (order by extract(epoch from (decided_at - created_at)) / 3600))::numeric, 1) as median_hours_to_decide,
       count(*) filter (where status = 'sent_back') as sent_back
from purchase_request
where created_at >= '2026-08-01' and created_at < '2026-12-01'
group by 1 order by 1;
```

- **導入の前の 3 か月**を同じクエリで出せば、それが基線になる（別に調査をしなくてよい）。
- 1 件の作業時間（画面を開いてから決めるまで）は記録に残らないことが多い。2 週間の抜き取り計測で補う。

## 4. PoC での使い方

PoC の前に「何がいくつになれば元が取れるか」を決め、このレポートの数字で確かめる。

| PoC の前に決めること | このレポートのどの数字で見るか |
|---|---|
| 採択率の目標とやめる線 | `proposals_by_kind.adoption_rate`（種類ごと）、`proposals_by_week.adoption_rate`（2 週目・4 週目の判断） |
| 人がすぐ見ているか | `median_minutes_to_decide` / `p90_minutes_to_decide`（審査待ちが溜まっていないか。`pending` も見る） |
| 使われているか | `usage.ai_users` ÷ `usage.linked_users`、`newly_linked_users` の伸び |
| 通知が届いているか | `notifications_by_type.delivery_rate`（低ければ、連携や宛先の設定から直す） |
| 処理時間・待ち時間・誤り | §3 の業務側の数字（導入の前と同じクエリ） |

金額にするのは工数の削減だけにし、採択された提案だけを数えるのが安全（却下・やり直しの分は効果に入れない）。

## 5. 数えないもの・注意

- **AI が読んだ 1 回ごとの記録は、このレポートにはない。** 監査ログ（`bridge_audit_log`）は連携・委任の発行・提案の作成と採否などを残すが、
  読み取りを 1 回ずつは残さない。読み取りの回数と応答時間が必要なら、`@dsh-bridge/telemetry` の `instrumentRequest` が書く
  `kind: access` の行（ルートの型・状態・所要時間）をログ基盤で数える。
- `ai_delegations` は質問の回数ではない（§1）。
- 提案の期間は**作られた日時**で切る。採否と決めるまでの時間は、いまの状態（期間のあとに決まったものも入る）。
- 時刻はすべて UTC（server-kit は PostgreSQL の `timestamptz`、MySQL の `DATETIME` を UTC で書く）。日本時間の月で切るときは `--tz Asia/Tokyo`。
- メモリのストア（`createMemoryStore`）は再起動で消えるので、レポートの対象にしない。試作のあいだは PoC の数字にしない。

## 6. テスト

`packages/server-kit/test/effect-report.test.mjs`：

- 2 つの SQL ファイルが同じ名前のクエリを持ち、提案の中身・コメント・レポートの本文を読まないこと；日付と時間帯の変換。
- PostgreSQL と MySQL のそれぞれで、同じ行（期間の前後の行・テスト送信・連携を外した人などを含む）から**期待どおりの同じ数字**が出ること；
  空の期間はエラーにならず 0 と空の表になること；SQL ファイルを先頭の `set` の行ごとそのまま流しても同じ数字になること。
- `FW_TEST_DATABASE_URL` / `FW_TEST_MYSQL_URL` が無いとき、その DB は理由つきで飛ばす。TiDB では未確認（MySQL 8.4 で確認）。
