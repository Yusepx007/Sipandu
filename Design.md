# Design — Sistem Pendataan dan Pelaporan Kependudukan Kelurahan

Dokumen ini menjabarkan desain antarmuka dan pengalaman pengguna, konsisten dengan peran dan hak akses di `PRD.md` §3, serta struktur data di `Schema.md`.

## 1. Prinsip Desain

- **Kecepatan input di atas segalanya untuk Ketua RT.** Sebagian besar pengguna RT mengisi data dari HP, sering di sela aktivitas lain. Form input harus pendek per langkah, dengan validasi instan, dan tidak memaksa pengisian field yang bisa diisi kemudian.
- **Kepercayaan angka di atas segalanya untuk Admin/RW.** Dashboard adalah alasan utama sistem ini dibangun (lihat PRD.md §2). Setiap angka yang tampil harus bisa ditelusuri ke laporan sumbernya (drill-down), bukan sekadar angka statis.
- **Konsistensi komponen lewat shadcn/ui.** Tabel, form, dialog, badge status memakai primitives shadcn yang sama di seluruh peran, sehingga pengguna yang berpindah peran (jarang, tapi mungkin terjadi saat admin membantu RT) tidak perlu belajar pola UI baru.

## 2. Design Tokens

Mengikuti default shadcn/ui dengan penyesuaian warna semantik untuk status laporan dan jenis laporan, agar konsisten di badge, chart, dan indikator dashboard:

| Token | Penggunaan | Warna |
|---|---|---|
| `--status-diajukan` | Badge status "Diajukan" | Amber (menunggu tindakan) |
| `--status-diverifikasi` | Badge status "Diverifikasi" | Emerald (selesai/valid) |
| `--status-ditolak` | Badge status "Ditolak" | Rose |
| `--jenis-masuk` | Chart/badge jenis Masuk | Blue |
| `--jenis-keluar` | Chart/badge jenis Keluar | Orange |
| `--jenis-lahir` | Chart/badge jenis Lahir | Green |
| `--jenis-meninggal` | Chart/badge jenis Meninggal | Slate |
| `--jenis-pindahan` | Chart/badge jenis Pindahan | Purple |
| `--jenis-perubahan-data` | Chart/badge jenis Perubahan Data | Cyan |

Warna ini dipakai konsisten di legend chart Recharts dan badge tabel, sehingga pengguna mengenali jenis laporan dari warna tanpa harus membaca label setiap kali.

## 3. Peta Halaman per Peran

### 3.1 Admin Kelurahan
- `/admin` — Dashboard utama (lihat §4).
- `/admin/wilayah` — Kelola master data RW dan RT (tambah/ubah RW, tambah/ubah RT di bawah RW).
- `/admin/pengguna` — Kelola akun Ketua RW dan Ketua RT (buat akun, reset password, nonaktifkan).
- `/admin/laporan-kinerja` — Generator laporan kinerja bulanan/tahunan (lihat §6).
- `/laporan/[jenis]` — Daftar seluruh laporan kelurahan per jenis, dengan filter wilayah dan tanggal.

### 3.2 Ketua RW
- `/rw` — Dashboard RW (lihat §4, data ter-scope ke RW-nya).
- `/rw/verifikasi` — Antrean laporan berstatus "Diajukan" dari seluruh RT di bawah RW-nya, dengan aksi Verifikasi/Tolak.
- `/laporan/[jenis]` — Daftar laporan, ter-scope ke RW-nya.

### 3.3 Ketua RT
- `/rt` — Dashboard RT (lihat §4, data ter-scope ke RT-nya).
- `/rt/input` — Form input laporan baru, dengan pilihan enam jenis laporan.
- `/laporan/[jenis]` — Daftar laporan yang pernah diinput RT ini, termasuk status verifikasinya.

## 4. Layout Dashboard

Struktur dashboard sama di ketiga peran, hanya cakupan datanya berbeda:

```
┌───────────────────────────────────────────────────────┐
│ [Filter: Rentang Tanggal ▾]  [Filter: Wilayah ▾ (Admin/RW)] │
├───────────────────────────────────────────────────────┤
│  [Kartu] Total Penduduk   [Kartu] Total RT/RW (Admin)   │
│  [Kartu] Total Laporan    [Kartu] Laporan Diajukan       │
├───────────────────────────────────────────────────────┤
│  [Kartu Statistik] Masuk | Keluar | Lahir | Meninggal    │
│                     | Pindahan                            │
├───────────────────────────────────────────────────────┤
│  [Grafik Tren Bulanan — line chart, semua jenis]         │
├───────────────────────────────────────────────────────┤
│  [Grafik Perbandingan RW/RT — bar chart horizontal]      │
│  (khusus Admin: perbandingan antar RW;                    │
│   khusus RW: perbandingan antar RT di bawahnya)           │
├───────────────────────────────────────────────────────┤
│  [Tabel] Aktivitas & Laporan Terbaru (5-10 baris terakhir)│
└───────────────────────────────────────────────────────┘
```

- Filter wilayah **tidak muncul** untuk Ketua RT (cakupannya sudah tetap pada satu RT).
- Kartu statistik jenis laporan bisa diklik untuk drill-down ke `/laporan/[jenis]` dengan filter wilayah & tanggal yang sama otomatis terisi — menjaga prinsip "setiap angka bisa ditelusuri" di §1.
- Grafik tren bulanan memakai Recharts `LineChart` dengan satu garis per jenis laporan, warna sesuai token di §2.
- Grafik perbandingan RW/RT memakai Recharts `BarChart` horizontal, diurutkan dari wilayah dengan jumlah laporan tertinggi.

## 5. Alur Input Laporan (Ketua RT)

Form input di `/rt/input` menggunakan pola dua langkah untuk menjaga kecepatan (prinsip §1):

**Langkah 1 — Pilih Jenis Laporan.** Enam kartu pilihan besar (Masuk, Keluar, Lahir, Meninggal, Pindahan, Perubahan Data), masing-masing dengan ikon dan warna sesuai token §2.

**Langkah 2 — Form sesuai jenis.** Field berbeda per jenis (lihat `Schema.md` §4.1 untuk field detail):

| Jenis | Field Utama | Field di `detail` |
|---|---|---|
| Masuk | NIK, Nama, Tgl Lahir, Jenis Kelamin, Alamat | Alamat asal, NIK kepala keluarga |
| Keluar | Pilih warga existing (autocomplete NIK/nama) | Alamat tujuan, kota tujuan |
| Lahir | NIK (opsional saat lahir), Nama, Tgl Lahir, Jenis Kelamin | Nama ayah, nama ibu |
| Meninggal | Pilih warga existing | Tanggal meninggal, penyebab (opsional) |
| Pindahan | Pilih warga existing, Pilih RT tujuan (dropdown, exclude RT asal) | Alasan pindah |
| Perubahan Data | Pilih warga existing, field yang diubah | Nilai lama (auto-terisi), nilai baru |

Untuk jenis yang memilih "warga existing" (Keluar, Meninggal, Pindahan, Perubahan Data), komponen menggunakan combobox pencarian by NIK/nama yang otomatis dibatasi ke warga dengan `status = 'aktif'` dan `rt_id` sesuai RT pengguna (ditegakkan RLS di `Schema.md` §5, bukan hanya filter UI).

Setelah submit, pengguna melihat konfirmasi status "Diajukan — menunggu verifikasi RW" dan laporan langsung muncul di daftar `/laporan/[jenis]` miliknya dengan badge status Amber.

## 6. Alur Verifikasi (Ketua RW)

`/rw/verifikasi` menampilkan tabel laporan `status = 'diajukan'` dari RT-RT di bawah RW-nya, dengan kolom: Jenis, Nama Warga, RT Asal, Tanggal Diajukan, Aksi.

Klik baris membuka panel detail (sheet/dialog shadcn) menampilkan seluruh field laporan termasuk isi `detail`, dengan dua tombol: **Verifikasi** (mengubah status ke `diverifikasi`, memicu trigger di `Schema.md` §6) dan **Tolak** (wajib mengisi alasan penolakan, disimpan di `keterangan`).

**Asumsi A9:** Penolakan laporan (`ditolak`) bersifat final untuk baris laporan tersebut — RT yang laporannya ditolak harus mengajukan laporan baru, bukan mengedit laporan yang ditolak. Ini menjaga jejak audit tetap sederhana (satu baris = satu keputusan), dengan konsekuensi RT perlu mengisi ulang form jika terjadi kesalahan data.

## 7. Halaman Laporan Kinerja (Admin)

`/admin/laporan-kinerja` menyediakan:
- Pilihan periode: Bulanan (pilih bulan+tahun) atau Tahunan (pilih tahun).
- Tabel per RW (atau drill-down per RT) menampilkan: jumlah laporan diajukan, jumlah diverifikasi, jumlah ditolak, rata-rata waktu verifikasi (selisih `verified_at` - `created_at`).
- Tombol **Export PDF** (format laporan resmi dengan kop kelurahan) dan **Export Excel** (data mentah untuk diolah lebih lanjut), sesuai alur di `Architecture.md` §4.4.

## 8. Aksesibilitas & Responsif

- Semua form input memakai label eksplisit (bukan hanya placeholder) agar kompatibel dengan screen reader dan tetap jelas saat placeholder hilang setelah diisi.
- Target sentuh (tombol, kartu pilihan jenis laporan) minimal 44x44px mengikuti guideline shadcn/Tailwind, mengingat mayoritas Ketua RT mengakses lewat HP (PRD.md §7).
- Tabel laporan beralih ke tampilan kartu bertumpuk (stacked card) di breakpoint mobile, bukan tabel horizontal-scroll, agar tetap terbaca tanpa geser layar.
- Grafik Recharts diberi `aria-label` ringkasan tren (misalnya "Tren bulanan menunjukkan kenaikan warga masuk sejak Maret") sebagai teks alternatif untuk pembaca layar, karena grafik SVG tidak otomatis terbaca oleh screen reader.
