-- WA Lead Helper - Supabase schema
-- הרץ את הקובץ הזה ב-Supabase Dashboard: SQL Editor -> New query -> Run
--
-- חשוב: אם המייל של האדמין שונה, עדכן אותו גם כאן (בפונקציה is_admin)
-- וגם בקובץ src/supabase/config.ts בתוסף.

-- טבלת פרופילים - שורה לכל משתמש רשום
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now()
);

-- מסלול מנוי: free | pro | unlimited
alter table public.profiles
  add column if not exists plan text not null default 'free';

alter table public.profiles
  add column if not exists paypal_subscription_id text;

alter table public.profiles
  drop constraint if exists profiles_plan_check;

alter table public.profiles
  add constraint profiles_plan_check
  check (plan in ('free', 'pro', 'unlimited'));

-- פונקציה שבודקת אם המשתמש המחובר הוא אדמין (לפי כתובת המייל ב-JWT)
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    lower(auth.jwt() ->> 'email') in ('eladtvil@gmail.com'),
    false
  );
$$;

-- טריגר: יצירת פרופיל אוטומטית בכל הרשמה חדשה
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, plan)
  values (new.id, new.email, 'free')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- הפעלת Row Level Security
alter table public.profiles enable row level security;

-- כל משתמש רואה רק את הפרופיל של עצמו
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- אדמין רואה את כל הפרופילים
drop policy if exists "Admin can view all profiles" on public.profiles;
create policy "Admin can view all profiles"
  on public.profiles for select
  using (public.is_admin());

-- הפעלת מסלול לאחר תשלום PayPal (משתמש מחובר מעדכן את עצמו)
create or replace function public.activate_plan(
  p_plan text,
  p_paypal_subscription_id text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  if p_plan not in ('pro', 'unlimited') then
    raise exception 'invalid plan';
  end if;

  update public.profiles
  set
    plan = p_plan,
    paypal_subscription_id = coalesce(p_paypal_subscription_id, paypal_subscription_id)
  where id = auth.uid();
end;
$$;

grant execute on function public.activate_plan(text, text) to authenticated;

-- אדמין משנה מסלול למשתמש
create or replace function public.admin_set_plan(
  p_user_id uuid,
  p_plan text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'not admin';
  end if;

  if p_plan not in ('free', 'pro', 'unlimited') then
    raise exception 'invalid plan';
  end if;

  update public.profiles
  set plan = p_plan
  where id = p_user_id;
end;
$$;

grant execute on function public.admin_set_plan(uuid, text) to authenticated;

-- מילוי פרופילים למשתמשים שנרשמו לפני הרצת הסקריפט (אם יש)
insert into public.profiles (id, email, created_at, plan)
select id, email, created_at, 'free' from auth.users
on conflict (id) do nothing;

update public.profiles set plan = 'free' where plan is null;

-- מעקב שימושי AI (הצעות תשובה)
alter table public.profiles
  add column if not exists ai_suggestions_used int not null default 0;

alter table public.profiles
  add column if not exists ai_period_key text not null default 'lifetime';

-- מחזיר מצב שימוש נוכחי בלי לצרוך
create or replace function public.get_ai_usage()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_plan text;
  v_used int;
  v_period text;
  v_limit int;
  v_period_key text;
  v_ym text := to_char(timezone('utc', now()), 'YYYY-MM');
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  select plan, ai_suggestions_used, ai_period_key
  into v_plan, v_used, v_period
  from public.profiles
  where id = v_uid;

  if not found then
    return jsonb_build_object('allowed', false, 'used', 0, 'limit', 0, 'remaining', 0, 'plan', 'free');
  end if;

  if v_plan = 'unlimited' then
    return jsonb_build_object(
      'allowed', true,
      'used', v_used,
      'limit', null,
      'remaining', null,
      'plan', v_plan,
      'period', 'none'
    );
  elsif v_plan = 'pro' then
    v_limit := 30;
    v_period_key := v_ym;
    if v_period is distinct from v_period_key then
      v_used := 0;
    end if;
  else
    -- free: ניסיון אחד לכל החיים
    v_limit := 1;
    v_period_key := 'lifetime';
    if v_period is distinct from 'lifetime' then
      -- שמירה על ספירה אם כבר השתמשו
      null;
    end if;
  end if;

  return jsonb_build_object(
    'allowed', v_used < v_limit,
    'used', v_used,
    'limit', v_limit,
    'remaining', greatest(v_limit - v_used, 0),
    'plan', v_plan,
    'period', v_period_key
  );
end;
$$;

grant execute on function public.get_ai_usage() to authenticated;

-- צריכת קרדיט AI לפני קריאה ל-OpenAI
create or replace function public.consume_ai_credit()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_plan text;
  v_used int;
  v_period text;
  v_limit int;
  v_period_key text;
  v_ym text := to_char(timezone('utc', now()), 'YYYY-MM');
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  select plan, ai_suggestions_used, ai_period_key
  into v_plan, v_used, v_period
  from public.profiles
  where id = v_uid
  for update;

  if not found then
    return jsonb_build_object('allowed', false, 'reason', 'no_profile', 'used', 0, 'limit', 0, 'remaining', 0);
  end if;

  if v_plan = 'unlimited' then
    update public.profiles
    set ai_suggestions_used = ai_suggestions_used + 1,
        ai_period_key = 'none'
    where id = v_uid;

    return jsonb_build_object(
      'allowed', true,
      'used', v_used + 1,
      'limit', null,
      'remaining', null,
      'plan', v_plan
    );
  elsif v_plan = 'pro' then
    v_limit := 30;
    v_period_key := v_ym;
    if v_period is distinct from v_period_key then
      v_used := 0;
    end if;
  else
    v_limit := 1;
    v_period_key := 'lifetime';
    if v_period is distinct from 'lifetime' and v_period is distinct from null then
      -- אם עברו ממסלול בתשלום לחינמי — איפוס לא חל; נשארים על lifetime
      null;
    end if;
    if v_period is distinct from 'lifetime' then
      v_used := 0;
    end if;
  end if;

  if v_used >= v_limit then
    return jsonb_build_object(
      'allowed', false,
      'reason', 'limit_reached',
      'used', v_used,
      'limit', v_limit,
      'remaining', 0,
      'plan', v_plan
    );
  end if;

  update public.profiles
  set ai_suggestions_used = v_used + 1,
      ai_period_key = v_period_key
  where id = v_uid;

  return jsonb_build_object(
    'allowed', true,
    'used', v_used + 1,
    'limit', v_limit,
    'remaining', greatest(v_limit - (v_used + 1), 0),
    'plan', v_plan
  );
end;
$$;

grant execute on function public.consume_ai_credit() to authenticated;

-- החזרת קרדיט אם קריאת OpenAI נכשלה אחרי צריכה
create or replace function public.refund_ai_credit()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  update public.profiles
  set ai_suggestions_used = greatest(ai_suggestions_used - 1, 0)
  where id = auth.uid();
end;
$$;

grant execute on function public.refund_ai_credit() to authenticated;

-- =============================================================================
-- Cloud sync for leads: run the `user_contacts` block below in SQL Editor after the base schema.
-- See also docs/chrome-web-store-listing.md for publish checklist.

create table if not exists public.user_contacts (
  user_id uuid not null references auth.users (id) on delete cascade,
  phone_number text not null,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, phone_number)
);

create index if not exists user_contacts_user_id_idx on public.user_contacts (user_id);

alter table public.user_contacts enable row level security;

drop policy if exists "Users manage own contacts" on public.user_contacts;
create policy "Users manage own contacts"
  on public.user_contacts
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, update, delete on public.user_contacts to authenticated;

