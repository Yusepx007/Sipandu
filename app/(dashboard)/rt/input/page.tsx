'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  UserCheck, UserMinus, Baby, Heart, ArrowRightLeft, RefreshCw, ChevronRight
} from 'lucide-react'
import type { JenisLaporan } from '@/lib/types'

const JENIS_OPTIONS: Array<{
  jenis: JenisLaporan
  label: string
  desc: string
  icon: React.ReactNode
  color: string
  bg: string
}> = [
  {
    jenis: 'masuk',
    label: 'Warga Masuk',
    desc: 'Pendataan warga baru yang pindah masuk ke RT ini',
    icon: <UserCheck className="w-6 h-6" />,
    color: 'text-blue-600',
    bg: 'bg-blue-50 border-blue-200 hover:border-blue-500/50 hover:bg-blue-50',
  },
  {
    jenis: 'keluar',
    label: 'Warga Keluar',
    desc: 'Warga yang pindah keluar dari wilayah kelurahan ini',
    icon: <UserMinus className="w-6 h-6" />,
    color: 'text-orange-400',
    bg: 'bg-orange-500/10 border-orange-500/20 hover:border-orange-500/50 hover:bg-orange-500/15',
  },
  {
    jenis: 'lahir',
    label: 'Kelahiran',
    desc: 'Pendataan kelahiran anggota keluarga baru',
    icon: <Baby className="w-6 h-6" />,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50 border-emerald-200 hover:border-emerald-500/50 hover:bg-emerald-50',
  },
  {
    jenis: 'meninggal',
    label: 'Kematian',
    desc: 'Laporan kematian warga yang terdaftar di RT ini',
    icon: <Heart className="w-6 h-6" />,
    color: 'text-slate-400',
    bg: 'bg-slate-500/10 border-slate-500/20 hover:border-slate-500/50 hover:bg-slate-500/15',
  },
  {
    jenis: 'pindahan',
    label: 'Pindahan (Internal)',
    desc: 'Warga yang pindah antar RT/RW dalam kelurahan ini',
    icon: <ArrowRightLeft className="w-6 h-6" />,
    color: 'text-purple-700',
    bg: 'bg-purple-50 border-purple-200 hover:border-purple-500/50 hover:bg-purple-50',
  },
  {
    jenis: 'perubahan_data',
    label: 'Perubahan Data',
    desc: 'Koreksi atau pembaruan data warga yang sudah terdaftar',
    icon: <RefreshCw className="w-6 h-6" />,
    color: 'text-cyan-700',
    bg: 'bg-cyan-500/10 border-cyan-500/20 hover:border-cyan-500/50 hover:bg-cyan-500/15',
  },
]

export default function InputLaporanPage() {
  return (
    <div className="space-y-8 animate-fade-in max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Input Laporan Baru</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Pilih jenis laporan yang ingin dibuat
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {JENIS_OPTIONS.map((opt) => (
          <Link
            key={opt.jenis}
            href={`/rt/input/${opt.jenis}`}
            id={`btn-jenis-${opt.jenis}`}
            className={`group relative flex items-start gap-4 p-5 rounded-2xl border transition-all duration-200 ${opt.bg}`}
          >
            <div className={`flex-shrink-0 p-2.5 rounded-xl bg-card ${opt.color}`}>
              {opt.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`font-semibold text-sm ${opt.color}`}>{opt.label}</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{opt.desc}</p>
            </div>
            <ChevronRight className={`w-4 h-4 flex-shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity ${opt.color}`} />
          </Link>
        ))}
      </div>

      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 text-xs">
        <strong>Catatan:</strong> Laporan yang Anda buat akan berstatus &ldquo;Diajukan&rdquo; dan perlu
        diverifikasi oleh Ketua RW sebelum masuk ke statistik resmi.
      </div>
    </div>
  )
}

