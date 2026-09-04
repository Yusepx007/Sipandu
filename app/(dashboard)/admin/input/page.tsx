import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/queries/dashboard'
import { UnifiedLaporanFormRW } from '@/components/laporan/unified-laporan-form-rw'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Input Laporan — Admin Kelurahan' }

export default async function AdminInputLaporanPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await getCurrentProfile()
  if (!profile || profile.role !== 'admin_kelurahan') redirect('/admin')

  // Ambil semua RT di kelurahan beserta info RW
  const { data: rtList } = await supabase
    .from('rt')
    .select('id, nomor, rw:rw_id(nomor)')
    .order('nomor')

  // Ambil semua warga aktif di kelurahan
  const { data: wargaList } = await supabase
    .from('warga')
    .select('id, nik, nama, jenis_kelamin, tanggal_lahir, alamat, pekerjaan, status_kawin, pendidikan, nomor_hp, rt_id')
    .eq('status', 'aktif')
    .order('nama')

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Input Laporan (Admin)</h1>
        <p className="text-gray-500 text-sm mt-1">
          Kelurahan {profile.kelurahan?.nama || ''} — Pilih RT/RW dan isi form laporan
        </p>
      </div>

      <UnifiedLaporanFormRW
        rtList={rtList || []}
        allRtList={rtList || []}
        wargaList={wargaList || []}
        redirectPath="/admin"
      />
    </div>
  )
}
