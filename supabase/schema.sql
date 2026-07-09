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
