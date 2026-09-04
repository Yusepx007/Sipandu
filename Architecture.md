# Architecture — Sistem Pendataan dan Pelaporan Kependudukan Kelurahan

Dokumen ini menjabarkan arsitektur teknis sistem, konsisten dengan kebutuhan yang dijabarkan di `PRD.md`. Skema data detail ada di `Schema.md`; aturan bisnis dan RBAC detail ada di `Rules.md`.

## 1. Stack Teknologi

| Layer | Teknologi | Alasan |
|---|---|---|
| Frontend | Next.js (App Router) + TypeScript | SSR/ISR untuk dashboard yang butuh data segar, type safety untuk struktur laporan yang kompleks |
| Styling/UI | Tailwind CSS + shadcn/ui | Komponen konsisten (tabel, form, dialog) tanpa membangun design system dari nol |
| Visualisasi | Recharts | Cukup untuk kebutuhan line/bar chart dashboard, ringan, terintegrasi baik dengan React |
| Backend & Database | Supabase (PostgreSQL, Auth, Storage, Row-Level Security) | Auth siap pakai, RLS menegakkan hak akses langsung di database (bukan hanya di UI), Postgres cocok untuk data relasional wilayah/warga/laporan |
| Deployment | Vercel | Native untuk Next.js, CI/CD otomatis dari Git |
| Export | PDF: `@react-pdf/renderer` atau `pdf-lib` di server route; Excel: `exceljs` | Generate dokumen di server (Route Handler), bukan di client, agar hasil format konsisten dan tidak bergantung pada kemampuan browser pengguna |

## 2. Gambaran Arsitektur

```
┌─────────────────────────────────────────────────────────┐
│                     Client (Browser)                     │
│   Next.js App Router (React Server + Client Components)  │
│   shadcn/ui + Tailwind, Recharts untuk grafik             │
└───────────────┬─────────────────────────┬────────────────┘
                │ Supabase JS Client       │ Server Actions /
                │ (auth session, realtime) │ Route Handlers
                ▼                          ▼
┌─────────────────────────────────────────────────────────┐
│                  Next.js Server (Vercel)                  │
│  - Server Actions: create/update laporan, verifikasi      │
│  - Route Handlers: /api/export/pdf, /api/export/excel     │
│  - Middleware: cek sesi & role sebelum akses route         │
└───────────────┬─────────────────────────────────────────┘
                │ Supabase Server Client (service role hanya
                │ untuk operasi khusus; default pakai anon key
                │ + RLS agar scoping tetap ditegakkan)
                ▼
┌─────────────────────────────────────────────────────────┐
│                        Supabase                           │
│  - Auth (email/password untuk Admin, RW, RT)               │
│  - Postgres (wilayah, warga, laporan, profiles)             │
│  - Row-Level Security per tabel berdasarkan role & wilayah  │
│  - Storage (lampiran dokumen pendukung laporan, jika ada)   │
└─────────────────────────────────────────────────────────┘
```

**Prinsip kunci:** hak akses ditegakkan di **dua lapis** — middleware Next.js untuk pengalaman pengguna (redirect, sembunyikan menu), dan RLS Postgres sebagai lapis pertahanan sesungguhnya. UI tidak pernah menjadi satu-satunya penjaga akses data.

## 3. Struktur Folder (Next.js App Router)

```
app/
├── (auth)/
│   └── login/page.tsx
├── (dashboard)/
│   ├── layout.tsx                 # sidebar & guard berdasarkan role
│   ├── admin/
│   │   ├── page.tsx               # dashboard admin kelurahan
│   │   ├── wilayah/               # kelola master data RW/RT
│   │   ├── pengguna/              # kelola akun RW/RT
│   │   └── laporan-kinerja/
│   ├── rw/
│   │   ├── page.tsx               # dashboard RW
│   │   └── verifikasi/            # verifikasi laporan dari RT
│   └── rt/
│       ├── page.tsx               # dashboard RT
│       └── input/                 # form input 6 jenis laporan
├── laporan/
│   ├── [jenis]/page.tsx           # daftar & filter laporan per jenis
│   └── [id]/page.tsx              # detail satu laporan
├── api/
│   ├── export/pdf/route.ts
│   └── export/excel/route.ts
└── layout.tsx

lib/
├── supabase/
│   ├── client.ts                  # browser client
│   ├── server.ts                  # server client (per-request, RLS aktif)
│   └── middleware.ts
├── actions/                       # Server Actions per domain
│   ├── laporan.actions.ts
│   ├── warga.actions.ts
│   └── wilayah.actions.ts
├── queries/                       # fungsi query terpusat (dashboard, statistik)
└── validations/                   # skema Zod per jenis laporan

components/
├── ui/                            # shadcn primitives
├── dashboard/
│   ├── stat-card.tsx
│   ├── monthly-trend-chart.tsx
│   └── rw-rt-comparison-chart.tsx
├── laporan/
│   ├── form-warga-masuk.tsx
│   ├── form-warga-keluar.tsx
│   ├── form-lahir.tsx
│   ├── form-meninggal.tsx
│   ├── form-pindahan.tsx
│   └── form-perubahan-data.tsx
└── laporan-table.tsx
```

**Alasan pemisahan `lib/actions` dan `lib/queries`:** actions menangani mutasi data (create/update laporan, verifikasi) melalui Server Actions agar validasi & otorisasi terjadi di server sebelum menyentuh database; queries menangani pengambilan data agregat untuk dashboard, dipanggil dari Server Components agar data dashboard dirender di server (lebih cepat, tidak membocorkan query logic ke client).

## 4. Alur Data Utama

### 4.1 Alur Input Laporan (contoh: Warga Masuk)

1. Ketua RT membuka form "Warga Masuk" di `/rt/input`.
2. Form divalidasi di client (Zod schema) untuk validasi cepat (field wajib, format NIK).
3. Submit memanggil Server Action `createLaporanMasuk`.
4. Server Action memvalidasi ulang di server (tidak percaya validasi client saja), memastikan RT pengguna sesuai dengan sesi login (dicegah oleh RLS jika dipalsukan).
5. Data disimpan ke tabel `laporan` dengan `jenis = 'masuk'`, `status = 'diajukan'`, dan baris baru di `warga` jika NIK belum ada.
6. Notifikasi/aktivitas baru muncul di dashboard Ketua RW terkait (melalui Supabase Realtime subscription atau polling ringan pada `laporan` yang berstatus `diajukan`).

### 4.2 Alur Verifikasi Berjenjang

1. Ketua RW membuka daftar laporan `diajukan` dari RT-RT di bawahnya (dibatasi RLS berdasarkan `rw_id`).
2. RW menandai laporan sebagai `diverifikasi` atau `ditolak` (dengan catatan alasan).
3. Status berubah, `verified_by` dan `verified_at` terisi.
4. Laporan yang `diverifikasi` masuk hitungan statistik resmi di dashboard; laporan `diajukan` atau `ditolak` ditampilkan terpisah agar tidak mengganggu angka statistik final.

Lihat `Rules.md` untuk daftar lengkap transisi status yang diperbolehkan.

### 4.3 Alur Dashboard & Statistik

Query agregat (total penduduk, statistik per jenis, tren bulanan) dijalankan sebagai **database view atau function** di Postgres (bukan dihitung di aplikasi), agar:
- Perhitungan konsisten di semua layer (dashboard, export PDF/Excel memakai sumber angka yang sama).
- RLS tetap berlaku otomatis karena view dieksekusi dalam konteks sesi pengguna yang memanggilnya (`security_invoker = true` pada view).

Contoh: view `v_statistik_bulanan` menghasilkan jumlah laporan per jenis per bulan per wilayah, dan otomatis membagi laporan `pindahan` ke kolom "masuk"/"keluar" tambahan sesuai arah (lihat `Schema.md` bagian 4 untuk definisi view ini).

### 4.4 Alur Export

1. Pengguna memilih filter (wilayah, jenis, rentang tanggal) dan menekan "Export PDF" atau "Export Excel".
2. Request dikirim ke Route Handler (`/api/export/pdf` atau `/api/export/excel`) dengan parameter filter.
3. Route Handler menjalankan query yang sama dengan yang dipakai dashboard/tabel laporan (fungsi di `lib/queries` dipakai ulang, bukan ditulis dua kali) menggunakan Supabase server client yang tetap tunduk pada RLS sesi pengguna.
4. Hasil dirender ke PDF (template laporan resmi kelurahan) atau workbook Excel, dikirim sebagai file download.

**Keputusan desain:** export selalu dijalankan di server, bukan generate PDF/Excel di browser. Ini menjamin format cetak konsisten (kop surat kelurahan, tanda tangan digital jika ada) tanpa bergantung pada kemampuan rendering browser pengguna, dan memastikan RLS tetap membatasi data yang bisa diekspor sesuai role.

## 5. Autentikasi & Otorisasi

- Autentikasi memakai Supabase Auth (email + password). Akun dibuat oleh Admin Kelurahan untuk Ketua RW/RT (bukan self-registration), karena keanggotaan RT/RW adalah data administratif resmi.
- Setiap user memiliki baris pendamping di tabel `profiles` yang menyimpan `role`, serta `rt_id`/`rw_id` sesuai cakupannya (detail di `Schema.md`).
- RLS policy di setiap tabel data (warga, laporan) memeriksa `profiles.role` dan `profiles.rt_id/rw_id` milik `auth.uid()` yang sedang login, dibandingkan dengan `rt_id/rw_id` pada baris data yang diakses.
- Next.js middleware membaca sesi Supabase untuk mengarahkan pengguna ke dashboard sesuai role (`/admin`, `/rw`, `/rt`) dan mencegah akses ke rute di luar rolenya di level routing (lapis UX, bukan lapis keamanan utama).

## 6. Skalabilitas & Kesiapan Pengembangan Lanjutan

- **Multi-kelurahan (Asumsi A5 di PRD):** tabel `wilayah`/`rw`/`rt` sudah dirancang dengan `kelurahan_id` sebagai foreign key sejak awal (bukan diasumsikan tunggal secara implisit), sehingga menambah kelurahan kedua di masa depan tidak memerlukan migrasi struktural, hanya menambah baris `kelurahan` baru dan menyesuaikan RLS policy.
- **Penambahan jenis laporan baru:** kolom `detail` pada tabel `laporan` bertipe `jsonb`, menyimpan field spesifik per jenis laporan (misalnya field pindahan berbeda dari field kematian). Menambah jenis laporan baru tidak memerlukan migrasi skema kolom baru, cukup menambah entri enum `jenis_laporan` dan skema validasi Zod baru di frontend.
- **Beban baca dashboard:** karena agregasi dilakukan melalui database view, pertumbuhan data tidak membebani aplikasi Next.js; optimisasi lanjutan (materialized view, caching) dapat ditambahkan tanpa mengubah kontrak API ke frontend.
- **Notifikasi real-time:** arsitektur sudah menyiapkan celah untuk Supabase Realtime pada tabel `laporan`; versi awal dapat memakai polling sederhana dan diupgrade ke subscription realtime tanpa perubahan skema.

**Asumsi A6:** Tidak ada kebutuhan integrasi pihak ketiga (SMS gateway, WhatsApp notifikasi) di versi awal. Jika dibutuhkan, arsitektur ini menyediakan titik ekstensi di Route Handler atau Supabase Edge Function tanpa mengubah struktur inti.
