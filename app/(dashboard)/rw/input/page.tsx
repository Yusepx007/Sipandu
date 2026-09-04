import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/queries/dashboard'
import { UnifiedLaporanFormRW } from '@/components/laporan/unified-laporan-form-rw'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Input Laporan — RW' }

export default async function RWInputLaporanPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await getCurrentProfile()
  if (!profile || profile.role !== 'ketua_rw' || !profile.rw_id) redirect('/rw')

  // Ambil semua RT di RW ini
  const { data: rtList } = await supabase
    .from('rt')
    .select('id, nomor')
    .eq('rw_id', profile.rw_id)
    .order('nomor')

  // Ambil semua warga aktif di RW ini (semua RT)
  const { data: wargaList } = await supabase
    .from('warga')
    .select('id, nik, nama, no_kk, jenis_kelamin, tanggal_lahir, alamat, pekerjaan, status_kawin, pendidikan, agama, nomor_hp, rt_id')
    .in('rt_id', (rtList || []).map(r => r.id))
    .eq('status', 'aktif')
    .order('nama')

  // Ambil semua RT lain (untuk pindahan)
  const { data: allRtList } = await supabase
    .from('rt')
    .select('id, nomor, rw:rw_id(nomor)')
    .order('nomor')

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Input Laporan</h1>
        <p className="text-gray-500 text-sm mt-1">
          RW {profile.rw?.nomor} — Pilih RT dan isi form laporan
        </p>
      </div>

      <UnifiedLaporanFormRW
        rtList={rtList || []}
        allRtList={allRtList || []}
        wargaList={wargaList || []}
      />
    </div>
  )
}
