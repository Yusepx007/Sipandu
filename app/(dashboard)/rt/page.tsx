import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import {
  Users, AlertCircle, UserCheck, UserMinus, Baby,
  Heart, ArrowRightLeft, RefreshCw, PlusCircle,
} from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getDashboardStats, getLaporanTerbaru, getCurrentProfile } from '@/lib/queries/dashboard'
import { StatCard } from '@/components/dashboard/stat-card'
import { MonthlyTrendChart } from '@/components/dashboard/monthly-trend-chart'
import { LaporanFeed } from '@/components/dashboard/laporan-feed'

export const metadata: Metadata = { title: 'Dashboard Ketua RT' }

export default async function RTDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await getCurrentProfile()
  if (!profile || profile.role !== 'ketua_rt') redirect('/')

  const [stats, laporanTerbaru] = await Promise.all([
    getDashboardStats(profile.rt_id || undefined),
    getLaporanTerbaru(6),
  ])

  const jenisItems = [
    { key: 'masuk', label: 'Masuk', icon: <UserCheck className="w-4 h-4" />, color: 'blue' as const },
    { key: 'keluar', label: 'Keluar', icon: <UserMinus className="w-4 h-4" />, color: 'rose' as const },
    { key: 'lahir', label: 'Lahir', icon: <Baby className="w-4 h-4" />, color: 'emerald' as const },
    { key: 'meninggal', label: 'Meninggal', icon: <Heart className="w-4 h-4" />, color: 'slate' as const },
    { key: 'pindahan', label: 'Pindahan', icon: <ArrowRightLeft className="w-4 h-4" />, color: 'purple' as const },
    { key: 'perubahan_data', label: 'Perubahan', icon: <RefreshCw className="w-4 h-4" />, color: 'cyan' as const },
  ]

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Dashboard RT {profile.rt?.nomor}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            RW {profile.rt?.rw?.nomor} — Kelurahan {profile.rt?.rw?.kelurahan?.nama}
          </p>
        </div>
        <Link
          href="/rt/input"
          id="btn-input-laporan"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white text-sm font-semibold transition-all shadow-lg shadow-blue-500/20"
        >
          <PlusCircle className="w-4 h-4" />
          Input Laporan Baru
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Warga Aktif" value={stats.totalPendudukAktif}
          icon={<Users className="w-5 h-5" />} color="blue" subtitle="Di RT ini" />
        <StatCard title="Total Laporan" value={stats.totalLaporan}
          icon={<AlertCircle className="w-5 h-5" />} color="cyan" />
        <StatCard title="Menunggu Verifikasi" value={stats.totalLaporanDiajukan}
          icon={<AlertCircle className="w-5 h-5" />} color="amber"
          subtitle="Belum diverifikasi RW" />
        <StatCard title="Laporan Diverifikasi"
          value={stats.totalLaporan - stats.totalLaporanDiajukan}
          icon={<UserCheck className="w-5 h-5" />} color="emerald" />
      </div>

      {/* Jenis */}
      <div>
        <h2 className="text-base font-semibold text-foreground mb-4">Per Jenis Laporan</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {jenisItems.map(({ key, label, icon, color }) => (
            <StatCard key={key} title={label}
              value={stats.statistikJenis[key as keyof typeof stats.statistikJenis] || 0}
              icon={icon} color={color} />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Trend */}
        <div className="lg:col-span-3 bg-card rounded-2xl border border-border p-6">
          <h2 className="text-base font-semibold text-foreground mb-4">Tren Laporan Bulanan</h2>
          <MonthlyTrendChart data={stats.trendBulanan} />
        </div>

        {/* Quick actions */}
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border p-6">
          <h2 className="text-base font-semibold text-foreground mb-4">Aksi Cepat</h2>
          <div className="space-y-2">
            {[
              { href: '/rt/input?jenis=masuk', label: 'Warga Masuk Baru', icon: '↓', color: 'jenis-masuk' },
              { href: '/rt/input?jenis=keluar', label: 'Warga Keluar', icon: '↑', color: 'jenis-keluar' },
              { href: '/rt/input?jenis=lahir', label: 'Laporan Kelahiran', icon: '★', color: 'jenis-lahir' },
              { href: '/rt/input?jenis=meninggal', label: 'Laporan Kematian', icon: '†', color: 'jenis-meninggal' },
              { href: '/rt/input?jenis=pindahan', label: 'Warga Pindahan', icon: '⇄', color: 'jenis-pindahan' },
              { href: '/rt/input?jenis=perubahan_data', label: 'Ubah Data Warga', icon: '✎', color: 'jenis-perubahan_data' },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-colors hover:opacity-90 ${item.color}`}
              >
                <span className="text-base font-bold w-6 text-center">{item.icon}</span>
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-foreground">Laporan Terbaru RT Anda</h2>
          <a href="/laporan/masuk" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
            Lihat semua →
          </a>
        </div>
        <LaporanFeed laporan={laporanTerbaru} />
      </div>
    </div>
  )
}
