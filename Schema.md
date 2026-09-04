# Schema — Sistem Pendataan dan Pelaporan Kependudukan Kelurahan

Skema PostgreSQL (Supabase) yang menopang kebutuhan di `PRD.md` dan arsitektur di `Architecture.md`. Semua tabel data (bukan tabel referensi statis) memiliki RLS aktif — kebijakan detail ada di bagian 5.

## 1. Entitas Wilayah

```sql
create table kelurahan (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  kecamatan text not null,
  kabupaten_kota text not null,
  created_at timestamptz not null default now()
);

create table rw (
  id uuid primary key default gen_random_uuid(),
  kelurahan_id uuid not null references kelurahan(id) on delete restrict,
  nomor text not null,             -- contoh: "01", "02"
  nama_ketua text,                 -- disimpan sebagai cache tampilan; sumber kebenaran tetap di profiles
  created_at timestamptz not null default now(),
  unique (kelurahan_id, nomor)
);

create table rt (
  id uuid primary key default gen_random_uuid(),
  rw_id uuid not null references rw(id) on delete restrict,
  nomor text not null,
  nama_ketua text,
  created_at timestamptz not null default now(),
  unique (rw_id, nomor)
);
```

`kelurahan_id` disertakan sejak awal (lihat Architecture.md §6) meskipun versi awal hanya memakai satu baris `kelurahan`, agar ekspansi multi-kelurahan tidak memerlukan migrasi struktural.

## 2. Profil Pengguna & Peran

Supabase Auth mengelola tabel `auth.users` bawaan (email, password hash). Tabel `profiles` menyimpan data domain:

```sql
create type user_role as enum ('admin_kelurahan', 'ketua_rw', 'ketua_rt');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nama text not null,
  role user_role not null,
  kelurahan_id uuid references kelurahan(id),   -- wajib diisi untuk admin_kelurahan
  rw_id uuid references rw(id),                 -- wajib diisi untuk ketua_rw
  rt_id uuid references rt(id),                 -- wajib diisi untuk ketua_rt
  created_at timestamptz not null default now(),

  constraint scope_sesuai_role check (
    (role = 'admin_kelurahan' and kelurahan_id is not null and rw_id is null and rt_id is null) or
    (role = 'ketua_rw' and rw_id is not null and rt_id is null) or
    (role = 'ketua_rt' and rt_id is not null)
  )
);
```

Constraint `scope_sesuai_role` mencegah data cacat di level database — misalnya seorang `ketua_rt` tanpa `rt_id`, yang jika lolos akan membuat RLS gagal membatasi aksesnya (lihat Rules.md §2 untuk konsekuensi jika constraint ini dilanggar oleh bug aplikasi).

## 3. Warga

```sql
create type status_warga as enum ('aktif', 'pindah', 'meninggal');
create type jenis_kelamin as enum ('L', 'P');

create table warga (
  id uuid primary key default gen_random_uuid(),
  nik text not null unique,
  nama text not null,
  tempat_lahir text,
  tanggal_lahir date,
  jenis_kelamin jenis_kelamin not null,
  alamat text not null,
  rt_id uuid not null references rt(id),
  status status_warga not null default 'aktif',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_warga_rt on warga (rt_id);
create index idx_warga_status on warga (status);
```

`rt_id` pada `warga` selalu mencerminkan RT **saat ini**. Saat ada laporan Pindahan yang disetujui, `rt_id` warga diperbarui ke RT tujuan (lihat §6 — trigger). Riwayat perpindahan tidak hilang karena tetap tercatat sebagai baris di tabel `laporan`.

## 4. Laporan

```sql
create type jenis_laporan as enum (
  'masuk', 'keluar', 'lahir', 'meninggal', 'pindahan', 'perubahan_data'
);

create type status_laporan as enum ('diajukan', 'diverifikasi', 'ditolak');

create table laporan (
  id uuid primary key default gen_random_uuid(),
  jenis jenis_laporan not null,
  warga_id uuid references warga(id),          -- null diperbolehkan untuk laporan 'masuk' sebelum baris warga dibuat
  rt_id uuid not null references rt(id),        -- RT pelapor / RT tempat kejadian
  rw_id uuid not null references rw(id),        -- denormalisasi dari rt_id untuk mempercepat filter per RW
  rt_asal_id uuid references rt(id),            -- khusus jenis 'pindahan'
  rt_tujuan_id uuid references rt(id),          -- khusus jenis 'pindahan'
  status status_laporan not null default 'diajukan',
  detail jsonb not null default '{}',           -- field spesifik per jenis, lihat §4.1
  keterangan text,
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now(),
  verified_by uuid references profiles(id),
  verified_at timestamptz,

  constraint pindahan_wajib_asal_tujuan check (
    (jenis <> 'pindahan') or (rt_asal_id is not null and rt_tujuan_id is not null and rt_asal_id <> rt_tujuan_id)
  )
);

create index idx_laporan_rt on laporan (rt_id);
create index idx_laporan_rw on laporan (rw_id);
create index idx_laporan_jenis on laporan (jenis);
create index idx_laporan_status on laporan (status);
create index idx_laporan_created_at on laporan (created_at);
```

**Kolom `rw_id` didenormalisasi** dari `rt_id` (yaitu, disalin saat insert, bukan dihitung via join tiap query) supaya query dashboard tingkat RW tidak perlu join ke tabel `rt` di setiap panggilan. Konsistensi dijaga oleh trigger `set_rw_id_from_rt` (lihat §6).

### 4.1 Struktur `detail` (JSONB) per Jenis

| Jenis | Contoh isi `detail` |
|---|---|
| `masuk` | `{ "alamat_asal": "...", "nik_kepala_keluarga": "..." }` |
| `keluar` | `{ "alamat_tujuan": "...", "kota_tujuan": "..." }` |
| `lahir` | `{ "nama_ayah": "...", "nama_ibu": "...", "berat_lahir_kg": 3.2 }` |
| `meninggal` | `{ "tanggal_meninggal": "...", "penyebab": "..." }` |
| `pindahan` | `{ "alasan": "..." }` (asal/tujuan RT sudah di kolom `rt_asal_id`/`rt_tujuan_id`) |
| `perubahan_data` | `{ "field_diubah": "pekerjaan", "nilai_lama": "...", "nilai_baru": "..." }` |

Pendekatan `jsonb` dipilih agar penambahan field baru per jenis laporan (misalnya menambah field "golongan darah" pada laporan lahir) tidak memerlukan migrasi kolom (lihat Architecture.md §6).

## 5. Row-Level Security

RLS diaktifkan di seluruh tabel data (`warga`, `laporan`, `profiles`); tabel wilayah (`kelurahan`, `rw`, `rt`) bersifat baca-untuk-semua-yang-login karena dipakai sebagai referensi dropdown, dengan tulis dibatasi hanya untuk `admin_kelurahan`.

```sql
alter table warga enable row level security;
alter table laporan enable row level security;
alter table profiles enable row level security;
alter table rw enable row level security;
alter table rt enable row level security;

-- Helper: ambil profile milik user yang sedang login
create function current_profile() returns profiles as $$
  select * from profiles where id = auth.uid();
$$ language sql stable security definer;

-- LAPORAN: SELECT
create policy laporan_select on laporan for select using (
  (select role from current_profile()) = 'admin_kelurahan'
  or ((select role from current_profile()) = 'ketua_rw' and rw_id = (select rw_id from current_profile()))
  or ((select role from current_profile()) = 'ketua_rt' and rt_id = (select rt_id from current_profile()))
);

-- LAPORAN: INSERT — hanya ketua_rt, hanya untuk RT miliknya sendiri
create policy laporan_insert on laporan for insert with check (
  (select role from current_profile()) = 'ketua_rt'
  and rt_id = (select rt_id from current_profile())
  and created_by = auth.uid()
);

-- LAPORAN: UPDATE (verifikasi) — hanya ketua_rw untuk laporan RT di bawahnya, atau admin
create policy laporan_update on laporan for update using (
  (select role from current_profile()) = 'admin_kelurahan'
  or ((select role from current_profile()) = 'ketua_rw' and rw_id = (select rw_id from current_profile()))
);

-- WARGA: SELECT mengikuti pola scoping yang sama seperti laporan
create policy warga_select on warga for select using (
  (select role from current_profile()) = 'admin_kelurahan'
  or ((select role from current_profile()) = 'ketua_rw'
      and rt_id in (select id from rt where rw_id = (select rw_id from current_profile())))
  or ((select role from current_profile()) = 'ketua_rt' and rt_id = (select rt_id from current_profile()))
);
```

**Asumsi A7:** Baris `warga` sendiri tidak diinsert/diupdate langsung oleh klien — perubahan pada `warga` (RT pindah, status jadi meninggal, dsb.) selalu terjadi lewat trigger yang dipicu oleh perubahan `laporan.status` menjadi `diverifikasi` (lihat §6), bukan lewat form edit `warga` secara langsung. Ini menjaga agar setiap perubahan status warga selalu punya jejak laporan resminya.

## 6. Trigger untuk Konsistensi Data

```sql
-- Isi rw_id otomatis dari rt_id saat insert laporan
create function set_rw_id_from_rt() returns trigger as $$
begin
  new.rw_id := (select rw_id from rt where id = new.rt_id);
  return new;
end;
$$ language plpgsql;

create trigger trg_set_rw_id
before insert on laporan
for each row execute function set_rw_id_from_rt();

-- Terapkan efek laporan ke tabel warga saat status berubah jadi 'diverifikasi'
create function apply_laporan_effect() returns trigger as $$
begin
  if new.status = 'diverifikasi' and old.status <> 'diverifikasi' then
    if new.jenis = 'pindahan' then
      update warga set rt_id = new.rt_tujuan_id, updated_at = now() where id = new.warga_id;
    elsif new.jenis = 'keluar' then
      update warga set status = 'pindah', updated_at = now() where id = new.warga_id;
    elsif new.jenis = 'meninggal' then
      update warga set status = 'meninggal', updated_at = now() where id = new.warga_id;
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_apply_laporan_effect
after update on laporan
for each row execute function apply_laporan_effect();
```

## 7. View Agregasi untuk Dashboard

```sql
create view v_statistik_bulanan
with (security_invoker = true) as
select
  date_trunc('month', l.created_at) as bulan,
  l.rw_id,
  l.rt_id,
  count(*) filter (where l.jenis = 'lahir' and l.status = 'diverifikasi') as jumlah_lahir,
  count(*) filter (where l.jenis = 'meninggal' and l.status = 'diverifikasi') as jumlah_meninggal,
  count(*) filter (where l.jenis = 'masuk' and l.status = 'diverifikasi') as jumlah_masuk_langsung,
  count(*) filter (where l.jenis = 'keluar' and l.status = 'diverifikasi') as jumlah_keluar_langsung,
  count(*) filter (where l.jenis = 'pindahan' and l.status = 'diverifikasi' and l.rt_tujuan_id = l.rt_id) as jumlah_pindah_masuk,
  count(*) filter (where l.jenis = 'pindahan' and l.status = 'diverifikasi' and l.rt_asal_id = l.rt_id) as jumlah_pindah_keluar
from laporan l
group by 1, 2, 3;
```

Klausul `security_invoker = true` memastikan view ini dijalankan dengan hak akses (dan RLS) milik pengguna yang memanggilnya, bukan hak akses pembuat view — sehingga Ketua RT tetap hanya melihat baris RT-nya sendiri lewat view ini juga, tanpa perlu policy RLS terpisah untuk view.

**Catatan implementasi statistik gabungan (lihat PRD.md §4.1):** kolom `jumlah_masuk_langsung` dan `jumlah_pindah_masuk` dijumlahkan di layer aplikasi/query saat menyajikan angka "Total Masuk" pada dashboard, sementara laporan resmi jenis "Pindahan" tetap membaca tabel `laporan` mentah tanpa penggabungan ini.

## 8. Storage

Bucket Supabase Storage `lampiran-laporan` menyimpan dokumen pendukung opsional (misalnya foto KK, surat pengantar RT) yang ditautkan lewat kolom `detail.lampiran_url` pada `laporan`. Akses bucket diatur lewat policy Storage yang mencerminkan pola RLS `laporan_select` di atas.

**Asumsi A8:** Lampiran dokumen bersifat opsional dan tidak wajib untuk setiap laporan pada versi awal. Jika kelurahan mewajibkan lampiran untuk jenis laporan tertentu (misalnya KK untuk warga masuk), validasi wajib-lampiran perlu ditambahkan di layer aplikasi.
