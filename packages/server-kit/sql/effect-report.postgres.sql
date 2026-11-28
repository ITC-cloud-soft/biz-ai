-- AI の効果レポート（PostgreSQL）。docs/EFFECT_REPORT.md
--
-- 期間 [from, to) を決めて、下の 2 行を実行してから、各クエリを実行します（psql・pgAdmin・DBeaver など、どれでも同じ）。
-- 時刻は UTC です。日本時間の 11 月分なら from = '2026-10-31 15:00Z'、to = '2026-11-30 15:00Z' のように書きます。
-- コマンドでまとめて出す場合は bridge-effect-report（docs/EFFECT_REPORT.md）が同じクエリを使います。
--
-- 読むのは Bridge の表（bridge_*）だけです。業務の表・氏名・提案の中身（payload・comment）は読みません。

set bridge_effect.from_at = '2026-11-01 00:00:00Z';
set bridge_effect.to_at = '2026-12-01 00:00:00Z';

-- name: usage
-- 連携している人数（期間の終わりの時点）、期間中に連携した人数、AI が本人の代わりに読んだ人数と回数。
-- 「回数」は委任の発行回数で、質問の回数そのものではありません（DSH は委任が有効なあいだ使い回すので、続けての質問は 1 回に
-- 数えられます）。イベントを受けて AI が動いた分（event_delegations）は別に数えます。
with p as (
  select current_setting('bridge_effect.from_at')::timestamptz as f, current_setting('bridge_effect.to_at')::timestamptz as t
)
select
  (select count(distinct i.user_id) from bridge_identity i, p
     where i.created_at < p.t and (i.unlinked_at is null or i.unlinked_at >= p.t)) as linked_users,
  (select count(distinct i.user_id) from bridge_identity i, p
     where i.created_at >= p.f and i.created_at < p.t) as newly_linked_users,
  (select count(distinct d.user_id) from bridge_delegation d, p
     where d.created_at >= p.f and d.created_at < p.t and d.source_event_id is null) as ai_users,
  (select count(*) from bridge_delegation d, p
     where d.created_at >= p.f and d.created_at < p.t and d.source_event_id is null) as ai_delegations,
  (select count(*) from bridge_delegation d, p
     where d.created_at >= p.f and d.created_at < p.t and d.source_event_id is not null) as event_delegations;

-- name: proposals_by_kind
-- 期間中に作られた AI の提案を、種類ごとに。採択率 = 採択 ÷（採択 + 却下）。審査待ちは分母に入れません。
-- 決めるまでの時間（分）は、決まった提案だけの中央値と 90 パーセンタイル（最近順位法）。最後の行（kind = '(all)'）が合計です。
with p as (
  select current_setting('bridge_effect.from_at')::timestamptz as f, current_setting('bridge_effect.to_at')::timestamptz as t
), x as (
  select r.kind, r.status, r.created_via,
         case when r.decided_at is not null then extract(epoch from (r.decided_at - r.created_at)) / 60.0 end as minutes
  from bridge_proposal r, p
  where r.created_at >= p.f and r.created_at < p.t
)
select coalesce(kind, '(all)') as kind,
       count(*) as proposals,
       count(*) filter (where created_via = 'delegation') as from_chat,
       count(*) filter (where created_via = 'service') as automatic,
       count(*) filter (where status = 'accepted') as accepted,
       count(*) filter (where status = 'rejected') as rejected,
       count(*) filter (where status = 'pending_review') as pending,
       round(count(*) filter (where status = 'accepted')::numeric
             / nullif(count(*) filter (where status in ('accepted', 'rejected')), 0), 3) as adoption_rate,
       round((percentile_cont(0.5) within group (order by minutes))::numeric, 1) as median_minutes_to_decide,
       round((percentile_disc(0.9) within group (order by minutes))::numeric, 1) as p90_minutes_to_decide
from x
group by grouping sets ((kind), ())
having count(*) > 0
order by grouping(kind), kind;

-- name: proposals_by_week
-- 週ごとの推移（週は UTC の月曜始まり）。PoC の 2 週目・4 週目の判断に使います。
with p as (
  select current_setting('bridge_effect.from_at')::timestamptz as f, current_setting('bridge_effect.to_at')::timestamptz as t
), x as (
  select date_trunc('week', r.created_at at time zone 'UTC')::date as week_start, r.status,
         case when r.decided_at is not null then extract(epoch from (r.decided_at - r.created_at)) / 60.0 end as minutes
  from bridge_proposal r, p
  where r.created_at >= p.f and r.created_at < p.t
)
select to_char(week_start, 'YYYY-MM-DD') as week_start,
       count(*) as proposals,
       count(*) filter (where status = 'accepted') as accepted,
       count(*) filter (where status = 'rejected') as rejected,
       count(*) filter (where status = 'pending_review') as pending,
       round(count(*) filter (where status = 'accepted')::numeric
             / nullif(count(*) filter (where status in ('accepted', 'rejected')), 0), 3) as adoption_rate,
       round((percentile_cont(0.5) within group (order by minutes))::numeric, 1) as median_minutes_to_decide
from x
group by week_start
order by week_start;

-- name: notifications_by_type
-- 期間中のイベントの通知を、種類ごとに。届いた率 = 送信 ÷（全部 − 本人の設定で送らなかった分）。
with p as (
  select current_setting('bridge_effect.from_at')::timestamptz as f, current_setting('bridge_effect.to_at')::timestamptz as t
)
select coalesce(e.event_type, '(all)') as event_type,
       count(*) as deliveries,
       count(*) filter (where d.status = 'sent') as sent,
       count(*) filter (where d.status = 'failed') as failed,
       count(*) filter (where d.status = 'undeliverable') as undeliverable,
       count(*) filter (where d.status = 'skipped') as skipped,
       count(*) filter (where d.status = 'pending') as pending,
       round(count(*) filter (where d.status = 'sent')::numeric
             / nullif(count(*) filter (where d.status <> 'skipped'), 0), 3) as delivery_rate
from bridge_delivery d
join bridge_event e on e.id = d.event_id, p
where e.created_at >= p.f and e.created_at < p.t
group by grouping sets ((e.event_type), ())
having count(*) > 0
order by grouping(e.event_type), e.event_type;

-- name: approvals_from_chat
-- チャットに送った承認のリンク。使われた率 = 使われたリンク ÷ 送ったリンク。
with p as (
  select current_setting('bridge_effect.from_at')::timestamptz as f, current_setting('bridge_effect.to_at')::timestamptz as t
)
select count(*) as links,
       count(distinct a.approval_id) as approvals,
       count(*) filter (where a.status = 'used') as used,
       count(*) filter (where a.status = 'issued') as open,
       count(*) filter (where a.status = 'revoked') as revoked,
       count(*) filter (where a.status = 'locked') as locked,
       round(count(*) filter (where a.status = 'used')::numeric / nullif(count(*), 0), 3) as use_rate
from bridge_approval_delivery a, p
where a.created_at >= p.f and a.created_at < p.t;

-- name: reports
-- 自動で作った定期レポート（テスト送信は除く）。attention は「要対応」として載せた件数の合計です。
with p as (
  select current_setting('bridge_effect.from_at')::timestamptz as f, current_setting('bridge_effect.to_at')::timestamptz as t
)
select r.kind, count(*) as reports, coalesce(sum(r.attention), 0) as attention_items
from bridge_report r, p
where not r.test and r.generated_at >= p.f and r.generated_at < p.t
group by r.kind
order by r.kind;

-- name: connector_runs
-- 外部サービスのコネクタの実行。所要時間（ミリ秒）は中央値。
with p as (
  select current_setting('bridge_effect.from_at')::timestamptz as f, current_setting('bridge_effect.to_at')::timestamptz as t
)
select c.connector_id, c.operation_id,
       count(*) as runs,
       count(*) filter (where c.status = 'succeeded') as succeeded,
       count(*) filter (where c.status = 'failed') as failed,
       round((percentile_cont(0.5) within group (order by c.duration_ms))::numeric, 0) as median_duration_ms
from bridge_connector_run c, p
where c.created_at >= p.f and c.created_at < p.t
group by c.connector_id, c.operation_id
order by c.connector_id, c.operation_id;
