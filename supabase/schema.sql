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
  insert into public.profiles (id, email)
  values (new.id, new.email)
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

-- מילוי פרופילים למשתמשים שנרשמו לפני הרצת הסקריפט (אם יש)
insert into public.profiles (id, email, created_at)
select id, email, created_at from auth.users
on conflict (id) do nothing;
