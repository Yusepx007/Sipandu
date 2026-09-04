import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/login')
  }

  switch (profile.role) {
    case 'admin_kelurahan':
      redirect('/admin')
    case 'ketua_rw':
      redirect('/rw')
    case 'ketua_rt':
      redirect('/rt')
    default:
      redirect('/login')
  }
}

