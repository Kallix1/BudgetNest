-- ============================================================================
-- BudgetNest — проследяване на уникални посетители на сайта
--
-- Добавя:
--   1) Таблица page_views — по един ред на посещение (анонимен visitor_id,
--      генериран и пазен в localStorage на клиента — виж analytics.js)
--   2) RLS: всеки (дори нелогнат потребител) може да ЗАПИШЕ свое посещение,
--      но НИКОЙ не може да ЧЕТЕ суровите редове директно (поверителност) —
--      четенето минава единствено през admin_get_visitor_stats() по-долу.
--   3) RPC функция admin_get_visitor_stats() — само за администратори
--      (използва същата is_admin() проверка като другите admin_* функции),
--      връща обобщени бройки уникални посетители (днес / 7 дни / 30 дни / общо).
--
-- ВАЖНО: приема се, че вече имате функция is_admin() в базата (използва се
-- от съществуващите admin_get_stats/admin_list_users/admin_list_households
-- и от RLS политиката на reviews). Ако не е точно с това име, сменете
-- извикванията ѝ по-долу.
--
-- Пуска се наведнъж в Supabase Dashboard → SQL Editor → New query.
-- ============================================================================

create table if not exists page_views (
  id          uuid primary key default gen_random_uuid(),
  visitor_id  text not null,
  page        text,
  user_id     uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now()
);

create index if not exists idx_page_views_visitor on page_views(visitor_id);
create index if not exists idx_page_views_created on page_views(created_at);

alter table page_views enable row level security;

-- Всеки (вкл. анонимен посетител) може да запише РЕД за собственото си
-- посещение — но не и да чете чужди редове (виж липсата на SELECT policy).
drop policy if exists "anyone can log a page view" on page_views;
create policy "anyone can log a page view" on page_views
  for insert
  to anon, authenticated
  with check (true);

-- Обобщена статистика — вижда се само от администратори. Изчислява
-- "уникални посетители" като брой различни visitor_id стойности в
-- съответния прозорец от време.
create or replace function admin_get_visitor_stats()
returns table (
  unique_today     bigint,
  unique_7d        bigint,
  unique_30d       bigint,
  unique_total     bigint,
  views_today      bigint,
  views_total      bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'Достъпът е само за администратори';
  end if;

  return query
  select
    (select count(distinct visitor_id) from page_views where created_at >= date_trunc('day', now())),
    (select count(distinct visitor_id) from page_views where created_at >= now() - interval '7 days'),
    (select count(distinct visitor_id) from page_views where created_at >= now() - interval '30 days'),
    (select count(distinct visitor_id) from page_views),
    (select count(*) from page_views where created_at >= date_trunc('day', now())),
    (select count(*) from page_views);
end;
$$;

-- ============================================================================
-- Готово. Клиентският тракер е в analytics.js (включен вече във всяка
-- страница) — записва по едно посещение на посетител на ден (throttled),
-- не при всяко презареждане, за да не се раздува таблицата излишно.
-- ============================================================================
