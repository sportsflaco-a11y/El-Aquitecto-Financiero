-- ============================================================================
-- El Arquitecto Financiero — Chat de gastos con IA
-- Corre este script completo una sola vez en Supabase → SQL Editor → New query.
-- Es seguro correrlo varias veces (usa IF NOT EXISTS / OR REPLACE en todo).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. user_budgets: el estado financiero de cada usuario (antes solo en
--    localStorage). Reemplaza income / fixedCosts / debts / porcentajes.
-- ----------------------------------------------------------------------------
create table if not exists public.user_budgets (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  currency      text not null default 'USD',
  income        numeric not null default 0,
  fixed_costs   jsonb not null default '[]'::jsonb,
  debts         jsonb not null default '[]'::jsonb,
  debt_pct      integer not null default 40,
  savings_pct   integer not null default 30,
  personal_pct  integer not null default 30,
  strategy      text not null default 'avalanche',
  updated_at    timestamptz not null default now()
);

alter table public.user_budgets enable row level security;

drop policy if exists "user_budgets_select_own" on public.user_budgets;
create policy "user_budgets_select_own" on public.user_budgets
  for select using (auth.uid() = user_id);

drop policy if exists "user_budgets_insert_own" on public.user_budgets;
create policy "user_budgets_insert_own" on public.user_budgets
  for insert with check (auth.uid() = user_id);

drop policy if exists "user_budgets_update_own" on public.user_budgets;
create policy "user_budgets_update_own" on public.user_budgets
  for update using (auth.uid() = user_id);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_user_budgets_updated_at on public.user_budgets;
create trigger trg_user_budgets_updated_at
  before update on public.user_budgets
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 2. expenses: el registro de gastos (esto no existía antes en la app).
-- ----------------------------------------------------------------------------
create table if not exists public.expenses (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  amount       numeric not null check (amount > 0),
  currency     text not null default 'USD',
  category     text not null default 'Otros',
  description  text,
  source       text not null default 'chat' check (source in ('chat', 'manual')),
  created_at   timestamptz not null default now()
);

create index if not exists expenses_user_created_idx
  on public.expenses (user_id, created_at desc);

alter table public.expenses enable row level security;

drop policy if exists "expenses_select_own" on public.expenses;
create policy "expenses_select_own" on public.expenses
  for select using (auth.uid() = user_id);

drop policy if exists "expenses_insert_own" on public.expenses;
create policy "expenses_insert_own" on public.expenses
  for insert with check (auth.uid() = user_id);

drop policy if exists "expenses_delete_own" on public.expenses;
create policy "expenses_delete_own" on public.expenses
  for delete using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 3. chat_messages: historial de la conversación con el Consejero Financiero,
--    para que no se pierda al recargar la página o cambiar de dispositivo.
-- ----------------------------------------------------------------------------
create table if not exists public.chat_messages (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  role         text not null check (role in ('user', 'assistant')),
  content      text not null,
  kind         text not null default 'text' check (kind in ('text', 'expense_card', 'warning')),
  meta         jsonb,
  expense_id   uuid references public.expenses(id) on delete set null,
  created_at   timestamptz not null default now()
);

create index if not exists chat_messages_user_created_idx
  on public.chat_messages (user_id, created_at desc);

alter table public.chat_messages enable row level security;

drop policy if exists "chat_messages_select_own" on public.chat_messages;
create policy "chat_messages_select_own" on public.chat_messages
  for select using (auth.uid() = user_id);

drop policy if exists "chat_messages_insert_own" on public.chat_messages;
create policy "chat_messages_insert_own" on public.chat_messages
  for insert with check (auth.uid() = user_id);

-- ============================================================================
-- Listo. Después de correr esto, en Vercel agrega (si no la tienes ya):
--   GEMINI_API_KEY  →  tu API key de Google AI Studio (aistudio.google.com)
-- Las variables SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY ya deberían existir
-- porque las usa api/hotmart-webhook.ts.
-- ============================================================================
