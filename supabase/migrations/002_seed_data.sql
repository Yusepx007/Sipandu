-- ============================================================
-- SIPANDU — Seed Data: Kelurahan Setiamulya
-- Migration 002: Seed Data
-- Jalankan SETELAH 001_initial_schema.sql
-- CATATAN: Ganti email dan password admin sesuai kebutuhan
-- ============================================================

-- Kelurahan
insert into kelurahan (id, nama, kecamatan, kabupaten_kota)
values (
  'a0000000-0000-0000-0000-000000000001',
  'Setiamulya',
  'Kesambi',
  'Kota Cirebon'
);

-- RW
insert into rw (id, kelurahan_id, nomor) values
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', '01'),
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', '02'),
  ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', '03');

-- RT
insert into rt (id, rw_id, nomor) values
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '01'),
  ('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', '02'),
  ('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', '03'),
  ('c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000002', '01'),
  ('c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000002', '02'),
  ('c0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000003', '01'),
  ('c0000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000003', '02');

-- ============================================================
-- CATATAN PENTING:
-- Akun pengguna (admin, ketua RW, ketua RT) dibuat melalui
-- Supabase Auth Dashboard atau via Admin API, BUKAN via SQL langsung.
-- 
-- Langkah membuat akun admin:
-- 1. Buka Supabase Dashboard → Authentication → Users
-- 2. Klik "Add User" → masukkan email: admin@setiamulya.id, password: Admin1234!
-- 3. Salin UUID user yang baru dibuat
-- 4. Jalankan SQL berikut (ganti UUID dengan yang sebenarnya):
--
--    INSERT INTO profiles (id, nama, role, kelurahan_id)
--    VALUES ('<UUID_DARI_AUTH>', 'Admin Kelurahan', 'admin_kelurahan',
--            'a0000000-0000-0000-0000-000000000001');
--
-- ============================================================

-- Contoh data warga untuk testing
-- (Jalankan setelah akun admin dibuat dan tabel profiles terisi)
insert into warga (nik, nama, tempat_lahir, tanggal_lahir, jenis_kelamin, alamat, rt_id, status)
values
  ('3271010101800001', 'Ahmad Fauzi', 'Cirebon', '1980-01-01', 'L', 'Jl. Merdeka No. 1', 'c0000000-0000-0000-0000-000000000001', 'aktif'),
  ('3271010101850002', 'Siti Rahayu', 'Cirebon', '1985-03-15', 'P', 'Jl. Merdeka No. 2', 'c0000000-0000-0000-0000-000000000001', 'aktif'),
  ('3271010101900003', 'Budi Santoso', 'Bandung', '1990-07-20', 'L', 'Jl. Kenanga No. 5', 'c0000000-0000-0000-0000-000000000002', 'aktif'),
  ('3271010101920004', 'Dewi Lestari', 'Jakarta', '1992-11-08', 'P', 'Jl. Kenanga No. 7', 'c0000000-0000-0000-0000-000000000002', 'aktif'),
  ('3271010101750005', 'Hendra Wijaya', 'Cirebon', '1975-05-12', 'L', 'Jl. Anggrek No. 3', 'c0000000-0000-0000-0000-000000000004', 'aktif');
