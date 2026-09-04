'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, CheckCircle2, ChevronDown } from 'lucide-react'
import type { Warga } from '@/lib/types'

type JenisLaporan = 'masuk' | 'keluar' | 'lahir' | 'meninggal' | 'pindahan' | 'perubahan_data'

interface WargaWithRt extends Partial<Warga> { rt_id?: string }

interface Props {
  rtList: Array<{ id: string; nomor: string }>
  allRtList: Array<{ id: string; nomor: string; rw?: { nomor?: string } | unknown }>
  wargaList: WargaWithRt[]
}

const inputClass = 'w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400 transition-all text-sm'
const labelClass = 'block text-sm font-medium text-gray-700 mb-1.5'

function Field({ label, name, type = 'text', placeholder, required, maxLength, readOnly }: {
  label: string; name: string; type?: string; placeholder?: string
  required?: boolean; maxLength?: number; readOnly?: boolean
}) {
  if (type === 'textarea') return (
    <div>
      <label htmlFor={name} className={labelClass}>{label}</label>
      <textarea id={name} name={name} placeholder={placeholder} rows={3}
        className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400 transition-all text-sm resize-none" />
    </div>
  )
  return (
    <div>
      <label htmlFor={name} className={labelClass}>
        {label}{required && <span className="text-rose-500 ml-1">*</span>}
      </label>
      <input id={name} name={name} type={type} placeholder={placeholder} required={required}
        maxLength={maxLength} readOnly={readOnly}
        className={readOnly
          ? 'w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-400 text-sm cursor-not-allowed'
          : inputClass} />
    </div>
  )
}

function SelectBox({ label, name, required, options, value, onChange }: {
  label: string; name: string; required?: boolean
  options: { value: string; label: string }[]
  value?: string; onChange?: (v: string) => void
}) {
  return (
    <div>
      <label htmlFor={name} className={labelClass}>
        {label}{required && <span className="text-rose-500 ml-1">*</span>}
      </label>
      <div className="relative">
        <select id={name} name={name} required={required} value={value}
          onChange={e => onChange?.(e.target.value)}
          className="w-full px-4 py-3 pr-10 rounded-xl bg-white border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400 transition-all text-sm appearance-none cursor-pointer">
          <option value="">-- Pilih --</option>
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>
    </div>
  )
}

export function UnifiedLaporanFormRW({ rtList, allRtList, wargaList }: Props) {
  const router = useRouter()
  const [selectedRtId, setSelectedRtId] = useState('')
  const [jenis, setJenis] = useState<JenisLaporan | ''>('')
  const [wargaId, setWargaId] = useState('')
  const [fieldDiubah, setFieldDiubah] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Filter warga berdasarkan RT yang dipilih
  const filteredWarga = useMemo(
    () => selectedRtId ? wargaList.filter(w => w.rt_id === selectedRtId) : [],
    [selectedRtId, wargaList]
  )

  const selectedWarga = filteredWarga.find(w => w.id === wargaId)
  const nilaiLama = selectedWarga && fieldDiubah
    ? String(selectedWarga[fieldDiubah as keyof Warga] ?? '') : ''

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!selectedRtId) { setError('Pilih RT terlebih dahulu'); return }
    if (!jenis) { setError('Pilih jenis laporan terlebih dahulu'); return }
    setPending(true); setError('')

    try {
      const formData = new FormData(e.currentTarget)
      formData.set('rt_id_override', selectedRtId)

      const actions = await import('@/lib/actions/laporan.actions')
      let result: { error?: string; success?: boolean } | undefined

      if (jenis === 'masuk') result = await actions.createLaporanMasuk(formData)
      else if (jenis === 'keluar') result = await actions.createLaporanKeluar(formData)
      else if (jenis === 'lahir') result = await actions.createLaporanLahir(formData)
      else if (jenis === 'meninggal') result = await actions.createLaporanMeninggal(formData)
      else if (jenis === 'pindahan') result = await actions.createLaporanPindahan(formData)
      else if (jenis === 'perubahan_data') result = await actions.createLaporanPerubahanData(formData)

      if (result?.error) { setError(result.error); setPending(false) }
      else { setSuccess(true); setTimeout(() => router.push('/rw'), 2500) }
    } catch {
      setError('Terjadi kesalahan. Coba lagi.'); setPending(false)
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Laporan Berhasil Diajukan!</h2>
        <p className="text-gray-500 text-sm">Laporan sudah masuk ke dashboard Admin</p>
        <p className="text-xs text-gray-400">Mengalihkan ke dashboard...</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">

      {/* ── Step 1: Pilih RT ── */}
      <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
        <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-3">Langkah 1 — Pilih RT</p>
        <SelectBox label="RT yang Melapor" name="rt_selector" required
          value={selectedRtId}
          onChange={v => { setSelectedRtId(v); setWargaId(''); }}
          options={rtList.map(rt => ({ value: rt.id, label: `RT ${rt.nomor}` }))} />
      </div>

      {/* ── Step 2: Jenis Laporan ── */}
      {selectedRtId && (
        <SelectBox label="Jenis Laporan" name="jenis_dummy" required
          value={jenis}
          onChange={v => { setJenis(v as JenisLaporan); setWargaId(''); setFieldDiubah('') }}
          options={[
            { value: 'masuk',          label: 'Warga Masuk' },
            { value: 'keluar',         label: 'Warga Keluar' },
            { value: 'lahir',          label: 'Kelahiran' },
            { value: 'meninggal',      label: 'Kematian' },
            { value: 'pindahan',       label: 'Pindahan (Internal)' },
            { value: 'perubahan_data', label: 'Perubahan Data Warga' },
          ]} />
      )}

      {jenis && <div className="border-t border-gray-100" />}

      {/* ── MASUK ── */}
      {jenis === 'masuk' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="NIK" name="nik" placeholder="16 digit NIK" maxLength={16} required pattern="\d{16}" />
          <Field label="Nama Lengkap" name="nama" placeholder="Nama sesuai KTP" required />
          <Field label="Tempat Lahir" name="tempat_lahir" placeholder="Kota/Kabupaten" required />
          <Field label="Tanggal Lahir" name="tanggal_lahir" type="date" required />
          <SelectBox label="Jenis Kelamin" name="jenis_kelamin" required options={[
            { value: 'L', label: 'Laki-laki' }, { value: 'P', label: 'Perempuan' }
          ]} />
          <Field label="Alamat di RT" name="alamat" placeholder="Alamat lengkap" required />
          <Field label="Alamat Asal" name="alamat_asal" placeholder="Alamat sebelumnya (opsional)" />
          <Field label="NIK Kepala Keluarga" name="nik_kepala_keluarga" placeholder="Opsional" maxLength={16} />
        </div>
      )}

      {/* ── KELUAR ── */}
      {jenis === 'keluar' && (
        <div className="space-y-4">
          <SelectBox label="Pilih Warga" name="warga_id" required
            options={filteredWarga.map(w => ({ value: w.id!, label: `${w.nama} — ${w.nik}` }))} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Alamat Tujuan" name="alamat_tujuan" placeholder="Alamat lengkap tujuan" required />
            <Field label="Kota Tujuan" name="kota_tujuan" placeholder="Contoh: Kota Bandung" required />
          </div>
        </div>
      )}

      {/* ── LAHIR ── */}
      {jenis === 'lahir' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Nama Bayi" name="nama" placeholder="Nama lengkap bayi" required />
          <Field label="Tanggal Lahir" name="tanggal_lahir" type="date" required />
          <SelectBox label="Jenis Kelamin" name="jenis_kelamin" required options={[
            { value: 'L', label: 'Laki-laki' }, { value: 'P', label: 'Perempuan' }
          ]} />
          <Field label="NIK Bayi (opsional)" name="nik" placeholder="16 digit, bisa diisi kemudian" maxLength={16} />
          <Field label="Nama Ayah" name="nama_ayah" placeholder="Nama lengkap ayah" required />
          <Field label="Nama Ibu" name="nama_ibu" placeholder="Nama lengkap ibu" required />
          <Field label="Berat Lahir (kg)" name="berat_lahir_kg" type="number" placeholder="Contoh: 3.2" />
          <Field label="Alamat" name="alamat" placeholder="Alamat domisili bayi" />
        </div>
      )}

      {/* ── MENINGGAL ── */}
      {jenis === 'meninggal' && (
        <div className="space-y-4">
          <SelectBox label="Pilih Warga" name="warga_id" required
            options={filteredWarga.map(w => ({ value: w.id!, label: `${w.nama} — ${w.nik}` }))} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Tanggal Meninggal" name="tanggal_meninggal" type="date" required />
            <Field label="Penyebab" name="penyebab" placeholder="Contoh: Sakit (opsional)" />
          </div>
        </div>
      )}

      {/* ── PINDAHAN ── */}
      {jenis === 'pindahan' && (
        <div className="space-y-4">
          <SelectBox label="Pilih Warga" name="warga_id" required
            options={filteredWarga.map(w => ({ value: w.id!, label: `${w.nama} — ${w.nik}` }))} />
          <SelectBox label="RT Tujuan" name="rt_tujuan_id" required
            options={allRtList.filter(r => r.id !== selectedRtId).map(rt => ({
              value: rt.id,
              label: `RT ${rt.nomor}${rt.rw && typeof rt.rw === 'object' && 'nomor' in rt.rw ? ` / RW ${(rt.rw as {nomor?: string}).nomor}` : ''}`
            }))} />
          <Field label="Alasan Pindah (opsional)" name="alasan" placeholder="Contoh: Ikut suami/istri" />
        </div>
      )}

      {/* ── PERUBAHAN DATA ── */}
      {jenis === 'perubahan_data' && (
        <div className="space-y-4">
          <SelectBox label="Pilih Warga" name="warga_id" required
            options={filteredWarga.map(w => ({ value: w.id!, label: `${w.nama} — ${w.nik}` }))}
            value={wargaId} onChange={setWargaId} />
          <SelectBox label="Data yang Diubah" name="field_diubah" required
            value={fieldDiubah} onChange={setFieldDiubah}
            options={[
              { value: 'nama', label: 'Nama Lengkap' },
              { value: 'alamat', label: 'Alamat' },
              { value: 'pekerjaan', label: 'Pekerjaan' },
              { value: 'status_kawin', label: 'Status Perkawinan' },
              { value: 'pendidikan', label: 'Pendidikan Terakhir' },
              { value: 'nomor_hp', label: 'Nomor HP' },
            ]} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Nilai Lama (otomatis)</label>
              <input name="nilai_lama" type="text" value={nilaiLama} readOnly
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-400 text-sm cursor-not-allowed" />
            </div>
            <Field label="Nilai Baru" name="nilai_baru" placeholder="Masukkan nilai baru" required />
          </div>
        </div>
      )}

      {jenis && (
        <Field label="Keterangan (opsional)" name="keterangan" type="textarea"
          placeholder="Catatan atau informasi tambahan..." />
      )}

      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">{error}</div>
      )}

      <div className="flex gap-3 pt-2 border-t border-gray-100">
        <button type="button" onClick={() => router.back()}
          className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-all text-sm font-medium">
          Batal
        </button>
        <button id="btn-submit-laporan-rw" type="submit" disabled={pending || !jenis || !selectedRtId}
          className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-sm">
          {pending ? <><Loader2 className="w-4 h-4 animate-spin" />Menyimpan...</> : 'Ajukan Laporan'}
        </button>
      </div>
    </form>
  )
}
