import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import {
  Users, AlertCircle, UserCheck, UserMinus, Baby,
  Heart, ArrowRightLeft, RefreshCw, ClipboardCheck,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getDashboardStats, getLaporanTerbaru, getPerbandinganWilayah, getCurrentProfile } from '@/lib/queries/dashboard'
import { StatCard } from '@/components/dashboard/stat-card'
import { MonthlyTrendChart } from '@/components/dashboard/monthly-trend-chart'
import { WilayahComparisonChart } from '@/components/dashboard/wilayah-comparison-chart'
import { LaporanFeed } from '@/components/dashboard/laporan-feed'

export const metadata: Metadata = { title: 'Dashboard Ketua RW' }

export default async function RWDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await getCurrentProfile()
  if (!profile || profile.role !== 'ketua_rw') redirect('/')

  const [stats, laporanTerbaru, perbandinganRT] = await Promise.all([
    getDashboardStats(undefined, profile.rw_id || undefined),
    getLaporanTerbaru(8),
    getPerbandinganWilayah(profile.rw_id || undefined),
  ])

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard RW {profile.rw?.nomor}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Kelurahan {profile.rw?.kelurahan?.nama} — Data wilayah RW {profile.rw?.nomor}
        </p>
      </div>

      {/* Primary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Penduduk Aktif" value={stats.totalPendudukAktif}
          icon={<Users className="w-5 h-5" />} color="blue" />
        <StatCard title="Total RT" value={stats.totalRT}
          icon={<ClipboardCheck className="w-5 h-5" />} color="purple" />
        <StatCard title="Total Laporan" value={stats.totalLaporan}
          icon={<AlertCircle className="w-5 h-5" />} color="cyan" />
        <StatCard title="Menunggu Verifikasi" value={stats.totalLaporanDiajukan}
          icon={<AlertCircle className="w-5 h-5" />} color="amber"
          subtitle="Perlu tindakan" />
      </div>

      {/* Jenis Laporan */}
      <div>
        <h2 className="text-base font-semibold text-foreground mb-4">Statistik Laporan (Diverifikasi)</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { key: 'masuk', label: 'Masuk', icon: <UserCheck className="w-4 h-4" />, color: 'blue' as const },
            { key: 'keluar', label: 'Keluar', icon: <UserMinus className="w-4 h-4" />, color: 'rose' as const },
            { key: 'lahir', label: 'Lahir', icon: <Baby className="w-4 h-4" />, color: 'emerald' as const },
            { key: 'meninggal', label: 'Meninggal', icon: <Heart className="w-4 h-4" />, color: 'slate' as const },
            { key: 'pindahan', label: 'Pindahan', icon: <ArrowRightLeft className="w-4 h-4" />, color: 'purple' as const },
            { key: 'perubahan_data', label: 'Perubahan', icon: <RefreshCw className="w-4 h-4" />, color: 'cyan' as const },
          ].map(({ key, label, icon, color }) => (
            <StatCard key={key} title={label}
              value={stats.statistikJenis[key as keyof typeof stats.statistikJenis] || 0}
              icon={icon} color={color} />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border p-6">
          <h2 className="text-base font-semibold text-foreground mb-4">Tren Laporan Bulanan</h2>
          <MonthlyTrendChart data={stats.trendBulanan} />
        </div>
        <div className="bg-card rounded-2xl border border-border p-6">
          <h2 className="text-base font-semibold text-foreground mb-4">Perbandingan antar RT</h2>
          <WilayahComparisonChart data={perbandinganRT} title="Perbandingan laporan antar RT" />
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-foreground">Aktivitas Terbaru</h2>
          <a href="/rw/verifikasi" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
            Verifikasi laporan →
          </a>
        </div>
        <LaporanFeed laporan={laporanTerbaru} />
      </div>
    </div>
  )
}
