-- ============================================================================
-- BudgetNest — Reports / Monthly Review aggregates
-- ----------------------------------------------------------------------------
-- The reports page (reports.html) makes one pass over the selected month and
-- the previous 12 months. Doing that in the browser would mean downloading the
-- whole transaction history as the household grows, so the heavy grouping is
-- done in SQL and exposed through three small RPCs:
--
--   report_category_monthly(household, month, months)
--     Monthly totals per category for the trend chart, the "biggest changes"
--     block and all KPI totals.
--
--   report_top_merchants(household, month, limit)
--     Expense totals grouped by normalised merchant/description.
--
--   report_members(household, month)
--     Paid income/expense and transaction count per household member.
--
-- All functions are SECURITY INVOKER, so the existing RLS policies on
-- transactions / categories / household_members keep applying. Execute is
-- limited to authenticated users.
--
-- Apply once in Supabase Dashboard → SQL Editor → New query.
-- The page also has a local-calculation fallback, so it keeps working before
-- this migration is applied — it is simply slower for large households.
-- ============================================================================

-- Helps the per-household date-range scans used by every report.
create index if not exists idx_transactions_household_date
  on public.transactions (household_id, transaction_date);

create index if not exists idx_transactions_household_category_date
  on public.transactions (household_id, category_id, transaction_date);

-- ----------------------------------------------------------------------------
-- Monthly totals per category
-- ----------------------------------------------------------------------------
create or replace function public.report_category_monthly(
  p_household_id uuid,
  p_month date,
  p_months integer default 12
)
returns table (
  month_start date,
  category_id uuid,
  category_name text,
  category_icon text,
  category_type text,
  total numeric,
  tx_count bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  with bounds as (
    select
      date_trunc('month', p_month)::date as end_month,
      (
        date_trunc('month', p_month)
        - make_interval(months => greatest(coalesce(p_months, 12), 1) - 1)
      )::date as start_month
  )
  select
    date_trunc('month', t.transaction_date)::date as month_start,
    c.id as category_id,
    c.name as category_name,
    c.icon as category_icon,
    c.type as category_type,
    sum(t.amount)::numeric as total,
    count(*)::bigint as tx_count
  from public.transactions t
  join public.categories c on c.id = t.category_id
  cross join bounds b
  where t.household_id = p_household_id
    and t.transaction_date >= b.start_month
    and t.transaction_date < (b.end_month + interval '1 month')
  group by 1, 2, 3, 4, 5
  order by 1 asc, 6 desc;
$$;

-- ----------------------------------------------------------------------------
-- Top merchants for the selected month
-- ----------------------------------------------------------------------------
create or replace function public.report_top_merchants(
  p_household_id uuid,
  p_month date,
  p_limit integer default 8
)
returns table (
  merchant text,
  total numeric,
  tx_count bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  with bounds as (
    select
      date_trunc('month', p_month)::date as month_start,
      (date_trunc('month', p_month) + interval '1 month')::date as next_month
  ),
  expenses as (
    select
      t.amount,
      coalesce(nullif(trim(t.description), ''), c.name) as label,
      coalesce(
        nullif(lower(trim(t.description)), ''),
        'category:' || c.id::text
      ) as merchant_key
    from public.transactions t
    join public.categories c on c.id = t.category_id
    cross join bounds b
    where t.household_id = p_household_id
      and c.type = 'expense'
      and t.transaction_date >= b.month_start
      and t.transaction_date < b.next_month
  )
  select
    min(label) as merchant,
    sum(amount)::numeric as total,
    count(*)::bigint as tx_count
  from expenses
  group by merchant_key
  order by total desc, merchant asc
  limit greatest(coalesce(p_limit, 8), 1);
$$;

-- ----------------------------------------------------------------------------
-- Per-member "who paid" breakdown for the selected month
-- ----------------------------------------------------------------------------
create or replace function public.report_members(
  p_household_id uuid,
  p_month date
)
returns table (
  user_id uuid,
  paid_income numeric,
  paid_expense numeric,
  tx_count bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  with bounds as (
    select
      date_trunc('month', p_month)::date as month_start,
      (date_trunc('month', p_month) + interval '1 month')::date as next_month
  ),
  monthly as (
    select t.id, t.user_id, t.amount, c.type
    from public.transactions t
    join public.categories c on c.id = t.category_id
    cross join bounds b
    where t.household_id = p_household_id
      and t.transaction_date >= b.month_start
      and t.transaction_date < b.next_month
  )
  select
    hm.user_id,
    coalesce(sum(m.amount) filter (where m.type = 'income'), 0)::numeric as paid_income,
    coalesce(sum(m.amount) filter (where m.type = 'expense'), 0)::numeric as paid_expense,
    count(m.id)::bigint as tx_count
  from public.household_members hm
  left join monthly m on m.user_id = hm.user_id
  where hm.household_id = p_household_id
  group by hm.user_id;
$$;

-- ----------------------------------------------------------------------------
-- Permissions
-- ----------------------------------------------------------------------------
revoke all on function public.report_category_monthly(uuid, date, integer) from public;
revoke all on function public.report_top_merchants(uuid, date, integer) from public;
revoke all on function public.report_members(uuid, date) from public;

grant execute on function public.report_category_monthly(uuid, date, integer) to authenticated;
grant execute on function public.report_top_merchants(uuid, date, integer) to authenticated;
grant execute on function public.report_members(uuid, date) to authenticated;
