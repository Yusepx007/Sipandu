import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/queries/dashboard'
import { WilayahClient } from '@/components/admin/wilayah-client'

export const metadata: Metadata = { title: 'Master Wilayah' }

export default async function WilayahPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await getCurrentProfile()
  if (!profile || profile.role !== 'admin_kelurahan') redirect('/admin')

  const { data: rwList } = await supabase
    .from('rw')
    .select('*, rt(*)')
    .order('nomor')

  return (
    <WilayahClient
      rwList={(rwList as unknown as import('@/components/admin/wilayah-client').RWWithRT[]) || []}
      kelurahanNama={profile.kelurahan?.nama || 'Kelurahan'}
    />
  )
}
