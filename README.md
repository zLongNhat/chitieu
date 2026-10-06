# Chi tiêu Material You (Next.js + Supabase)

Web theo dõi chi tiêu, theme Material You Expressive, cập nhật realtime.

- `/`: dashboard — tab **Ngày | Tháng**, tổng chi tiêu + lịch sử, biểu đồ cột (ngày: 7 ngày gần nhất, tháng: 12 tháng), biểu đồ tròn theo danh mục.
- `/add`: subpage nhập chi tiêu hàng ngày.
- Mới vào thấy số liệu luôn nhờ dữ liệu mẫu.
- Lưu ở Supabase, realtime qua `postgres_changes`. Chưa cấu hình Supabase thì tự fallback localStorage.

## 1. Tạo Supabase

1. Tạo project tại https://supabase.com
2. Vào SQL Editor, chạy file `supabase/schema.sql` (tạo bảng `expenses`, RLS, bật realtime).
3. Lấy `Project URL` + `anon key` ở Project Settings > API.

## 2. Chạy local

```bash
cp .env.example .env.local
# điền NEXT_PUBLIC_SUPABASE_URL và NEXT_PUBLIC_SUPABASE_ANON_KEY
npm install
npm run dev
```

Mở http://localhost:3000

## 3. Logic dữ liệu

- Một cụm chi tiêu chung cho mọi thiết bị (không phân biệt theo máy).
- Dashboard tự tải lại khi mở lại tab / có mạng trở lại (đề phòng realtime rớt trên mobile).

## 4. Cài app (PWA)

- Mở web trên Chrome/Edge (PC + Android): bấm nút **Cài app** (header hoặc sidebar) → Install.
- Trên Safari iPhone: bấm nút **Cài app** → làm theo hướng dẫn (Chia sẻ → Thêm vào MH chính).
- App chạy standalone, có icon, dùng offline được trang đã mở (service worker `public/sw.js`).
- User mới chưa có record -> hiện 6 giao dịch mẫu hôm nay (chỉ ở client). Nhập khoản đầu tiên sẽ thay bằng số thật.
- Dashboard subscribe `supabase.channel('expenses-deviceId').on('postgres_changes')` nên mở 2 tab nhập ở `/add` là `/` cập nhật ngay.
