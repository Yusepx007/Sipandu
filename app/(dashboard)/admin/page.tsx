import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import {
  Users, Building2, MapPin, FileText, AlertCircle,
  UserCheck, UserMinus, Baby, Heart, ArrowRightLeft, RefreshCw,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getDashboardStats, getLaporanTerbaru, getPerbandinganWilayah, getCurrentProfile } from '@/lib/queries/dashboard'
import { StatCard } from '@/components/dashboard/stat-card'
import { MonthlyTrendChart } from '@/components/dashboard/monthly-trend-chart'
import { WilayahComparisonChart } from '@/components/dashboard/wilayah-comparison-chart'
import { LaporanFeed } from '@/components/dashboard/laporan-feed'
import { JENIS_LAPORAN_LABEL } from '@/lib/types'
import { formatWaktuRelatif } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Dashboard Admin Kelurahan',
}

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await getCurrentProfile()
  if (!profile || profile.role !== 'admin_kelurahan') redirect('/')

  const [stats, laporanTerbaru, perbandinganRW] = await Promise.all([
    getDashboardStats(),
    getLaporanTerbaru(8),
    getPerbandinganWilayah(),
  ])

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard Kelurahan</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Kelurahan {profile.kelurahan?.nama} — Ringkasan data kependudukan
        </p>
      </div>

      {/* Primary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Penduduk Aktif"
          value={stats.totalPendudukAktif}
          icon={<Users className="w-5 h-5" />}
          color="blue"
          subtitle="Warga terdaftar aktif"
        />
        <StatCard
          title="Total RW"
          value={stats.totalRW}
          icon={<Building2 className="w-5 h-5" />}
          color="purple"
          subtitle="Rukun Warga"
        />
        <StatCard
          title="Total RT"
          value={stats.totalRT}
          icon={<MapPin className="w-5 h-5" />}
          color="cyan"
          subtitle="Rukun Tetangga"
        />
        <StatCard
          title="Laporan Diajukan"
          value={stats.totalLaporanDiajukan}
          icon={<AlertCircle className="w-5 h-5" />}
          color="amber"
          subtitle="Menunggu verifikasi"
        />
      </div>

      {/* Jenis Laporan Stats */}
      <div>
        <h2 className="text-base font-semibold text-foreground mb-4">Statistik Laporan (Diverifikasi)</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { key: 'masuk', label: 'Warga Masuk', icon: <UserCheck className="w-4 h-4" />, color: 'blue' as const },
            { key: 'keluar', label: 'Warga Keluar', icon: <UserMinus className="w-4 h-4" />, color: 'rose' as const },
            { key: 'lahir', label: 'Kelahiran', icon: <Baby className="w-4 h-4" />, color: 'emerald' as const },
            { key: 'meninggal', label: 'Kematian', icon: <Heart className="w-4 h-4" />, color: 'slate' as const },
            { key: 'pindahan', label: 'Pindahan', icon: <ArrowRightLeft className="w-4 h-4" />, color: 'purple' as const },
            { key: 'perubahan_data', label: 'Perubahan Data', icon: <RefreshCw className="w-4 h-4" />, color: 'cyan' as const },
          ].map(({ key, label, icon, color }) => (
            <StatCard
              key={key}
              title={label}
              value={stats.statistikJenis[key as keyof typeof stats.statistikJenis] || 0}
              icon={icon}
              color={color}
              className="col-span-1"
            />
          ))}
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Chart */}
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border p-6">
          <h2 className="text-base font-semibold text-foreground mb-4">Tren Laporan Bulanan</h2>
          <MonthlyTrendChart data={stats.trendBulanan} />
        </div>

        {/* Perbandingan RW */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <h2 className="text-base font-semibold text-foreground mb-4">Perbandingan antar RW</h2>
          <WilayahComparisonChart data={perbandinganRW} title="Perbandingan laporan antar RW" />
        </div>
      </div>

      {/* Laporan Terbaru */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-foreground">Aktivitas Terbaru</h2>
          <a href="/laporan/masuk" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
            Lihat semua →
          </a>
        </div>
        <LaporanFeed laporan={laporanTerbaru} />
      </div>
    </div>
  )
}
