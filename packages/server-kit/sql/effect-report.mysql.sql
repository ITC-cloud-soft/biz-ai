-- AI の効果レポート（MySQL 8 / TiDB）。docs/EFFECT_REPORT.md。effect-report.postgres.sql と同じ表・同じ数字です。
--
-- 期間 [from, to) を決めて、下の 1 行を実行してから、各クエリを実行します（mysql・DBeaver・TiDB の SQL エディタなど）。
-- 時刻は UTC です（server-kit は DATETIME を UTC で書きます）。日本時間の 11 月分なら from = '2026-10-31 15:00:00'、
-- to = '2026-11-30 15:00:00' のように書きます。
-- 中央値は決まった件数の真ん中の 2 つの平均、90 パーセンタイルは最近順位法（PostgreSQL の percentile_cont(0.5) / percentile_disc(0.9) と同じ）。
--
-- 読むのは Bridge の表（bridge_*）だけです。業務の表・氏名・提案の中身（payload・comment）は読みません。

set @bridge_effect_from = '2026-11-01 00:00:00', @bridge_effect_to = '2026-12-01 00:00:00';

-- name: usage
-- 連携している人数（期間の終わりの時点）、期間中に連携した人数、AI が本人の代わりに読んだ人数と回数。
-- 「回数」は委任の発行回数で、質問の回数そのものではありません（DSH は委任が有効なあいだ使い回すので、続けての質問は 1 回に
-- 数えられます）。イベントを受けて AI が動いた分（event_delegations）は別に数えます。
with p as (select cast(@bridge_effect_from as datetime(6)) as f, cast(@bridge_effect_to as datetime(6)) as t)
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
-- 決めるまでの時間（分）は、決まった提案だけの中央値と 90 パーセンタイル。最後の行（kind = '(all)'）が合計です。
with p as (select cast(@bridge_effect_from as datetime(6)) as f, cast(@bridge_effect_to as datetime(6)) as t),
x as (
  select r.kind, r.status, r.created_via,
         case when r.decided_at is not null then timestampdiff(microsecond, r.created_at, r.decided_at) / 60000000 end as minutes
  from bridge_proposal r, p
  where r.created_at >= p.f and r.created_at < p.t
),
g as (
  select kind as grp, status, created_via, minutes from x
  union all
  select '(all)', status, created_via, minutes from x
),
o as (
  select grp, minutes, row_number() over (partition by grp order by minutes) as rn, count(*) over (partition by grp) as c
  from g where minutes is not null
),
m as (
  select grp,
         avg(case when rn in (floor((c + 1) / 2), ceil((c + 1) / 2)) then minutes end) as median_minutes,
         max(case when rn = ceil(0.9 * c) then minutes end) as p90_minutes
  from o group by grp
)
select g.grp as kind,
       count(*) as proposals,
       sum(g.created_via = 'delegation') as from_chat,
       sum(g.created_via = 'service') as automatic,
       sum(g.status = 'accepted') as accepted,
       sum(g.status = 'rejected') as rejected,
       sum(g.status = 'pending_review') as pending,
       round(sum(g.status = 'accepted') / nullif(sum(g.status in ('accepted', 'rejected')), 0), 3) as adoption_rate,
       round(m.median_minutes, 1) as median_minutes_to_decide,
       round(m.p90_minutes, 1) as p90_minutes_to_decide
from g left join m on m.grp = g.grp
group by g.grp, m.median_minutes, m.p90_minutes
order by g.grp = '(all)', g.grp;

-- name: proposals_by_week
-- 週ごとの推移（週は UTC の月曜始まり）。PoC の 2 週目・4 週目の判断に使います。
with p as (select cast(@bridge_effect_from as datetime(6)) as f, cast(@bridge_effect_to as datetime(6)) as t),
x as (
  select date_format(date_sub(date(r.created_at), interval weekday(r.created_at) day), '%Y-%m-%d') as week_start, r.status,
         case when r.decided_at is not null then timestampdiff(microsecond, r.created_at, r.decided_at) / 60000000 end as minutes
  from bridge_proposal r, p
  where r.created_at >= p.f and r.created_at < p.t
),
o as (
  select week_start, minutes, row_number() over (partition by week_start order by minutes) as rn,
         count(*) over (partition by week_start) as c
  from x where minutes is not null
),
m as (
  select week_start, avg(case when rn in (floor((c + 1) / 2), ceil((c + 1) / 2)) then minutes end) as median_minutes
  from o group by week_start
)
select x.week_start,
       count(*) as proposals,
       sum(x.status = 'accepted') as accepted,
       sum(x.status = 'rejected') as rejected,
       sum(x.status = 'pending_review') as pending,
       round(sum(x.status = 'accepted') / nullif(sum(x.status in ('accepted', 'rejected')), 0), 3) as adoption_rate,
       round(m.median_minutes, 1) as median_minutes_to_decide
from x left join m on m.week_start = x.week_start
group by x.week_start, m.median_minutes
order by x.week_start;

-- name: notifications_by_type
-- 期間中のイベントの通知を、種類ごとに。届いた率 = 送信 ÷（全部 − 本人の設定で送らなかった分）。
with p as (select cast(@bridge_effect_from as datetime(6)) as f, cast(@bridge_effect_to as datetime(6)) as t),
x as (
  select e.event_type, d.status
  from bridge_delivery d
  join bridge_event e on e.id = d.event_id
  join p on e.created_at >= p.f and e.created_at < p.t
),
g as (select event_type as grp, status from x union all select '(all)', status from x)
select grp as event_type,
       count(*) as deliveries,
       sum(status = 'sent') as sent,
       sum(status = 'failed') as failed,
       sum(status = 'undeliverable') as undeliverable,
       sum(status = 'skipped') as skipped,
       sum(status = 'pending') as pending,
       round(sum(status = 'sent') / nullif(sum(status <> 'skipped'), 0), 3) as delivery_rate
from g
group by grp
order by grp = '(all)', grp;

-- name: approvals_from_chat
-- チャットに送った承認のリンク。使われた率 = 使われたリンク ÷ 送ったリンク。
with p as (select cast(@bridge_effect_from as datetime(6)) as f, cast(@bridge_effect_to as datetime(6)) as t)
select count(*) as links,
       count(distinct a.approval_id) as approvals,
       coalesce(sum(a.status = 'used'), 0) as used,
       coalesce(sum(a.status = 'issued'), 0) as open,
       coalesce(sum(a.status = 'revoked'), 0) as revoked,
       coalesce(sum(a.status = 'locked'), 0) as locked,
       round(sum(a.status = 'used') / nullif(count(*), 0), 3) as use_rate
from bridge_approval_delivery a, p
where a.created_at >= p.f and a.created_at < p.t;

-- name: reports
-- 自動で作った定期レポート（テスト送信は除く）。attention は「要対応」として載せた件数の合計です。
with p as (select cast(@bridge_effect_from as datetime(6)) as f, cast(@bridge_effect_to as datetime(6)) as t)
select r.kind, count(*) as reports, coalesce(sum(r.attention), 0) as attention_items
from bridge_report r, p
where not r.test and r.generated_at >= p.f and r.generated_at < p.t
group by r.kind
order by r.kind;

-- name: connector_runs
-- 外部サービスのコネクタの実行。所要時間（ミリ秒）は中央値。
with p as (select cast(@bridge_effect_from as datetime(6)) as f, cast(@bridge_effect_to as datetime(6)) as t),
x as (
  select c.connector_id, c.operation_id, c.status, c.duration_ms
  from bridge_connector_run c, p
  where c.created_at >= p.f and c.created_at < p.t
),
o as (
  select connector_id, operation_id, duration_ms,
         row_number() over (partition by connector_id, operation_id order by duration_ms) as rn,
         count(*) over (partition by connector_id, operation_id) as c
  from x where duration_ms is not null
),
m as (
  select connector_id, operation_id, avg(case when rn in (floor((c + 1) / 2), ceil((c + 1) / 2)) then duration_ms end) as median_ms
  from o group by connector_id, operation_id
)
select x.connector_id, x.operation_id,
       count(*) as runs,
       sum(x.status = 'succeeded') as succeeded,
       sum(x.status = 'failed') as failed,
       round(m.median_ms, 0) as median_duration_ms
from x left join m on m.connector_id = x.connector_id and m.operation_id = x.operation_id
group by x.connector_id, x.operation_id, m.median_ms
order by x.connector_id, x.operation_id;
