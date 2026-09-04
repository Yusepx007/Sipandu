'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BarChart3, Download, Loader2, TrendingUp, Clock, CheckCircle2 } from 'lucide-react'

interface KinerjaRW {
  rw_id: string
  nomor_rw: string
  total_diajukan: number
  total_diverifikasi: number
  total_ditolak: number
  avg_waktu_verifikasi_jam: number
  tingkat_penyelesaian: number
}

interface LaporanKinerjaClientProps {
  rwList: Array<{ id: string; nomor: string }>
}

const bulanOptions = [
  { value: '1', label: 'Januari' }, { value: '2', label: 'Februari' },
  { value: '3', label: 'Maret' }, { value: '4', label: 'April' },
  { value: '5', label: 'Mei' }, { value: '6', label: 'Juni' },
  { value: '7', label: 'Juli' }, { value: '8', label: 'Agustus' },
  { value: '9', label: 'September' }, { value: '10', label: 'Oktober' },
  { value: '11', label: 'November' }, { value: '12', label: 'Desember' },
]

export function LaporanKinerjaClient({ rwList }: LaporanKinerjaClientProps) {
  const [periode, setPeriode] = useState<'bulanan' | 'tahunan'>('bulanan')
  const [bulan, setBulan] = useState(String(new Date().getMonth() + 1))
  const [tahun, setTahun] = useState(String(new Date().getFullYear()))
  const [filterRw, setFilterRw] = useState('all')
  const [data, setData] = useState<KinerjaRW[]>([])
  const [loading, setLoading] = useState(false)
  const [generated, setGenerated] = useState(false)
  const supabase = createClient()

  async function generateLaporan() {
    setLoading(true)
    try {
      const tahunNum = parseInt(tahun)
      let startDate: string, endDate: string

      if (periode === 'bulanan') {
        const bulanNum = parseInt(bulan)
        startDate = new Date(tahunNum, bulanNum - 1, 1).toISOString()
        endDate = new Date(tahunNum, bulanNum, 0, 23, 59, 59).toISOString()
      } else {
        startDate = new Date(tahunNum, 0, 1).toISOString()
        endDate = new Date(tahunNum, 11, 31, 23, 59, 59).toISOString()
      }

      let query = supabase
        .from('laporan')
        .select('rw_id, status, created_at, verified_at, rt:rt_id(rw:rw_id(nomor))')
        .gte('created_at', startDate)
        .lte('created_at', endDate)

      if (filterRw !== 'all') query = query.eq('rw_id', filterRw)

      const { data: laporan } = await query

      // Group by RW
      const rwMap = new Map<string, KinerjaRW>()

      for (const l of laporan || []) {
        const rw = rwList.find(r => r.id === l.rw_id)
        if (!rw) continue

        if (!rwMap.has(l.rw_id)) {
          rwMap.set(l.rw_id, {
            rw_id: l.rw_id,
            nomor_rw: rw.nomor,
            total_diajukan: 0,
            total_diverifikasi: 0,
            total_ditolak: 0,
            avg_waktu_verifikasi_jam: 0,
            tingkat_penyelesaian: 0,
          })
        }

        const entry = rwMap.get(l.rw_id)!
        entry.total_diajukan++
        if (l.status === 'diverifikasi') {
          entry.total_diverifikasi++
          if (l.verified_at) {
            const diffMs = new Date(l.verified_at as string).getTime() - new Date(l.created_at).getTime()
            entry.avg_waktu_verifikasi_jam += diffMs / (1000 * 60 * 60)
          }
        }
        if (l.status === 'ditolak') entry.total_ditolak++
      }

      const result: KinerjaRW[] = Array.from(rwMap.values()).map(r => ({
        ...r,
        avg_waktu_verifikasi_jam: r.total_diverifikasi > 0
          ? r.avg_waktu_verifikasi_jam / r.total_diverifikasi : 0,
        tingkat_penyelesaian: r.total_diajukan > 0
          ? Math.round((r.total_diverifikasi / r.total_diajukan) * 100) : 0,
      }))

      setData(result.sort((a, b) => parseInt(a.nomor_rw) - parseInt(b.nomor_rw)))
      setGenerated(true)
    } finally {
      setLoading(false)
    }
  }

  async function handleExportExcel() {
    const params = new URLSearchParams({
      periode, bulan, tahun,
      ...(filterRw !== 'all' ? { rw: filterRw } : {}),
    })
    window.open(`/api/export/excel?${params}`, '_blank')
  }

  const totalDiajukan = data.reduce((s, r) => s + r.total_diajukan, 0)
  const totalVerifikasi = data.reduce((s, r) => s + r.total_diverifikasi, 0)
  const avgWaktu = data.length > 0
    ? data.reduce((s, r) => s + r.avg_waktu_verifikasi_jam, 0) / data.length : 0

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Laporan Kinerja</h1>
        <p className="text-muted-foreground text-sm mt-1">Rekap kinerja laporan per RW/RT dalam periode tertentu</p>
      </div>

      {/* Filter */}
      <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Pengaturan Laporan</h2>
        <div className="flex gap-3 flex-wrap">
          {/* Periode */}
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Periode</label>
            <div className="flex gap-2">
              {(['bulanan', 'tahunan'] as const).map((p) => (
                <button key={p} type="button" onClick={() => setPeriode(p)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${periode === p ? 'bg-blue-500/15 border-blue-500/30 text-blue-400' : 'border-border text-muted-foreground hover:border-muted-foreground/50'}`}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {periode === 'bulanan' && (
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Bulan</label>
              <select value={bulan} onChange={e => setBulan(e.target.value)}
                className="px-3 py-2 rounded-lg bg-[hsl(222,40%,12%)] border border-[hsl(222,40%,20%)] text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50">
                {bulanOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Tahun</label>
            <select value={tahun} onChange={e => setTahun(e.target.value)}
              className="px-3 py-2 rounded-lg bg-[hsl(222,40%,12%)] border border-[hsl(222,40%,20%)] text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50">
              {[2023, 2024, 2025, 2026].map(y => <option key={y} value={String(y)}>{y}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Filter RW</label>
            <select value={filterRw} onChange={e => setFilterRw(e.target.value)}
              className="px-3 py-2 rounded-lg bg-[hsl(222,40%,12%)] border border-[hsl(222,40%,20%)] text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50">
              <option value="all">Semua RW</option>
              {rwList.map(rw => <option key={rw.id} value={rw.id}>RW {rw.nomor}</option>)}
            </select>
          </div>
        </div>

        <div className="flex gap-3">
          <button id="btn-generate-kinerja" onClick={generateLaporan} disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-400 disabled:opacity-50 text-white text-sm font-semibold transition-all">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Memproses...</> : <><BarChart3 className="w-4 h-4" />Generate Laporan</>}
          </button>
          {generated && (
            <button id="btn-export-excel" onClick={handleExportExcel}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 text-sm font-semibold transition-all">
              <Download className="w-4 h-4" /> Export Excel
            </button>
          )}
        </div>
      </div>

      {/* Ringkasan */}
      {generated && (
        <>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-card rounded-2xl border border-border p-5">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-blue-400" />
                <span className="text-xs text-muted-foreground">Total Laporan</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{totalDiajukan}</p>
            </div>
            <div className="bg-card rounded-2xl border border-border p-5">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-xs text-muted-foreground">Diverifikasi</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{totalVerifikasi}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {totalDiajukan > 0 ? Math.round((totalVerifikasi / totalDiajukan) * 100) : 0}% dari total
              </p>
            </div>
            <div className="bg-card rounded-2xl border border-border p-5">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span className="text-xs text-muted-foreground">Rata-rata Verifikasi</span>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {avgWaktu < 24 ? `${avgWaktu.toFixed(1)}j` : `${(avgWaktu / 24).toFixed(1)}h`}
              </p>
            </div>
          </div>

          {/* Tabel */}
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <p className="font-semibold text-foreground text-sm">Detail per RW</p>
            </div>
            {data.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground text-sm">Tidak ada data laporan pada periode ini</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {['RW', 'Total Diajukan', 'Diverifikasi', 'Ditolak', 'Belum Diproses', 'Tingkat Selesai', 'Rata-rata Verifikasi'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.map((r) => {
                    const belum = r.total_diajukan - r.total_diverifikasi - r.total_ditolak
                    return (
                      <tr key={r.rw_id} className="hover:bg-accent/50 transition-colors">
                        <td className="px-4 py-3 font-semibold text-foreground">RW {r.nomor_rw}</td>
                        <td className="px-4 py-3 text-foreground">{r.total_diajukan}</td>
                        <td className="px-4 py-3 text-emerald-400">{r.total_diverifikasi}</td>
                        <td className="px-4 py-3 text-rose-400">{r.total_ditolak}</td>
                        <td className="px-4 py-3 text-amber-400">{Math.max(0, belum)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden max-w-20">
                              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${r.tingkat_penyelesaian}%` }} />
                            </div>
                            <span className="text-xs text-muted-foreground">{r.tingkat_penyelesaian}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {r.avg_waktu_verifikasi_jam < 24
                            ? `${r.avg_waktu_verifikasi_jam.toFixed(1)} jam`
                            : `${(r.avg_waktu_verifikasi_jam / 24).toFixed(1)} hari`}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  )
}
