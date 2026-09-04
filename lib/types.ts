// Tipe-tipe domain utama Sipandu

export type UserRole = 'admin_kelurahan' | 'ketua_rw' | 'ketua_rt'
export type StatusLaporan = 'diajukan' | 'diverifikasi' | 'ditolak'
export type JenisLaporan = 'masuk' | 'keluar' | 'lahir' | 'meninggal' | 'pindahan' | 'perubahan_data'
export type StatusWarga = 'aktif' | 'pindah' | 'meninggal'
export type JenisKelamin = 'L' | 'P'

export interface Kelurahan {
  id: string
  nama: string
  kecamatan: string
  kabupaten_kota: string
  created_at: string
}

export interface RW {
  id: string
  kelurahan_id: string
  nomor: string
  nama_ketua: string | null
  created_at: string
  kelurahan?: Kelurahan
}

export interface RT {
  id: string
  rw_id: string
  nomor: string
  nama_ketua: string | null
  created_at: string
  rw?: RW
}

export interface Profile {
  id: string
  nama: string
  role: UserRole
  kelurahan_id: string | null
  rw_id: string | null
  rt_id: string | null
  is_active: boolean
  created_at: string
  // Relations
  kelurahan?: Kelurahan
  rw?: RW
  rt?: RT
}

export interface Warga {
  id: string
  nik: string
  nama: string
  tempat_lahir: string | null
  tanggal_lahir: string | null
  jenis_kelamin: JenisKelamin
  alamat: string
  rt_id: string
  status: StatusWarga
  created_at: string
  updated_at: string
  rt?: RT
}

export interface Laporan {
  id: string
  jenis: JenisLaporan
  warga_id: string | null
  rt_id: string
  rw_id: string
  rt_asal_id: string | null
  rt_tujuan_id: string | null
  status: StatusLaporan
  detail: Record<string, unknown>
  keterangan: string | null
  created_by: string
  created_at: string
  verified_by: string | null
  verified_at: string | null
  // Relations
  warga?: Warga
  rt?: RT
  rt_asal?: RT
  rt_tujuan?: RT
  creator?: Profile
  verifier?: Profile
}

export interface StatistikBulanan {
  bulan: string
  rw_id: string
  rt_id: string
  jumlah_lahir: number
  jumlah_meninggal: number
  jumlah_masuk_langsung: number
  jumlah_keluar_langsung: number
  jumlah_pindah_masuk: number
  jumlah_pindah_keluar: number
  jumlah_diajukan: number
  total_laporan: number
}

export interface DashboardStats {
  totalPendudukAktif: number
  totalRW: number
  totalRT: number
  totalLaporanDiajukan: number
  totalLaporan: number
  statistikJenis: {
    masuk: number
    keluar: number
    lahir: number
    meninggal: number
    pindahan: number
    perubahan_data: number
  }
  trendBulanan: {
    bulan: string
    masuk: number
    keluar: number
    lahir: number
    meninggal: number
    pindahan: number
  }[]
}

// Label tampilan
export const JENIS_LAPORAN_LABEL: Record<JenisLaporan, string> = {
  masuk: 'Warga Masuk',
  keluar: 'Warga Keluar',
  lahir: 'Kelahiran',
  meninggal: 'Kematian',
  pindahan: 'Pindahan',
  perubahan_data: 'Perubahan Data',
}

export const STATUS_LAPORAN_LABEL: Record<StatusLaporan, string> = {
  diajukan: 'Diajukan',
  diverifikasi: 'Diverifikasi',
  ditolak: 'Ditolak',
}

export const JENIS_KELAMIN_LABEL: Record<JenisKelamin, string> = {
  L: 'Laki-laki',
  P: 'Perempuan',
}
