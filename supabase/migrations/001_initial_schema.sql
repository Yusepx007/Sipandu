-- ============================================================
-- SIPANDU — Sistem Pendataan dan Pelaporan Kependudukan Kelurahan
-- Migration 001: Initial Schema
-- ============================================================

-- ============================================================
-- SECTION 1: TABEL WILAYAH
-- ============================================================

create table if not exists kelurahan (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  kecamatan text not null,
  kabupaten_kota text not null,
  created_at timestamptz not null default now()
);

create table if not exists rw (
  id uuid primary key default gen_random_uuid(),
  kelurahan_id uuid not null references kelurahan(id) on delete restrict,
  nomor text not null,
  nama_ketua text,
  created_at timestamptz not null default now(),
  unique (kelurahan_id, nomor)
);

create table if not exists rt (
  id uuid primary key default gen_random_uuid(),
  rw_id uuid not null references rw(id) on delete restrict,
  nomor text not null,
  nama_ketua text,
  created_at timestamptz not null default now(),
  unique (rw_id, nomor)
);

-- ============================================================
-- SECTION 2: PROFIL PENGGUNA & PERAN
-- ============================================================

create type user_role as enum ('admin_kelurahan', 'ketua_rw', 'ketua_rt');

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nama text not null,
  role user_role not null,
  kelurahan_id uuid references kelurahan(id),
  rw_id uuid references rw(id),
  rt_id uuid references rt(id),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),

  constraint scope_sesuai_role check (
    (role = 'admin_kelurahan' and kelurahan_id is not null and rw_id is null and rt_id is null) or
    (role = 'ketua_rw' and rw_id is not null and rt_id is null) or
    (role = 'ketua_rt' and rt_id is not null)
  )
);

-- ============================================================
-- SECTION 3: WARGA
-- ============================================================

create type status_warga as enum ('aktif', 'pindah', 'meninggal');
create type jenis_kelamin as enum ('L', 'P');

create table if not exists warga (
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

create index if not exists idx_warga_rt on warga (rt_id);
create index if not exists idx_warga_status on warga (status);
create index if not exists idx_warga_nik on warga (nik);

-- ============================================================
-- SECTION 4: LAPORAN
-- ============================================================

create type jenis_laporan as enum (
  'masuk', 'keluar', 'lahir', 'meninggal', 'pindahan', 'perubahan_data'
);

create type status_laporan as enum ('diajukan', 'diverifikasi', 'ditolak');

create table if not exists laporan (
  id uuid primary key default gen_random_uuid(),
  jenis jenis_laporan not null,
  warga_id uuid references warga(id),
  rt_id uuid not null references rt(id),
  rw_id uuid not null references rw(id),
  rt_asal_id uuid references rt(id),
  rt_tujuan_id uuid references rt(id),
  status status_laporan not null default 'diajukan',
  detail jsonb not null default '{}',
  keterangan text,
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now(),
  verified_by uuid references profiles(id),
  verified_at timestamptz,

  constraint pindahan_wajib_asal_tujuan check (
    (jenis <> 'pindahan') or
    (rt_asal_id is not null and rt_tujuan_id is not null and rt_asal_id <> rt_tujuan_id)
  )
);

create index if not exists idx_laporan_rt on laporan (rt_id);
create index if not exists idx_laporan_rw on laporan (rw_id);
create index if not exists idx_laporan_jenis on laporan (jenis);
create index if not exists idx_laporan_status on laporan (status);
create index if not exists idx_laporan_created_at on laporan (created_at desc);
create index if not exists idx_laporan_warga on laporan (warga_id);

-- ============================================================
-- SECTION 5: ROW LEVEL SECURITY
-- ============================================================

alter table kelurahan enable row level security;
alter table rw enable row level security;
alter table rt enable row level security;
alter table profiles enable row level security;
alter table warga enable row level security;
alter table laporan enable row level security;

-- Helper function: ambil profile user saat ini
create or replace function current_profile()
returns profiles
language sql stable security definer
as $$
  select * from profiles where id = auth.uid();
$$;

-- ---- KELURAHAN: semua yang login bisa read ----
create policy kelurahan_select on kelurahan for select
  using (auth.uid() is not null);

create policy kelurahan_insert on kelurahan for insert
  with check ((select role from current_profile()) = 'admin_kelurahan');

create policy kelurahan_update on kelurahan for update
  using ((select role from current_profile()) = 'admin_kelurahan');

-- ---- RW: semua yang login bisa read; hanya admin yang bisa write ----
create policy rw_select on rw for select
  using (auth.uid() is not null);

create policy rw_insert on rw for insert
  with check ((select role from current_profile()) = 'admin_kelurahan');

create policy rw_update on rw for update
  using ((select role from current_profile()) = 'admin_kelurahan');

-- ---- RT: semua yang login bisa read; hanya admin yang bisa write ----
create policy rt_select on rt for select
  using (auth.uid() is not null);

create policy rt_insert on rt for insert
  with check ((select role from current_profile()) = 'admin_kelurahan');

create policy rt_update on rt for update
  using ((select role from current_profile()) = 'admin_kelurahan');

-- ---- PROFILES ----
create policy profiles_select_own on profiles for select
  using (id = auth.uid() or (select role from current_profile()) = 'admin_kelurahan');

create policy profiles_insert_admin on profiles for insert
  with check ((select role from current_profile()) = 'admin_kelurahan');

create policy profiles_update_admin on profiles for update
  using (id = auth.uid() or (select role from current_profile()) = 'admin_kelurahan');

-- ---- WARGA: scoped by role ----
create policy warga_select on warga for select using (
  (select role from current_profile()) = 'admin_kelurahan'
  or ((select role from current_profile()) = 'ketua_rw'
      and rt_id in (select id from rt where rw_id = (select rw_id from current_profile())))
  or ((select role from current_profile()) = 'ketua_rt'
      and rt_id = (select rt_id from current_profile()))
);

-- Warga hanya bisa diinsert via trigger dari laporan (security definer)
-- Tidak ada direct insert policy untuk client

-- ---- LAPORAN: scoped by role ----
create policy laporan_select on laporan for select using (
  (select role from current_profile()) = 'admin_kelurahan'
  or ((select role from current_profile()) = 'ketua_rw'
      and rw_id = (select rw_id from current_profile()))
  or ((select role from current_profile()) = 'ketua_rt'
      and rt_id = (select rt_id from current_profile()))
);

-- Hanya ketua_rt yang bisa insert, hanya untuk RT-nya
create policy laporan_insert on laporan for insert with check (
  (select role from current_profile()) = 'ketua_rt'
  and rt_id = (select rt_id from current_profile())
  and created_by = auth.uid()
);

-- Verifikasi: hanya ketua_rw (untuk RT-nya) atau admin
create policy laporan_update on laporan for update using (
  (select role from current_profile()) = 'admin_kelurahan'
  or ((select role from current_profile()) = 'ketua_rw'
      and rw_id = (select rw_id from current_profile()))
);

-- ============================================================
-- SECTION 6: TRIGGERS
-- ============================================================

-- Trigger 1: Set rw_id otomatis dari rt_id saat insert laporan
create or replace function set_rw_id_from_rt()
returns trigger
language plpgsql
as $$
begin
  new.rw_id := (select rw_id from rt where id = new.rt_id);
  return new;
end;
$$;

drop trigger if exists trg_set_rw_id on laporan;
create trigger trg_set_rw_id
before insert on laporan
for each row execute function set_rw_id_from_rt();

-- Trigger 2: Efek laporan ke tabel warga saat status jadi 'diverifikasi'
create or replace function apply_laporan_effect()
returns trigger
language plpgsql security definer
as $$
begin
  if new.status = 'diverifikasi' and old.status <> 'diverifikasi' then
    -- Set verified_at jika belum terisi
    if new.verified_at is null then
      new.verified_at := now();
    end if;

    if new.jenis = 'pindahan' and new.warga_id is not null then
      update warga
      set rt_id = new.rt_tujuan_id, updated_at = now()
      where id = new.warga_id;

    elsif new.jenis = 'keluar' and new.warga_id is not null then
      update warga
      set status = 'pindah', updated_at = now()
      where id = new.warga_id;

    elsif new.jenis = 'meninggal' and new.warga_id is not null then
      update warga
      set status = 'meninggal', updated_at = now()
      where id = new.warga_id;

    elsif new.jenis = 'masuk' and new.warga_id is null then
      -- Buat baris warga baru dari detail laporan
      declare
        new_warga_id uuid;
        warga_detail jsonb := new.detail;
      begin
        insert into warga (nik, nama, tempat_lahir, tanggal_lahir, jenis_kelamin, alamat, rt_id, status)
        values (
          warga_detail->>'nik',
          warga_detail->>'nama',
          warga_detail->>'tempat_lahir',
          (warga_detail->>'tanggal_lahir')::date,
          (warga_detail->>'jenis_kelamin')::jenis_kelamin,
          warga_detail->>'alamat',
          new.rt_id,
          'aktif'
        )
        returning id into new_warga_id;

        new.warga_id := new_warga_id;
      end;

    elsif new.jenis = 'lahir' and new.warga_id is null then
      declare
        new_warga_id uuid;
        warga_detail jsonb := new.detail;
      begin
        if warga_detail->>'nik' is not null then
          insert into warga (nik, nama, tempat_lahir, tanggal_lahir, jenis_kelamin, alamat, rt_id, status)
          values (
            warga_detail->>'nik',
            warga_detail->>'nama',
            'Setiamulya',
            (warga_detail->>'tanggal_lahir')::date,
            (warga_detail->>'jenis_kelamin')::jenis_kelamin,
            coalesce(warga_detail->>'alamat', ''),
            new.rt_id,
            'aktif'
          )
          returning id into new_warga_id;

          new.warga_id := new_warga_id;
        end if;
      end;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_apply_laporan_effect on laporan;
create trigger trg_apply_laporan_effect
before update on laporan
for each row execute function apply_laporan_effect();

-- ============================================================
-- SECTION 7: VIEW AGREGASI DASHBOARD
-- ============================================================

create or replace view v_statistik_bulanan
with (security_invoker = true) as
select
  date_trunc('month', l.created_at) as bulan,
  l.rw_id,
  l.rt_id,
  count(*) filter (where l.jenis = 'lahir' and l.status = 'diverifikasi') as jumlah_lahir,
  count(*) filter (where l.jenis = 'meninggal' and l.status = 'diverifikasi') as jumlah_meninggal,
  count(*) filter (where l.jenis = 'masuk' and l.status = 'diverifikasi') as jumlah_masuk_langsung,
  count(*) filter (where l.jenis = 'keluar' and l.status = 'diverifikasi') as jumlah_keluar_langsung,
  count(*) filter (
    where l.jenis = 'pindahan' and l.status = 'diverifikasi' and l.rt_tujuan_id = l.rt_id
  ) as jumlah_pindah_masuk,
  count(*) filter (
    where l.jenis = 'pindahan' and l.status = 'diverifikasi' and l.rt_asal_id = l.rt_id
  ) as jumlah_pindah_keluar,
  count(*) filter (where l.status = 'diajukan') as jumlah_diajukan,
  count(*) as total_laporan
from laporan l
group by 1, 2, 3;

-- View ringkasan per wilayah untuk perbandingan antar RW/RT
create or replace view v_ringkasan_wilayah
with (security_invoker = true) as
select
  r.id as rw_id,
  r.nomor as nomor_rw,
  rt.id as rt_id,
  rt.nomor as nomor_rt,
  count(distinct w.id) filter (where w.status = 'aktif') as jumlah_warga_aktif,
  count(l.id) filter (where l.status = 'diverifikasi') as total_laporan_diverifikasi,
  count(l.id) filter (where l.status = 'diajukan') as total_laporan_pending
from rw r
left join rt on rt.rw_id = r.id
left join warga w on w.rt_id = rt.id
left join laporan l on l.rt_id = rt.id
group by r.id, r.nomor, rt.id, rt.nomor;

-- Trigger untuk update updated_at pada warga
create or replace function update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_warga_updated_at on warga;
create trigger trg_warga_updated_at
before update on warga
for each row execute function update_updated_at();
