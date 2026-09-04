# Rules — Sistem Pendataan dan Pelaporan Kependudukan Kelurahan

Dokumen ini mengonsolidasikan aturan bisnis yang mengikat implementasi di seluruh layer (database, server actions, UI), agar tidak ada logika yang saling bertentangan antar dokumen lain.

## 1. Hak Akses per Peran (Ringkasan Operasional)

| Aksi | Admin Kelurahan | Ketua RW | Ketua RT |
|---|---|---|---|
| Input laporan baru | Tidak | Tidak | Ya (hanya untuk RT-nya sendiri) |
| Verifikasi/tolak laporan | Ya (seluruh kelurahan) | Ya (hanya RT di bawah RW-nya) | Tidak |
| Lihat dashboard | Ya (seluruh kelurahan) | Ya (RW-nya saja) | Ya (RT-nya saja) |
| Lihat daftar laporan | Ya (semua) | Ya (RW-nya) | Ya (RT-nya, hanya yang ia buat) |
| Export PDF/Excel | Ya (semua cakupan) | Ya (RW-nya) | Ya (RT-nya) |
| Kelola master data RW/RT | Ya | Tidak | Tidak |
| Kelola akun pengguna | Ya | Tidak | Tidak |

Aturan ini mencerminkan Asumsi A1 di `PRD.md`: RT adalah satu-satunya entry point data warga baru. Jika kebutuhan berubah sehingga RW atau Admin juga perlu input langsung, tabel di atas dan policy RLS `laporan_insert` (`Schema.md` §5) harus direvisi bersamaan.

## 2. Aturan Scoping Data

Setiap query dan mutasi data harus tunduk pada aturan cakupan berikut, ditegakkan di level RLS (bukan hanya dicek di UI/server action):

- **Ketua RT** hanya dapat melihat dan membuat laporan dengan `rt_id` sama dengan `profiles.rt_id` miliknya.
- **Ketua RW** hanya dapat melihat dan memverifikasi laporan dengan `rw_id` sama dengan `profiles.rw_id` miliknya — mencakup seluruh RT di bawah RW tersebut.
- **Admin Kelurahan** tidak dibatasi cakupan wilayah, tetapi tetap dibatasi pada satu `kelurahan_id` (relevan saat sistem berkembang ke multi-kelurahan, lihat `Architecture.md` §6).

**Konsekuensi jika constraint `scope_sesuai_role` gagal ditegakkan** (`Schema.md` §2): seorang pengguna dengan role tapi tanpa `rt_id`/`rw_id` yang sesuai akan gagal dicocokkan oleh semua policy RLS di atas dan efektif tidak bisa melihat data apa pun — ini adalah *fail-safe* yang disengaja (gagal ke arah tertutup, bukan terbuka), sehingga bug pada proses pembuatan akun tidak pernah berakibat kebocoran data ke wilayah lain.

## 3. Mesin Status Laporan

Setiap laporan bergerak melalui status berikut, dengan transisi yang dibatasi ketat:

```
[diajukan] ──verifikasi (oleh RW/Admin)──▶ [diverifikasi]
    │
    └──tolak (oleh RW/Admin, wajib isi alasan)──▶ [ditolak]
```

Aturan mengikat:

1. Laporan selalu dibuat dengan status awal `diajukan` — tidak ada jalur untuk RT membuat laporan yang langsung berstatus `diverifikasi` (mencegah RT melewati proses pengawasan RW, sesuai tujuan sentralisasi data di `PRD.md` §2).
2. Transisi `diajukan → diverifikasi` dan `diajukan → ditolak` hanya dapat dilakukan oleh Ketua RW (untuk RT di bawahnya) atau Admin Kelurahan.
3. Status `diverifikasi` dan `ditolak` bersifat final (lihat Asumsi A9 di `Design.md` §6) — tidak ada transisi balik ke `diajukan`, dan tidak ada transisi antar `diverifikasi` ↔ `ditolak`. Koreksi data pasca-verifikasi dilakukan lewat laporan baru berjenis `perubahan_data`, bukan mengubah status laporan lama.
4. Hanya laporan berstatus `diverifikasi` yang: (a) dihitung dalam statistik dashboard dan laporan kinerja, (b) memicu efek pada tabel `warga` (lihat `Schema.md` §6 — perubahan RT, status pindah/meninggal).

## 4. Aturan Perlakuan Data Pindahan

Merujuk `PRD.md` §4.1 dan `Schema.md` §7, aturan berikut mengikat setiap kali data Pindahan diproses atau ditampilkan:

1. Data mentah laporan `pindahan` **tidak pernah** ditulis ulang menjadi baris `masuk` atau `keluar` di tabel `laporan`. Satu peristiwa pindah = satu baris `pindahan` dengan `rt_asal_id` dan `rt_tujuan_id` terisi.
2. Penggabungan ke kategori Masuk/Keluar **hanya terjadi pada saat query/tampilan statistik** (view `v_statistik_bulanan` di `Schema.md` §7), berdasarkan arah: RT tujuan → kontribusi Masuk; RT asal → kontribusi Keluar.
3. Saat laporan `pindahan` bergerak ke status `diverifikasi`, `rt_id` pada baris `warga` terkait diperbarui menjadi `rt_tujuan_id` (trigger `apply_laporan_effect`, `Schema.md` §6). Warga tersebut sejak saat itu dianggap milik RT tujuan untuk seluruh keperluan scoping (§2), termasuk histori laporan barunya.
4. Laporan resmi dengan filter jenis = "Pindahan" (`PRD.md` §6) **selalu** menampilkan data mentah (satu baris per peristiwa pindah), tidak pernah menampilkan hasil gabungan Masuk/Keluar. Penggabungan hanya berlaku untuk kartu statistik dan grafik dashboard.
5. Pindah ke luar struktur kelurahan ini (ke kelurahan/wilayah lain di luar sistem) dicatat sebagai jenis `keluar`, bukan `pindahan` (Asumsi A3, `PRD.md` §4.1) — pembeda utamanya adalah apakah tujuan memiliki `rt_id` yang valid dalam sistem atau tidak.

## 5. Aturan Konsistensi Data Warga

1. Satu NIK hanya boleh terikat pada satu baris `warga` aktif (`unique` constraint pada `nik`, `Schema.md` §3). Jika warga yang sama dilaporkan "Masuk" dua kali dengan NIK sama, sistem menolak insert dan mengarahkan pengguna untuk memakai jenis laporan yang sesuai (Pindahan jika masih dalam kelurahan, atau Perubahan Data jika hanya detail yang berubah).
2. Warga berstatus `pindah` atau `meninggal` tidak dapat dipilih sebagai subjek laporan baru (kecuali laporan bersifat historis/audit) — combobox pemilihan warga di form input (`Design.md` §5) wajib memfilter `status = 'aktif'`.
3. Perubahan pada field non-status (pekerjaan, status kawin, detail alamat) selalu melalui jenis laporan `perubahan_data`, bukan write langsung ke tabel `warga` oleh siapa pun selain melalui efek trigger yang sah (Asumsi A7, `Schema.md` §5). Ini memastikan setiap perubahan data warga punya jejak laporan yang bisa diaudit siapa pengajunya dan siapa yang memverifikasi.

## 6. Aturan Laporan Kinerja

Merujuk Asumsi A4 (`PRD.md` §6), definisi kinerja yang dipakai dalam perhitungan:

- **Volume:** jumlah laporan yang diajukan per RT/RW dalam periode.
- **Tingkat penyelesaian:** persentase laporan `diajukan` yang berakhir `diverifikasi` (bukan `ditolak` dan bukan masih menggantung) dalam periode tersebut.
- **Kecepatan verifikasi:** rata-rata selisih waktu antara `created_at` dan `verified_at` per RT/RW.

Ketiga metrik ini dihitung ulang setiap kali laporan kinerja digenerate (bukan disimpan sebagai snapshot statis), sehingga selalu mencerminkan data terkini termasuk laporan yang baru diverifikasi setelah periode berjalan tapi sebelum laporan kinerja diambil.

## 7. Aturan Audit

1. Setiap baris `laporan` mencatat `created_by` (wajib) dan `verified_by` (terisi saat status berubah dari `diajukan`). Kedua field ini tidak dapat diubah setelah terisi.
2. Tidak ada fitur hapus (`delete`) untuk baris `laporan` atau `warga` yang telah tercatat, di peran mana pun termasuk Admin. Koreksi kesalahan dilakukan lewat laporan `perubahan_data` (§5) atau, untuk kesalahan input sebelum verifikasi, lewat mekanisme tolak (§3) diikuti pengajuan ulang oleh RT. Ini menjaga riwayat kependudukan tetap utuh untuk keperluan audit dan laporan tahunan.
3. Admin Kelurahan dapat menonaktifkan akun pengguna (Ketua RW/RT), tetapi laporan yang sudah dibuat oleh akun tersebut tetap tersimpan dan tertaut ke `created_by` aslinya (bukan dihapus atau dipindah kepemilikan).
