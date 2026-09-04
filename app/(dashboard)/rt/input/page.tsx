import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/queries/dashboard'
import { UnifiedLaporanForm } from '@/components/laporan/unified-laporan-form'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Input Laporan' }

export default async function InputLaporanPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await getCurrentProfile()
  if (!profile || profile.role !== 'ketua_rt' || !profile.rt_id) redirect('/rt')

  // Ambil warga aktif di RT ini
  const { data: wargaList } = await supabase
    .from('warga')
    .select('id, nik, nama, jenis_kelamin, tanggal_lahir, alamat, pekerjaan, status_kawin, pendidikan, nomor_hp')
    .eq('rt_id', profile.rt_id)
    .eq('status', 'aktif')
    .order('nama')

  // Ambil daftar RT lain (untuk pindahan)
  const { data: rtList } = await supabase
    .from('rt')
    .select('id, nomor, rw:rw_id(nomor)')
    .neq('id', profile.rt_id)
    .order('nomor')

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Input Laporan</h1>
        <p className="text-gray-500 text-sm mt-1">
          RT {profile.rt?.nomor} / RW {profile.rt?.rw?.nomor} — Isi form di bawah dan klik Ajukan
        </p>
      </div>

      <UnifiedLaporanForm
        wargaList={wargaList || []}
        rtList={rtList || []}
        rtId={profile.rt_id}
      />
    </div>
  )
}
