import { createClient } from '@/lib/supabase/server'
import type { DashboardStats, Laporan, Profile } from '@/lib/types'

/**
 * Ambil statistik dashboard berdasarkan role dan scope wilayah pengguna
 */
export async function getDashboardStats(
  filterRtId?: string,
  filterRwId?: string,
  startDate?: string,
  endDate?: string
): Promise<DashboardStats> {
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, rt:rt_id(*), rw:rw_id(*)')
    .single()

  // Base laporan query
  let laporanQuery = supabase
    .from('laporan')
    .select('jenis, status, created_at, rt_id, rw_id')

  if (filterRtId) laporanQuery = laporanQuery.eq('rt_id', filterRtId)
  if (filterRwId) laporanQuery = laporanQuery.eq('rw_id', filterRwId)
  if (startDate) laporanQuery = laporanQuery.gte('created_at', startDate)
  if (endDate) laporanQuery = laporanQuery.lte('created_at', endDate)

  const { data: laporan } = await laporanQuery

  // Statistik warga aktif
  let wargaQuery = supabase
    .from('warga')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'aktif')

  if (filterRtId) wargaQuery = wargaQuery.eq('rt_id', filterRtId)

  const { count: totalPendudukAktif } = await wargaQuery

  // RW dan RT count (hanya untuk admin)
  const { count: totalRW } = await supabase
    .from('rw')
    .select('id', { count: 'exact', head: true })

  const { count: totalRT } = await supabase
    .from('rt')
    .select('id', { count: 'exact', head: true })

  // Hitung statistik dari laporan
  const verified = laporan?.filter((l) => l.status === 'diverifikasi') || []
  const diajukan = laporan?.filter((l) => l.status === 'diajukan') || []

  const statistikJenis = {
    masuk: verified.filter((l) => l.jenis === 'masuk').length,
    keluar: verified.filter((l) => l.jenis === 'keluar').length,
    lahir: verified.filter((l) => l.jenis === 'lahir').length,
    meninggal: verified.filter((l) => l.jenis === 'meninggal').length,
    pindahan: verified.filter((l) => l.jenis === 'pindahan').length,
    perubahan_data: verified.filter((l) => l.jenis === 'perubahan_data').length,
  }

  // Trend bulanan — ambil 12 bulan terakhir
  const trendMap = new Map<string, { masuk: number; keluar: number; lahir: number; meninggal: number; pindahan: number }>()

  const now = new Date()
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    trendMap.set(key, { masuk: 0, keluar: 0, lahir: 0, meninggal: 0, pindahan: 0 })
  }

  for (const l of verified) {
    const date = new Date(l.created_at)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    if (trendMap.has(key)) {
      const entry = trendMap.get(key)!
      if (l.jenis === 'masuk') entry.masuk++
      if (l.jenis === 'keluar') entry.keluar++
      if (l.jenis === 'lahir') entry.lahir++
      if (l.jenis === 'meninggal') entry.meninggal++
      if (l.jenis === 'pindahan') entry.pindahan++
    }
  }

  const trendBulanan = Array.from(trendMap.entries()).map(([bulan, data]) => ({
    bulan,
    ...data,
  }))

  return {
    totalPendudukAktif: totalPendudukAktif || 0,
    totalRW: totalRW || 0,
    totalRT: totalRT || 0,
    totalLaporanDiajukan: diajukan.length,
    totalLaporan: laporan?.length || 0,
    statistikJenis,
    trendBulanan,
  }
}

/**
 * Ambil laporan terbaru untuk feed aktivitas di dashboard
 */
export async function getLaporanTerbaru(limit = 10): Promise<Laporan[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('laporan')
    .select(`
      *,
      warga:warga_id(nik, nama),
      rt:rt_id(nomor, rw:rw_id(nomor)),
      creator:created_by(nama)
    `)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching laporan terbaru:', error)
    return []
  }

  return (data as unknown as Laporan[]) || []
}

/**
 * Ambil data perbandingan antar RW (untuk Admin) atau antar RT (untuk RW)
 */
export async function getPerbandinganWilayah(filterRwId?: string) {
  const supabase = await createClient()

  if (filterRwId) {
    // Perbandingan antar RT di bawah RW tertentu
    const { data: rtList } = await supabase
      .from('rt')
      .select('id, nomor')
      .eq('rw_id', filterRwId)
      .order('nomor')

    if (!rtList) return []

    const results = await Promise.all(
      rtList.map(async (rt) => {
        const { count: totalLaporan } = await supabase
          .from('laporan')
          .select('id', { count: 'exact', head: true })
          .eq('rt_id', rt.id)
          .eq('status', 'diverifikasi')

        const { count: wargaAktif } = await supabase
          .from('warga')
          .select('id', { count: 'exact', head: true })
          .eq('rt_id', rt.id)
          .eq('status', 'aktif')

        return {
          id: rt.id,
          label: `RT ${rt.nomor}`,
          totalLaporan: totalLaporan || 0,
          wargaAktif: wargaAktif || 0,
        }
      })
    )

    return results.sort((a, b) => b.totalLaporan - a.totalLaporan)
  } else {
    // Perbandingan antar RW (untuk Admin)
    const { data: rwList } = await supabase
      .from('rw')
      .select('id, nomor')
      .order('nomor')

    if (!rwList) return []

    const results = await Promise.all(
      rwList.map(async (rw) => {
        const { count: totalLaporan } = await supabase
          .from('laporan')
          .select('id', { count: 'exact', head: true })
          .eq('rw_id', rw.id)
          .eq('status', 'diverifikasi')

        const { count: wargaAktif } = await supabase
          .from('warga')
          .select('id', { count: 'exact', head: true })
          .in('rt_id', 
            (await supabase.from('rt').select('id').eq('rw_id', rw.id)).data?.map(r => r.id) || []
          )
          .eq('status', 'aktif')

        return {
          id: rw.id,
          label: `RW ${rw.nomor}`,
          totalLaporan: totalLaporan || 0,
          wargaAktif: wargaAktif || 0,
        }
      })
    )

    return results.sort((a, b) => b.totalLaporan - a.totalLaporan)
  }
}

/**
 * Ambil profile pengguna yang sedang login
 */
export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('profiles')
    .select('*, rt:rt_id(*, rw:rw_id(*, kelurahan:kelurahan_id(*))), rw:rw_id(*, kelurahan:kelurahan_id(*)), kelurahan:kelurahan_id(*)')
    .eq('id', user.id)
    .single()

  return data as unknown as Profile
}
