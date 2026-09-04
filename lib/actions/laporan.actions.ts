'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { JenisLaporan, StatusLaporan } from '@/lib/types'
import { z } from 'zod'

// ============================================================
// SCHEMA VALIDASI ZOD
// ============================================================

const laporanMasukSchema = z.object({
  nik: z.string().length(16, 'NIK harus 16 digit'),
  nama: z.string().min(2, 'Nama minimal 2 karakter'),
  tempat_lahir: z.string().min(2),
  tanggal_lahir: z.string(),
  jenis_kelamin: z.enum(['L', 'P']),
  alamat: z.string().min(5),
  alamat_asal: z.string().optional(),
  nik_kepala_keluarga: z.string().optional(),
  keterangan: z.string().optional(),
})

const laporanKeluarSchema = z.object({
  warga_id: z.string().uuid('Pilih warga yang valid'),
  alamat_tujuan: z.string().min(5),
  kota_tujuan: z.string().min(2),
  keterangan: z.string().optional(),
})

const laporanLahirSchema = z.object({
  nama: z.string().min(2),
  tanggal_lahir: z.string(),
  jenis_kelamin: z.enum(['L', 'P']),
  nik: z.string().optional(),
  nama_ayah: z.string().min(2),
  nama_ibu: z.string().min(2),
  berat_lahir_kg: z.string().optional(),
  alamat: z.string().optional(),
  keterangan: z.string().optional(),
})

const laporanMeninggalSchema = z.object({
  warga_id: z.string().uuid(),
  tanggal_meninggal: z.string(),
  penyebab: z.string().optional(),
  keterangan: z.string().optional(),
})

const laporanPindahanSchema = z.object({
  warga_id: z.string().uuid(),
  rt_tujuan_id: z.string().uuid('Pilih RT tujuan'),
  alasan: z.string().optional(),
  keterangan: z.string().optional(),
})

const laporanPerubahanDataSchema = z.object({
  warga_id: z.string().uuid(),
  field_diubah: z.string().min(1),
  nilai_lama: z.string(),
  nilai_baru: z.string().min(1),
  keterangan: z.string().optional(),
})

// ============================================================
// HELPERS
// ============================================================

async function getAuthenticatedCreatorProfile(rtIdOverride?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Tidak terautentikasi')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, rt_id, rw_id')
    .eq('id', user.id)
    .single()

  if (!profile) throw new Error('Profil tidak ditemukan')

  // Ketua RT: pakai rt_id dari profil
  if (profile.role === 'ketua_rt' && profile.rt_id) {
    return { supabase, profile, rtId: profile.rt_id }
  }

  // Ketua RW: pakai rt_id yang dipilih dari form
  if (profile.role === 'ketua_rw' && rtIdOverride) {
    return { supabase, profile, rtId: rtIdOverride }
  }

  throw new Error('Akses ditolak. Anda tidak memiliki izin untuk membuat laporan.')
}

// Alias untuk backward compatibility - juga support RW dengan rt_id_override
async function getAuthenticatedRTProfile(rtIdOverride?: string) {
  const result = await getAuthenticatedCreatorProfile(rtIdOverride)
  return { supabase: result.supabase, profile: { ...result.profile, rt_id: result.rtId } }
}

// ============================================================
// CREATE LAPORAN ACTIONS
// ============================================================

export async function createLaporanMasuk(formData: FormData) {
  try {
    const rtIdOverride = (formData.get('rt_id_override') as string) || undefined
    const { supabase, profile } = await getAuthenticatedRTProfile(rtIdOverride)

    const raw = {
      nik: formData.get('nik') as string,
      nama: formData.get('nama') as string,
      tempat_lahir: formData.get('tempat_lahir') as string,
      tanggal_lahir: formData.get('tanggal_lahir') as string,
      jenis_kelamin: formData.get('jenis_kelamin') as string,
      alamat: formData.get('alamat') as string,
      alamat_asal: formData.get('alamat_asal') as string,
      nik_kepala_keluarga: formData.get('nik_kepala_keluarga') as string,
      keterangan: formData.get('keterangan') as string,
    }

    const validated = laporanMasukSchema.parse(raw)

    // Cek apakah NIK sudah ada
    const { data: existingWarga } = await supabase
      .from('warga')
      .select('id, status')
      .eq('nik', validated.nik)
      .single()

    if (existingWarga) {
      return { error: 'NIK sudah terdaftar dalam sistem. Gunakan jenis laporan Pindahan atau Perubahan Data.' }
    }

    const { error } = await supabase.from('laporan').insert({
      jenis: 'masuk' as JenisLaporan,
      rt_id: profile.rt_id!,
      rw_id: '', // akan diisi trigger
      status: 'diajukan' as StatusLaporan,
      created_by: profile.id,
      keterangan: validated.keterangan || null,
      detail: {
        nik: validated.nik,
        nama: validated.nama,
        tempat_lahir: validated.tempat_lahir,
        tanggal_lahir: validated.tanggal_lahir,
        jenis_kelamin: validated.jenis_kelamin,
        alamat: validated.alamat,
        alamat_asal: validated.alamat_asal || null,
        nik_kepala_keluarga: validated.nik_kepala_keluarga || null,
      },
    })

    if (error) {
      console.error('Error creating laporan masuk:', error)
      return { error: error.message }
    }

    revalidatePath('/rt')
    revalidatePath('/laporan/masuk')
    return { success: true }
  } catch (err) {
    if (err instanceof z.ZodError) {
      return { error: err.issues[0]?.message || 'Validasi gagal' }
    }
    return { error: (err as Error).message }
  }
}

export async function createLaporanKeluar(formData: FormData) {
  try {
    const rtIdOverride = (formData.get('rt_id_override') as string) || undefined
    const { supabase, profile } = await getAuthenticatedRTProfile(rtIdOverride)

    const raw = {
      warga_id: formData.get('warga_id') as string,
      alamat_tujuan: formData.get('alamat_tujuan') as string,
      kota_tujuan: formData.get('kota_tujuan') as string,
      keterangan: formData.get('keterangan') as string,
    }

    const validated = laporanKeluarSchema.parse(raw)

    const { error } = await supabase.from('laporan').insert({
      jenis: 'keluar' as JenisLaporan,
      warga_id: validated.warga_id,
      rt_id: profile.rt_id!,
      rw_id: '',
      status: 'diajukan' as StatusLaporan,
      created_by: profile.id,
      keterangan: validated.keterangan || null,
      detail: {
        alamat_tujuan: validated.alamat_tujuan,
        kota_tujuan: validated.kota_tujuan,
      },
    })

    if (error) return { error: error.message }

    revalidatePath('/rt')
    revalidatePath('/laporan/keluar')
    return { success: true }
  } catch (err) {
    if (err instanceof z.ZodError) return { error: err.issues[0]?.message || 'Validasi gagal' }
    return { error: (err as Error).message }
  }
}

export async function createLaporanLahir(formData: FormData) {
  try {
    const rtIdOverride = (formData.get('rt_id_override') as string) || undefined
    const { supabase, profile } = await getAuthenticatedRTProfile(rtIdOverride)

    const raw = {
      nama: formData.get('nama') as string,
      tanggal_lahir: formData.get('tanggal_lahir') as string,
      jenis_kelamin: formData.get('jenis_kelamin') as string,
      nik: formData.get('nik') as string || undefined,
      nama_ayah: formData.get('nama_ayah') as string,
      nama_ibu: formData.get('nama_ibu') as string,
      berat_lahir_kg: formData.get('berat_lahir_kg') as string || undefined,
      alamat: formData.get('alamat') as string || undefined,
      keterangan: formData.get('keterangan') as string,
    }

    const validated = laporanLahirSchema.parse(raw)

    const { error } = await supabase.from('laporan').insert({
      jenis: 'lahir' as JenisLaporan,
      rt_id: profile.rt_id!,
      rw_id: '',
      status: 'diajukan' as StatusLaporan,
      created_by: profile.id,
      keterangan: validated.keterangan || null,
      detail: {
        nama: validated.nama,
        tanggal_lahir: validated.tanggal_lahir,
        jenis_kelamin: validated.jenis_kelamin,
        nik: validated.nik || null,
        nama_ayah: validated.nama_ayah,
        nama_ibu: validated.nama_ibu,
        berat_lahir_kg: validated.berat_lahir_kg ? parseFloat(validated.berat_lahir_kg) : null,
        alamat: validated.alamat || null,
      },
    })

    if (error) return { error: error.message }

    revalidatePath('/rt')
    revalidatePath('/laporan/lahir')
    return { success: true }
  } catch (err) {
    if (err instanceof z.ZodError) return { error: err.issues[0]?.message || 'Validasi gagal' }
    return { error: (err as Error).message }
  }
}

export async function createLaporanMeninggal(formData: FormData) {
  try {
    const rtIdOverride = (formData.get('rt_id_override') as string) || undefined
    const { supabase, profile } = await getAuthenticatedRTProfile(rtIdOverride)

    const raw = {
      warga_id: formData.get('warga_id') as string,
      tanggal_meninggal: formData.get('tanggal_meninggal') as string,
      penyebab: formData.get('penyebab') as string || undefined,
      keterangan: formData.get('keterangan') as string,
    }

    const validated = laporanMeninggalSchema.parse(raw)

    const { error } = await supabase.from('laporan').insert({
      jenis: 'meninggal' as JenisLaporan,
      warga_id: validated.warga_id,
      rt_id: profile.rt_id!,
      rw_id: '',
      status: 'diajukan' as StatusLaporan,
      created_by: profile.id,
      keterangan: validated.keterangan || null,
      detail: {
        tanggal_meninggal: validated.tanggal_meninggal,
        penyebab: validated.penyebab || null,
      },
    })

    if (error) return { error: error.message }

    revalidatePath('/rt')
    revalidatePath('/laporan/meninggal')
    return { success: true }
  } catch (err) {
    if (err instanceof z.ZodError) return { error: err.issues[0]?.message || 'Validasi gagal' }
    return { error: (err as Error).message }
  }
}

export async function createLaporanPindahan(formData: FormData) {
  try {
    const rtIdOverride = (formData.get('rt_id_override') as string) || undefined
    const { supabase, profile } = await getAuthenticatedRTProfile(rtIdOverride)

    const raw = {
      warga_id: formData.get('warga_id') as string,
      rt_tujuan_id: formData.get('rt_tujuan_id') as string,
      alasan: formData.get('alasan') as string || undefined,
      keterangan: formData.get('keterangan') as string,
    }

    const validated = laporanPindahanSchema.parse(raw)

    if (validated.rt_tujuan_id === profile.rt_id) {
      return { error: 'RT tujuan tidak boleh sama dengan RT asal' }
    }

    const { error } = await supabase.from('laporan').insert({
      jenis: 'pindahan' as JenisLaporan,
      warga_id: validated.warga_id,
      rt_id: profile.rt_id!,
      rw_id: '',
      rt_asal_id: profile.rt_id!,
      rt_tujuan_id: validated.rt_tujuan_id,
      status: 'diajukan' as StatusLaporan,
      created_by: profile.id,
      keterangan: validated.keterangan || null,
      detail: {
        alasan: validated.alasan || null,
      },
    })

    if (error) return { error: error.message }

    revalidatePath('/rt')
    revalidatePath('/laporan/pindahan')
    return { success: true }
  } catch (err) {
    if (err instanceof z.ZodError) return { error: err.issues[0]?.message || 'Validasi gagal' }
    return { error: (err as Error).message }
  }
}

export async function createLaporanPerubahanData(formData: FormData) {
  try {
    const rtIdOverride = (formData.get('rt_id_override') as string) || undefined
    const { supabase, profile } = await getAuthenticatedRTProfile(rtIdOverride)

    const raw = {
      warga_id: formData.get('warga_id') as string,
      field_diubah: formData.get('field_diubah') as string,
      nilai_lama: formData.get('nilai_lama') as string,
      nilai_baru: formData.get('nilai_baru') as string,
      keterangan: formData.get('keterangan') as string,
    }

    const validated = laporanPerubahanDataSchema.parse(raw)

    const { error } = await supabase.from('laporan').insert({
      jenis: 'perubahan_data' as JenisLaporan,
      warga_id: validated.warga_id,
      rt_id: profile.rt_id!,
      rw_id: '',
      status: 'diajukan' as StatusLaporan,
      created_by: profile.id,
      keterangan: validated.keterangan || null,
      detail: {
        field_diubah: validated.field_diubah,
        nilai_lama: validated.nilai_lama,
        nilai_baru: validated.nilai_baru,
      },
    })

    if (error) return { error: error.message }

    revalidatePath('/rt')
    revalidatePath('/laporan/perubahan_data')
    return { success: true }
  } catch (err) {
    if (err instanceof z.ZodError) return { error: err.issues[0]?.message || 'Validasi gagal' }
    return { error: (err as Error).message }
  }
}

// ============================================================
// VERIFIKASI / TOLAK
// ============================================================

export async function verifikasiLaporan(laporanId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Tidak terautentikasi' }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role, rw_id')
      .eq('id', user.id)
      .single()

    if (!profile || !['ketua_rw', 'admin_kelurahan'].includes(profile.role)) {
      return { error: 'Tidak memiliki izin untuk memverifikasi laporan' }
    }

    const { error } = await supabase
      .from('laporan')
      .update({
        status: 'diverifikasi',
        verified_by: profile.id,
        verified_at: new Date().toISOString(),
      })
      .eq('id', laporanId)
      .eq('status', 'diajukan') // Hanya bisa verifikasi yang diajukan

    if (error) return { error: error.message }

    revalidatePath('/rw/verifikasi')
    revalidatePath('/admin')
    revalidatePath('/rw')
    return { success: true }
  } catch (err) {
    return { error: (err as Error).message }
  }
}

export async function tolakLaporan(laporanId: string, alasan: string) {
  try {
    if (!alasan.trim()) return { error: 'Alasan penolakan wajib diisi' }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Tidak terautentikasi' }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role, rw_id')
      .eq('id', user.id)
      .single()

    if (!profile || !['ketua_rw', 'admin_kelurahan'].includes(profile.role)) {
      return { error: 'Tidak memiliki izin untuk menolak laporan' }
    }

    const { error } = await supabase
      .from('laporan')
      .update({
        status: 'ditolak',
        verified_by: profile.id,
        verified_at: new Date().toISOString(),
        keterangan: alasan,
      })
      .eq('id', laporanId)
      .eq('status', 'diajukan')

    if (error) return { error: error.message }

    revalidatePath('/rw/verifikasi')
    revalidatePath('/admin')
    revalidatePath('/rw')
    return { success: true }
  } catch (err) {
    return { error: (err as Error).message }
  }
}

