-- Bảng chi tiêu dùng chung cho app Next.js
-- Chạy trong Supabase SQL Editor

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  amount numeric not null check (amount > 0),
  kind text not null default 'chi',
  category text not null default 'khac',
  note text not null default '',
  payment_method text not null default 'cash',
  spent_at timestamptz not null default now(),
  device_id text not null default 'shared',
  created_at timestamptz not null default now()
);

create index if not exists expenses_device_spent_idx
  on public.expenses (device_id, spent_at desc);

alter table public.expenses enable row level security;

-- Demo không login: cho phép anon đọc/ghi theo device_id.
-- Nếu bạn bật Auth sau này, hãy siết lại policy theo auth.uid().
drop policy if exists "anon all by device" on public.expenses;
create policy "anon all by device"
  on public.expenses for all
  to anon
  using (true)
  with check (true);

-- Bật Realtime để dashboard cập nhật theo thời gian thực
-- (Database > Replication > chọn bảng expenses, hoặc chạy dòng dưới)
alter publication supabase_realtime add table public.expenses;
