-- ==============================================================================
-- WCAGuard Supabase Database Migration
-- Auth profiles, scans, scan_issues, and cryptographic certificates
-- With strict Row Level Security (RLS) enforcement
-- ==============================================================================

create extension if not exists "uuid-ossp";

-- 1. PROFILES TABLE
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can delete their own profile"
  on public.profiles for delete
  using (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, created_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    now()
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. SCANS TABLE
create table if not exists public.scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  input_type text not null check (input_type in ('code', 'url')),
  target_url text,
  code_hash text,
  saved_code text, -- Only populated if user explicitly ticks "Save code to my history"
  status text not null default 'completed',
  created_at timestamptz default timezone('utc'::text, now()) not null
);

alter table public.scans enable row level security;

create policy "Users can select their own scans"
  on public.scans for select
  using (auth.uid() = user_id);

create policy "Users can insert their own scans"
  on public.scans for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own scans"
  on public.scans for update
  using (auth.uid() = user_id);

create policy "Users can delete their own scans"
  on public.scans for delete
  using (auth.uid() = user_id);

-- 3. SCAN ISSUES TABLE
create table if not exists public.scan_issues (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid not null references public.scans(id) on delete cascade,
  rule_id text not null,
  wcag_criterion text not null,
  impact text not null,
  selector_or_line text,
  message text not null,
  classification text not null,
  status text not null default 'detected',
  created_at timestamptz default timezone('utc'::text, now()) not null
);

alter table public.scan_issues enable row level security;

create policy "Users can select issues from their own scans"
  on public.scan_issues for select
  using (
    exists (
      select 1 from public.scans s
      where s.id = scan_issues.scan_id and s.user_id = auth.uid()
    )
  );

create policy "Users can insert issues into their own scans"
  on public.scan_issues for insert
  with check (
    exists (
      select 1 from public.scans s
      where s.id = scan_issues.scan_id and s.user_id = auth.uid()
    )
  );

create policy "Users can update issues in their own scans"
  on public.scan_issues for update
  using (
    exists (
      select 1 from public.scans s
      where s.id = scan_issues.scan_id and s.user_id = auth.uid()
    )
  );

create policy "Users can delete issues in their own scans"
  on public.scan_issues for delete
  using (
    exists (
      select 1 from public.scans s
      where s.id = scan_issues.scan_id and s.user_id = auth.uid()
    )
  );

-- 4. CERTIFICATES TABLE
create table if not exists public.certificates (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid not null references public.scans(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  sha256 text not null,
  status_summary text not null,
  pdf_path text,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

alter table public.certificates enable row level security;

create policy "Users can select their own certificates"
  on public.certificates for select
  using (auth.uid() = user_id);

create policy "Users can insert their own certificates"
  on public.certificates for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own certificates"
  on public.certificates for update
  using (auth.uid() = user_id);

create policy "Users can delete their own certificates"
  on public.certificates for delete
  using (auth.uid() = user_id);

create index if not exists idx_scans_user_id on public.scans(user_id);
create index if not exists idx_scan_issues_scan_id on public.scan_issues(scan_id);
create index if not exists idx_certificates_user_id on public.certificates(user_id);

-- 5. FUNCTION TO CHECK IF AN ACCOUNT EXISTS FOR LOGIN VALIDATION
create or replace function public.check_user_exists(lookup_email text)
returns boolean
security definer
set search_path = public, auth
language plpgsql
as $$
begin
  return exists (
    select 1 from auth.users 
    where lower(email) = lower(trim(lookup_email))
  );
end;
$$;

grant execute on function public.check_user_exists(text) to anon, authenticated;
