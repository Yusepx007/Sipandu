import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/queries/dashboard'
import { LaporanKinerjaClient } from '@/components/admin/laporan-kinerja-client'

export const metadata: Metadata = { title: 'Laporan Kinerja' }

export default async function LaporanKinerjaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await getCurrentProfile()
  if (!profile || profile.role !== 'admin_kelurahan') redirect('/admin')

  // Ambil semua RW untuk filter
  const { data: rwList } = await supabase.from('rw').select('id, nomor').order('nomor')

  return (
    <LaporanKinerjaClient rwList={rwList || []} />
  )
}
