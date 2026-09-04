'use server'

import { createClient } from '@/lib/supabase/server'
import { createServerClient } from '@supabase/ssr'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'

export async function createPenggunaRW(formData: FormData) {
  try {
    const email = formData.get('email') as string
    const nama = formData.get('nama') as string
    const password = formData.get('password') as string
    const rw_id = formData.get('rw_id') as string
    const nama_ketua = formData.get('nama_ketua') as string

    if (!email || !nama || !password || !rw_id) return { error: 'Semua field wajib diisi' }
    if (password.length < 8) return { error: 'Password minimal 8 karakter' }

    const supabase = await createClient()
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) return { error: 'Tidak terautentikasi' }

    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('role, kelurahan_id')
      .eq('id', currentUser.id)
      .single()

    if (!adminProfile || adminProfile.role !== 'admin_kelurahan') {
      return { error: 'Hanya Admin Kelurahan yang dapat membuat akun' }
    }

    // Buat user via Admin API menggunakan service role key
    const cookieStore = await cookies()
    const adminSupabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    )

    const { data: newUser, error: createError } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (createError) {
      if (createError.message.includes('already registered')) return { error: 'Email sudah terdaftar' }
      return { error: createError.message }
    }

    // Buat profile
    const { error: profileError } = await adminSupabase.from('profiles').insert({
      id: newUser.user!.id,
      nama,
      role: 'ketua_rw',
      rw_id,
    })

    if (profileError) return { error: profileError.message }

    // Update nama_ketua di tabel rw
    if (nama_ketua) {
      await adminSupabase.from('rw').update({ nama_ketua }).eq('id', rw_id)
    }

    revalidatePath('/admin/pengguna')
    return { success: true }
  } catch (err) {
    return { error: (err as Error).message }
  }
}

export async function createPenggunaRT(formData: FormData) {
  try {
    const email = formData.get('email') as string
    const nama = formData.get('nama') as string
    const password = formData.get('password') as string
    const rt_id = formData.get('rt_id') as string
    const nama_ketua = formData.get('nama_ketua') as string

    if (!email || !nama || !password || !rt_id) return { error: 'Semua field wajib diisi' }
    if (password.length < 8) return { error: 'Password minimal 8 karakter' }

    const supabase = await createClient()
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) return { error: 'Tidak terautentikasi' }

    const cookieStore = await cookies()
    const adminSupabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    )

    const { data: newUser, error: createError } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (createError) {
      if (createError.message.includes('already registered')) return { error: 'Email sudah terdaftar' }
      return { error: createError.message }
    }

    const { error: profileError } = await adminSupabase.from('profiles').insert({
      id: newUser.user!.id,
      nama,
      role: 'ketua_rt',
      rt_id,
    })

    if (profileError) return { error: profileError.message }

    if (nama_ketua) {
      await adminSupabase.from('rt').update({ nama_ketua }).eq('id', rt_id)
    }

    revalidatePath('/admin/pengguna')
    return { success: true }
  } catch (err) {
    return { error: (err as Error).message }
  }
}

export async function toggleAktifPengguna(userId: string, aktif: boolean) {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: aktif })
      .eq('id', userId)

    if (error) return { error: error.message }
    revalidatePath('/admin/pengguna')
    return { success: true }
  } catch (err) {
    return { error: (err as Error).message }
  }
}
