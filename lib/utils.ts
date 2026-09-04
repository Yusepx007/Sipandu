import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { JenisLaporan, StatusLaporan } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTanggal(dateStr: string | null | undefined): string {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

export function formatTanggalPendek(dateStr: string | null | undefined): string {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export function formatBulan(dateStr: string): string {
  const date = new Date(dateStr)
  return new Intl.DateTimeFormat('id-ID', {
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export function formatWaktuRelatif(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSecs < 60) return 'baru saja'
  if (diffMins < 60) return `${diffMins} menit lalu`
  if (diffHours < 24) return `${diffHours} jam lalu`
  if (diffDays < 7) return `${diffDays} hari lalu`
  return formatTanggalPendek(dateStr)
}

export function getJenisColor(jenis: JenisLaporan): string {
  const colors: Record<JenisLaporan, string> = {
    masuk: '#3b82f6',
    keluar: '#f97316',
    lahir: '#22c55e',
    meninggal: '#94a3b8',
    pindahan: '#a855f7',
    perubahan_data: '#06b6d4',
  }
  return colors[jenis] || '#94a3b8'
}

export function getStatusColor(status: StatusLaporan): string {
  const colors: Record<StatusLaporan, string> = {
    diajukan: '#f59e0b',
    diverifikasi: '#10b981',
    ditolak: '#f43f5e',
  }
  return colors[status]
}

export function getNIKInfo(nik: string): { provinsi: string; lahir: string; jenisKelamin: string } | null {
  if (nik.length !== 16) return null
  const tglKode = nik.substring(6, 8)
  const bln = nik.substring(8, 10)
  const thn = nik.substring(10, 12)
  const tgl = parseInt(tglKode)
  const jenisKelamin = tgl > 40 ? 'Perempuan' : 'Laki-laki'
  const tglAktual = tgl > 40 ? tgl - 40 : tgl
  return {
    provinsi: nik.substring(0, 2),
    lahir: `${String(tglAktual).padStart(2, '0')}/${bln}/${thn}`,
    jenisKelamin,
  }
}
