# PRD — Sistem Pendataan dan Pelaporan Kependudukan Kelurahan

## 1. Latar Belakang

Pendataan kependudukan di tingkat kelurahan saat ini masih dijalankan secara manual: RT mencatat warga masuk, keluar, lahir, meninggal, dan pindah di buku atau spreadsheet lokal, lalu menyerahkan rekap ke RW, dan RW meneruskannya ke kelurahan dalam bentuk dokumen cetak atau file terpisah-pisah.

Pola ini menimbulkan tiga masalah operasional yang konsisten:

- **Lambat.** Data harus melewati tiga lapis manual (RT → RW → Kelurahan) sebelum bisa dibaca sebagai gambaran utuh. Rekap bulanan sering baru selesai di minggu ketiga bulan berikutnya.
- **Rawan kesalahan.** Format pencatatan berbeda antar RT, sehingga terjadi duplikasi data (warga yang sama tercatat dua kali karena pindah antar RT), data yang tertinggal, atau angka rekap yang tidak konsisten antara laporan RT dan RW.
- **Tidak bisa dianalisis.** Karena data tersebar di banyak file/dokumen fisik, kelurahan tidak punya cara cepat untuk melihat tren (misalnya lonjakan warga pindah di satu RW) atau menyusun laporan kinerja tanpa rekap manual ulang.

Sistem ini dibangun untuk memindahkan seluruh proses pencatatan ke satu platform terpusat, sehingga data selalu konsisten, real-time, dan siap diolah menjadi laporan maupun dashboard analitik.

## 2. Tujuan Sistem

1. **Digitalisasi pendataan** — RT dan RW menginput laporan langsung ke sistem, menggantikan pencatatan manual di buku/spreadsheet.
2. **Sentralisasi data** — Satu sumber data tunggal (single source of truth) untuk seluruh kelurahan, RW, dan RT, sehingga tidak ada lagi rekap ganda atau selisih angka antar tingkat.
3. **Output berbasis analitik** — Prioritas sistem bukan sekadar mencatat, tetapi menyajikan data itu dalam bentuk dashboard, statistik, dan laporan kinerja yang siap dipakai untuk pengambilan keputusan kelurahan.

**Bukan tujuan sistem (out of scope untuk versi ini):**
- Integrasi langsung dengan Dukcapil/data kependudukan nasional (NIK tetap dicatat sebagai identifier, tetapi tidak ada verifikasi otomatis ke database pemerintah).
- Layanan surat-menyurat warga (surat pengantar, SKTM, dsb.) — sistem ini fokus pada pendataan dan pelaporan, bukan administrasi persuratan.
- Aplikasi mobile native. Versi awal adalah web responsif.

## 3. Pengguna Sistem dan Hak Akses

| Peran | Cakupan Data | Hak Akses Utama |
|---|---|---|
| **Admin Kelurahan** | Seluruh kelurahan (semua RW/RT) | Melihat & mengelola seluruh data, memverifikasi laporan, mengelola akun RW/RT, mengakses seluruh dashboard dan laporan (kelurahan/RW/RT), export PDF/Excel, mengelola master data wilayah (RW/RT) |
| **Ketua RW** | Seluruh RT di bawah RW-nya | Melihat & memverifikasi laporan dari RT di wilayahnya, melihat dashboard & statistik tingkat RW, export laporan tingkat RW dan RT di bawahnya |
| **Ketua RT** | Warga di RT-nya sendiri | Menginput laporan (masuk, keluar, lahir, meninggal, pindah, perubahan data), melihat dashboard & statistik tingkat RT-nya sendiri, export laporan RT sendiri |

**Asumsi A1:** Ketua RT adalah entry point utama data warga (input laporan pertama kali dilakukan di level RT). Ketua RW dan Admin Kelurahan berperan sebagai verifikator/pengawas berjenjang, bukan penginput data warga baru. Dampak: alur verifikasi berjenjang (RT input → RW verifikasi → status final) perlu diperjelas di Rules.md; jika asumsi ini salah dan RW/Admin juga boleh input langsung, hak akses input perlu diperluas.

**Asumsi A2:** Satu akun pengguna hanya terikat pada satu wilayah (satu RT untuk Ketua RT, satu RW untuk Ketua RW). Kasus satu orang menjabat ketua di lebih dari satu wilayah tidak didukung di versi awal.

## 4. Jenis Laporan

Sistem mencatat enam jenis laporan kependudukan:

1. **Warga Masuk** — warga baru yang pindah masuk ke RT/RW/kelurahan ini.
2. **Warga Keluar** — warga yang keluar dari wilayah kelurahan ini menuju wilayah lain (bukan karena meninggal).
3. **Lahir** — kelahiran warga baru yang tercatat sebagai bagian dari keluarga di RT tersebut.
4. **Meninggal** — kematian warga, yang akan mengubah status warga menjadi tidak aktif.
5. **Pindahan** — perpindahan warga *di dalam* cakupan administratif kelurahan (misalnya pindah rumah dari RT 01 ke RT 03 dalam kelurahan yang sama, atau pindah antar RW dalam kelurahan yang sama).
6. **Perubahan Data** — koreksi/pembaruan data warga yang sudah tercatat (misalnya perubahan status pekerjaan, status kawin, alamat detail) tanpa mengubah status kependudukannya.

### 4.1 Perlakuan Khusus: Data Pindahan

Laporan **Pindahan** selalu dicatat sebagai kategori tersendiri di database — tidak pernah ditulis ulang sebagai "Masuk" atau "Keluar" pada level data mentah. Ini penting agar riwayat pergerakan warga di dalam kelurahan tetap bisa dilacak secara akurat.

Namun demikian, **untuk kebutuhan dashboard statistik**, laporan Pindahan dapat digabungkan ke kategori Masuk atau Keluar berdasarkan arah perpindahannya:
- Pindahan dengan **RT/RW tujuan** = wilayah yang sedang dilihat → dihitung sebagai kontribusi ke statistik **Masuk** wilayah tersebut.
- Pindahan dengan **RT/RW asal** = wilayah yang sedang dilihat → dihitung sebagai kontribusi ke statistik **Keluar** wilayah tersebut.

Contoh: Warga pindah dari RT 02 ke RT 05 (masih satu kelurahan). Data tersimpan sebagai satu baris laporan `pindahan` dengan `rt_asal_id = RT02` dan `rt_tujuan_id = RT05`. Saat Admin melihat dashboard RT 05, laporan ini muncul sebagai +1 pada statistik "masuk". Saat melihat dashboard RT 02, laporan yang sama muncul sebagai +1 pada statistik "keluar". Pada laporan resmi jenis "Pindahan", data ini tetap tampil sebagai satu entri pindahan, bukan dua entri masuk/keluar terpisah.

**Asumsi A3:** Pindah *keluar dari kelurahan ini menuju kelurahan lain* dicatat sebagai jenis **Warga Keluar** (bukan Pindahan), karena tujuan tidak berada dalam struktur RT/RW yang dikelola sistem ini. Jenis **Pindahan** khusus untuk perpindahan RT/RW yang masih dalam satu kelurahan yang sama.

## 5. Kebutuhan Fungsional — Dashboard

Dashboard Admin Kelurahan wajib menampilkan:

- Kartu ringkasan: total penduduk aktif, total RW, total RT, total laporan (seluruh jenis, seluruh waktu atau per periode filter).
- Statistik per jenis laporan: jumlah Masuk, Keluar, Lahir, Meninggal, Pindahan pada periode berjalan (dengan filter rentang tanggal).
- Grafik tren bulanan (line/bar chart) untuk melihat pola pertumbuhan/penyusutan penduduk sepanjang tahun.
- Perbandingan antar RW dan antar RT (bar chart horizontal) untuk melihat wilayah dengan aktivitas laporan tertinggi/terendah.
- Daftar aktivitas dan laporan terbaru (feed laporan yang baru masuk/diverifikasi, dengan status dan wilayah asal).

Dashboard Ketua RW dan Ketua RT menampilkan struktur yang sama, tetapi data dibatasi (scoped) sesuai cakupan wilayah masing-masing (lihat Rules.md untuk aturan scoping).

## 6. Kebutuhan Fungsional — Laporan (Reporting)

Sistem menyediakan laporan yang dapat difilter dan diekspor:

- **Berdasarkan cakupan wilayah:** per kelurahan (seluruh data), per RW, per RT.
- **Berdasarkan jenis laporan:** salah satu dari enam jenis di atas, atau gabungan.
- **Laporan kinerja bulanan dan tahunan:** rekap jumlah laporan yang diproses per RT/RW dalam periode tersebut, dibandingkan dengan periode sebelumnya, sebagai indikator aktivitas administrasi tiap wilayah.

**Asumsi A4:** "Laporan kinerja" pada tahap ini didefinisikan sebagai rekap kuantitas dan kecepatan pemrosesan laporan (jumlah laporan diajukan vs. diverifikasi, rata-rata waktu verifikasi) per RT/RW per periode — bukan penilaian kualitatif kinerja pengurus. Jika kelurahan membutuhkan indikator kinerja lain (misalnya kepatuhan pelaporan tepat waktu terhadap target), definisi ini perlu direvisi bersama pengguna.

Semua laporan dapat diekspor ke **PDF** (untuk keperluan cetak/arsip resmi) dan **Excel** (untuk keperluan olah data lanjutan).

## 7. Kebutuhan Non-Fungsional

- **Keamanan akses:** setiap peran hanya bisa melihat/mengubah data sesuai cakupan wilayahnya (ditegakkan di level database melalui Row-Level Security, bukan hanya di UI).
- **Auditability:** setiap laporan mencatat siapa yang membuat dan siapa yang memverifikasi, beserta waktunya.
- **Ketersediaan:** sistem web, dapat diakses dari perangkat desktop maupun mobile browser oleh RT/RW yang kemungkinan besar mengakses dari HP.
- **Skalabilitas:** desain data dan arsitektur harus tetap relevan bila kelurahan menambah jumlah RW/RT atau bila sistem ini nantinya digunakan oleh kelurahan lain (multi-tenant), meski multi-tenant bukan kebutuhan versi awal (lihat Asumsi A5).

**Asumsi A5:** Versi awal sistem melayani **satu kelurahan** (single-tenant). Struktur data dirancang agar mudah diperluas ke multi-kelurahan di masa depan (lihat Architecture.md), tetapi fitur pemilihan/pemisahan antar kelurahan tidak dibangun di versi ini.

## 8. Metrik Keberhasilan

- Waktu penyusunan rekap bulanan kelurahan turun dari hitungan minggu menjadi hitungan hari (idealnya real-time melalui dashboard).
- Selisih data antara laporan RT, RW, dan Kelurahan menjadi nol, karena seluruhnya bersumber dari satu database yang sama.
- Admin kelurahan dapat menghasilkan laporan kinerja bulanan/tahunan tanpa proses rekap manual, cukup melalui fitur export.
