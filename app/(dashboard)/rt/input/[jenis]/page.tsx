import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/queries/dashboard'
import { FormWargaMasuk } from '@/components/laporan/form-warga-masuk'
import { FormWargaKeluar } from '@/components/laporan/form-warga-keluar'
import { FormLahir } from '@/components/laporan/form-lahir'
import { FormMeninggal } from '@/components/laporan/form-meninggal'
import { FormPindahan } from '@/components/laporan/form-pindahan'
import { FormPerubahanData } from '@/components/laporan/form-perubahan-data'
import type { JenisLaporan } from '@/lib/types'
import { JENIS_LAPORAN_LABEL } from '@/lib/types'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

const VALID_JENIS: JenisLaporan[] = ['masuk', 'keluar', 'lahir', 'meninggal', 'pindahan', 'perubahan_data']

export async function generateMetadata({ params }: { params: Promise<{ jenis: string }> }): Promise<Metadata> {
  const { jenis } = await params
  const label = JENIS_LAPORAN_LABEL[jenis as JenisLaporan] || 'Laporan'
  return { title: `Input Laporan ${label}` }
}

export default async function InputFormPage({ params }: { params: Promise<{ jenis: string }> }) {
  const { jenis } = await params

  if (!VALID_JENIS.includes(jenis as JenisLaporan)) {
    notFound()
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await getCurrentProfile()
  if (!profile || profile.role !== 'ketua_rt' || !profile.rt_id) redirect('/rt')

  // Ambil data warga aktif di RT ini (untuk form yang butuh pilih warga)
  const { data: wargaList } = await supabase
    .from('warga')
    .select('id, nik, nama, jenis_kelamin, tanggal_lahir, alamat')
    .eq('rt_id', profile.rt_id)
    .eq('status', 'aktif')
    .order('nama')

  // Ambil daftar RT lain (untuk pindahan)
  const { data: rtList } = await supabase
    .from('rt')
    .select('id, nomor, rw:rw_id(nomor)')
    .neq('id', profile.rt_id)
    .order('nomor')

  const jenisTyped = jenis as JenisLaporan
  const label = JENIS_LAPORAN_LABEL[jenisTyped]

  const formProps = {
    wargaList: wargaList || [],
    rtList: rtList || [],
    rtId: profile.rt_id,
  }

  return (
    <div className="max-w-2xl space-y-6 animate-fade-in">
      {/* Back */}
      <div className="flex items-center gap-3">
        <Link
          href="/rt/input"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Pilih Jenis Laporan
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className={`text-sm font-medium jenis-${jenis} px-2 py-0.5 rounded-lg border`}>
          {label}
        </span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-foreground">Laporan {label}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          RT {profile.rt?.nomor} — Isi form dengan data yang akurat
        </p>
      </div>

      {jenisTyped === 'masuk' && <FormWargaMasuk />}
      {jenisTyped === 'keluar' && <FormWargaKeluar {...formProps} />}
      {jenisTyped === 'lahir' && <FormLahir />}
      {jenisTyped === 'meninggal' && <FormMeninggal {...formProps} />}
      {jenisTyped === 'pindahan' && <FormPindahan {...formProps} />}
      {jenisTyped === 'perubahan_data' && <FormPerubahanData {...formProps} />}
    </div>
  )
}
