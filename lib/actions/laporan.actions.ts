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
  no_kk: z.string().optional(),
  jenis_kelamin: z.enum(['L', 'P']),
  tempat_lahir: z.string().min(2, 'Tempat lahir wajib diisi'),
  tanggal_lahir: z.string().min(1, 'Tanggal lahir wajib diisi'),
  alamat_asal: z.string().min(2, 'Alamat asal wajib diisi'),
  alamat: z.string().min(2, 'Alamat sekarang wajib diisi'),
  hubungan_keluarga: z.string().optional(),
  agama: z.string().optional(),
  status_kawin: z.string().optional(),
  pekerjaan: z.string().optional(),
  nomor_hp: z.string().optional(),
  tanggal_masuk: z.string().optional(),
  keterangan: z.string().optional(),
})

const laporanKeluarSchema = z.object({
  warga_id: z.string().uuid('Pilih warga yang valid'),
  alamat_tujuan: z.string().min(2, 'Alamat tujuan wajib diisi'),
  alasan_pindah: z.string().optional(),
  tanggal_keluar: z.string().optional(),
  keterangan: z.string().optional(),
})

const laporanLahirSchema = z.object({
  nama: z.string().min(2, 'Nama bayi wajib diisi'),
  jenis_kelamin: z.enum(['L', 'P']),
  tempat_lahir: z.string().optional(),
  tanggal_lahir: z.string().min(1, 'Tanggal lahir wajib diisi'),
  nama_ayah: z.string().min(2, 'Nama ayah wajib diisi'),
  nik_ayah: z.string().optional(),
  nama_ibu: z.string().min(2, 'Nama ibu wajib diisi'),
  nik_ibu: z.string().optional(),
  no_kk: z.string().optional(),
  tanggal_pelaporan: z.string().optional(),
  keterangan: z.string().optional(),
})

const laporanMeninggalSchema = z.object({
  warga_id: z.string().uuid('Pilih warga yang valid'),
  tanggal_meninggal: z.string().min(1, 'Tanggal meninggal wajib diisi'),
  tempat_meninggal: z.string().optional(),
  penyebab: z.string().optional(),
  keterangan: z.string().optional(),
})

const laporanPindahanSchema = z.object({
  warga_id: z.string().uuid('Pilih warga yang valid'),
  rt_tujuan_id: z.string().uuid('Pilih RT tujuan').optional().or(z.literal('')),
  alamat_asal: z.string().optional(),
  alamat_tujuan: z.string().optional(),
  tanggal_pindah: z.string().optional(),
  anggota_keluarga_ikut: z.string().optional(),
  alasan: z.string().optional(),
  keterangan: z.string().optional(),
})

const laporanPerubahanDataSchema = z.object({
  warga_id: z.string().uuid('Pilih warga yang valid'),
  field_diubah: z.string().min(1, 'Pilih data yang diubah'),
  nilai_lama: z.string(),
  nilai_baru: z.string().min(1, 'Nilai baru wajib diisi'),
  alasan: z.string().optional(),
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

  // Ketua RW / Admin Kelurahan: pakai rt_id yang dipilih dari form
  if ((profile.role === 'ketua_rw' || profile.role === 'admin_kelurahan') && rtIdOverride) {
    return { supabase, profile, rtId: rtIdOverride }
  }

  throw new Error('Akses ditolak. Anda tidak memiliki izin untuk membuat laporan.')
}

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
      no_kk: formData.get('no_kk') as string || undefined,
      tempat_lahir: formData.get('tempat_lahir') as string,
      tanggal_lahir: formData.get('tanggal_lahir') as string,
      jenis_kelamin: formData.get('jenis_kelamin') as string,
      alamat: formData.get('alamat') as string,
      alamat_asal: formData.get('alamat_asal') as string,
      hubungan_keluarga: formData.get('hubungan_keluarga') as string || undefined,
      agama: formData.get('agama') as string || undefined,
      status_kawin: formData.get('status_kawin') as string || undefined,
      pekerjaan: formData.get('pekerjaan') as string || undefined,
      nomor_hp: formData.get('nomor_hp') as string || undefined,
      tanggal_masuk: formData.get('tanggal_masuk') as string || undefined,
      keterangan: formData.get('keterangan') as string || undefined,
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
      rw_id: '',
      status: 'diajukan' as StatusLaporan,
      created_by: profile.id,
      keterangan: validated.keterangan || null,
      detail: {
        nik: validated.nik,
        nama: validated.nama,
        no_kk: validated.no_kk || null,
        tempat_lahir: validated.tempat_lahir,
        tanggal_lahir: validated.tanggal_lahir,
        jenis_kelamin: validated.jenis_kelamin,
        alamat: validated.alamat,
        alamat_asal: validated.alamat_asal,
        hubungan_keluarga: validated.hubungan_keluarga || null,
        agama: validated.agama || null,
        status_kawin: validated.status_kawin || null,
        pekerjaan: validated.pekerjaan || null,
        nomor_hp: validated.nomor_hp || null,
        tanggal_masuk: validated.tanggal_masuk || new Date().toISOString().split('T')[0],
      },
    })

    if (error) {
      console.error('Error creating laporan masuk:', error)
      return { error: error.message }
    }

    revalidatePath('/rt')
    revalidatePath('/rw')
    revalidatePath('/admin')
    revalidatePath('/laporan/semua')
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
      alasan_pindah: formData.get('alasan_pindah') as string || undefined,
      tanggal_keluar: formData.get('tanggal_keluar') as string || undefined,
      keterangan: formData.get('keterangan') as string || undefined,
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
        alasan_pindah: validated.alasan_pindah || null,
        tanggal_keluar: validated.tanggal_keluar || new Date().toISOString().split('T')[0],
      },
    })

    if (error) return { error: error.message }

    revalidatePath('/rt')
    revalidatePath('/rw')
    revalidatePath('/admin')
    revalidatePath('/laporan/semua')
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
      jenis_kelamin: formData.get('jenis_kelamin') as string,
      tempat_lahir: formData.get('tempat_lahir') as string || undefined,
      tanggal_lahir: formData.get('tanggal_lahir') as string,
      nama_ayah: formData.get('nama_ayah') as string,
      nik_ayah: formData.get('nik_ayah') as string || undefined,
      nama_ibu: formData.get('nama_ibu') as string,
      nik_ibu: formData.get('nik_ibu') as string || undefined,
      no_kk: formData.get('no_kk') as string || undefined,
      tanggal_pelaporan: formData.get('tanggal_pelaporan') as string || undefined,
      keterangan: formData.get('keterangan') as string || undefined,
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
        jenis_kelamin: validated.jenis_kelamin,
        tempat_lahir: validated.tempat_lahir || null,
        tanggal_lahir: validated.tanggal_lahir,
        nama_ayah: validated.nama_ayah,
        nik_ayah: validated.nik_ayah || null,
        nama_ibu: validated.nama_ibu,
        nik_ibu: validated.nik_ibu || null,
        no_kk: validated.no_kk || null,
        tanggal_pelaporan: validated.tanggal_pelaporan || new Date().toISOString().split('T')[0],
      },
    })

    if (error) return { error: error.message }

    revalidatePath('/rt')
    revalidatePath('/rw')
    revalidatePath('/admin')
    revalidatePath('/laporan/semua')
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
      tempat_meninggal: formData.get('tempat_meninggal') as string || undefined,
      penyebab: formData.get('penyebab') as string || undefined,
      keterangan: formData.get('keterangan') as string || undefined,
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
        tempat_meninggal: validated.tempat_meninggal || null,
        penyebab: validated.penyebab || null,
      },
    })

    if (error) return { error: error.message }

    revalidatePath('/rt')
    revalidatePath('/rw')
    revalidatePath('/admin')
    revalidatePath('/laporan/semua')
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
      rt_tujuan_id: (formData.get('rt_tujuan_id') as string) || undefined,
      alamat_asal: formData.get('alamat_asal') as string || undefined,
      alamat_tujuan: formData.get('alamat_tujuan') as string || undefined,
      tanggal_pindah: formData.get('tanggal_pindah') as string || undefined,
      anggota_keluarga_ikut: formData.get('anggota_keluarga_ikut') as string || undefined,
      alasan: formData.get('alasan') as string || undefined,
      keterangan: formData.get('keterangan') as string || undefined,
    }

    const validated = laporanPindahanSchema.parse(raw)

    const { error } = await supabase.from('laporan').insert({
      jenis: 'pindahan' as JenisLaporan,
      warga_id: validated.warga_id,
      rt_id: profile.rt_id!,
      rw_id: '',
      rt_asal_id: profile.rt_id!,
      rt_tujuan_id: validated.rt_tujuan_id || null,
      status: 'diajukan' as StatusLaporan,
      created_by: profile.id,
      keterangan: validated.keterangan || null,
      detail: {
        alamat_asal: validated.alamat_asal || null,
        alamat_tujuan: validated.alamat_tujuan || null,
        tanggal_pindah: validated.tanggal_pindah || new Date().toISOString().split('T')[0],
        anggota_keluarga_ikut: validated.anggota_keluarga_ikut || null,
        alasan: validated.alasan || null,
      },
    })

    if (error) return { error: error.message }

    revalidatePath('/rt')
    revalidatePath('/rw')
    revalidatePath('/admin')
    revalidatePath('/laporan/semua')
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
      alasan: formData.get('alasan') as string || undefined,
      keterangan: formData.get('keterangan') as string || undefined,
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
        alasan: validated.alasan || null,
      },
    })

    if (error) return { error: error.message }

    revalidatePath('/rt')
    revalidatePath('/rw')
    revalidatePath('/admin')
    revalidatePath('/laporan/semua')
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
      .eq('status', 'diajukan')

    if (error) return { error: error.message }

    revalidatePath('/rw/verifikasi')
    revalidatePath('/admin')
    revalidatePath('/rw')
    revalidatePath('/laporan/semua')
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
    revalidatePath('/laporan/semua')
    return { success: true }
  } catch (err) {
    return { error: (err as Error).message }
  }
}
