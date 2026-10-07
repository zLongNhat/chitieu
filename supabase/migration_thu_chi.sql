-- Migration: thêm phân loại thu/chi. Chạy 1 lần trên DB đang có dữ liệu.
alter table public.expenses
  add column if not exists kind text not null default 'chi';

-- Dữ liệu cũ mặc định là chi tiêu
update public.expenses set kind = 'chi' where kind is null or kind = '';
