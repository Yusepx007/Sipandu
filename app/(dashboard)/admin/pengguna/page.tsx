import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/queries/dashboard'
import { PenggunaClient } from '@/components/admin/pengguna-client'

export const metadata: Metadata = { title: 'Kelola Pengguna' }

export default async function PenggunaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await getCurrentProfile()
  if (!profile || profile.role !== 'admin_kelurahan') redirect('/admin')

  const { data: penggunaList } = await supabase
    .from('profiles')
    .select('*, rt:rt_id(nomor, rw:rw_id(nomor)), rw:rw_id(nomor)')
    .neq('id', user.id) // Jangan tampilkan admin sendiri
    .order('role')
    .order('created_at')

  const { data: rwList } = await supabase.from('rw').select('id, nomor').order('nomor')
  const { data: rtList } = await supabase
    .from('rt')
    .select('id, nomor, rw:rw_id(nomor)')
    .order('nomor')

  return (
    <PenggunaClient
      penggunaList={(penggunaList as unknown as import('@/lib/types').Profile[]) || []}
      rwList={rwList || []}
      rtList={(rtList as unknown as Array<{ id: string; nomor: string; rw?: { nomor?: string } }>) || []}
    />
  )
}
