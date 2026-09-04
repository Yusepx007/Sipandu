'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createRW(formData: FormData) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Tidak terautentikasi' }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, kelurahan_id')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin_kelurahan') {
      return { error: 'Hanya Admin Kelurahan yang dapat mengelola wilayah' }
    }

    const nomor = formData.get('nomor') as string
    const nama_ketua = formData.get('nama_ketua') as string

    if (!nomor) return { error: 'Nomor RW wajib diisi' }

    const { error } = await supabase.from('rw').insert({
      kelurahan_id: profile.kelurahan_id!,
      nomor: nomor.padStart(2, '0'),
      nama_ketua: nama_ketua || null,
    })

    if (error) {
      if (error.code === '23505') return { error: 'Nomor RW sudah ada' }
      return { error: error.message }
    }

    revalidatePath('/admin/wilayah')
    return { success: true }
  } catch (err) {
    return { error: (err as Error).message }
  }
}

export async function updateRW(rwId: string, formData: FormData) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Tidak terautentikasi' }

    const nomor = formData.get('nomor') as string
    const nama_ketua = formData.get('nama_ketua') as string

    const { error } = await supabase
      .from('rw')
      .update({ nomor: nomor.padStart(2, '0'), nama_ketua: nama_ketua || null })
      .eq('id', rwId)

    if (error) return { error: error.message }

    revalidatePath('/admin/wilayah')
    return { success: true }
  } catch (err) {
    return { error: (err as Error).message }
  }
}

export async function createRT(formData: FormData) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Tidak terautentikasi' }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin_kelurahan') {
      return { error: 'Hanya Admin Kelurahan yang dapat mengelola wilayah' }
    }

    const rw_id = formData.get('rw_id') as string
    const nomor = formData.get('nomor') as string
    const nama_ketua = formData.get('nama_ketua') as string

    if (!rw_id || !nomor) return { error: 'RW dan Nomor RT wajib diisi' }

    const { error } = await supabase.from('rt').insert({
      rw_id,
      nomor: nomor.padStart(2, '0'),
      nama_ketua: nama_ketua || null,
    })

    if (error) {
      if (error.code === '23505') return { error: 'Nomor RT sudah ada di RW ini' }
      return { error: error.message }
    }

    revalidatePath('/admin/wilayah')
    return { success: true }
  } catch (err) {
    return { error: (err as Error).message }
  }
}

export async function updateRT(rtId: string, formData: FormData) {
  try {
    const supabase = await createClient()

    const nomor = formData.get('nomor') as string
    const nama_ketua = formData.get('nama_ketua') as string

    const { error } = await supabase
      .from('rt')
      .update({ nomor: nomor.padStart(2, '0'), nama_ketua: nama_ketua || null })
      .eq('id', rtId)

    if (error) return { error: error.message }

    revalidatePath('/admin/wilayah')
    return { success: true }
  } catch (err) {
    return { error: (err as Error).message }
  }
}
