'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createLaporanKeluar } from '@/lib/actions/laporan.actions'
import { Loader2, CheckCircle2, ChevronDown } from 'lucide-react'
import type { Warga } from '@/lib/types'

interface FormWargaKeluarProps {
  wargaList: Partial<Warga>[]
  rtList: unknown[]
  rtId: string
}

// ── Shared Styles ──────────────────────────────────────────
const inputClass = 'w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all text-sm'
const labelClass = 'block text-sm font-medium text-gray-700 mb-1.5'

function Field({ label, name, type = 'text', placeholder, required, maxLength, pattern, readOnly, value }: {
  label: string; name: string; type?: string; placeholder?: string;
  required?: boolean; maxLength?: number; pattern?: string; readOnly?: boolean; value?: string
}) {
  if (type === 'textarea') return (
    <div>
      <label htmlFor={name} className={labelClass}>{label}</label>
      <textarea id={name} name={name} placeholder={placeholder} rows={3}
        className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all text-sm resize-none" />
    </div>
  )
  return (
    <div>
      <label htmlFor={name} className={labelClass}>
        {label}{required && <span className="text-rose-500 ml-1">*</span>}
      </label>
      <input id={name} name={name} type={type} placeholder={placeholder} required={required}
        maxLength={maxLength} pattern={pattern} readOnly={readOnly} defaultValue={value}
        className={readOnly
          ? 'w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-500 text-sm cursor-not-allowed'
          : inputClass} />
    </div>
  )
}

function SelectField({ label, name, required, options, value, onChange }: {
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
        <select id={name} name={name} required={required}
          value={value} onChange={e => onChange?.(e.target.value)}
          className="w-full px-4 py-3 pr-10 rounded-xl bg-white border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all text-sm appearance-none cursor-pointer">
          <option value="">-- Pilih --</option>
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>
    </div>
  )
}

function WargaSelect({ label, name, required, wargaList, value, onChange }: {
  label: string; name: string; required?: boolean
  wargaList: Partial<Warga>[]
  value?: string; onChange?: (v: string) => void
}) {
  return (
    <div>
      <label htmlFor={name} className={labelClass}>
        {label}{required && <span className="text-rose-500 ml-1">*</span>}
      </label>
      <div className="relative">
        <select id={name} name={name} required={required}
          value={value} onChange={e => onChange?.(e.target.value)}
          className="w-full px-4 py-3 pr-10 rounded-xl bg-white border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all text-sm appearance-none cursor-pointer">
          <option value="">-- Pilih Warga --</option>
          {wargaList.map(w => (
            <option key={w.id} value={w.id}>{w.nama} — NIK: {w.nik}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>
    </div>
  )
}

function ErrorBox({ msg }: { msg: string }) {
  return <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">{msg}</div>
}

function FormActions({ pending, onBack, submitLabel, submitId }: {
  pending: boolean; onBack: () => void; submitLabel: string; submitId: string
}) {
  return (
    <div className="flex gap-3 pt-4 border-t border-gray-100">
      <button type="button" onClick={onBack}
        className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-all text-sm font-medium">
        Batal
      </button>
      <button id={submitId} type="submit" disabled={pending}
        className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-sm">
        {pending ? <><Loader2 className="w-4 h-4 animate-spin" />Menyimpan...</> : submitLabel}
      </button>
    </div>
  )
}

function SuccessState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
      <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
        <CheckCircle2 className="w-10 h-10 text-emerald-600" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900">Laporan Berhasil Diajukan!</h2>
      <p className="text-gray-500">Menunggu verifikasi Ketua RW</p>
      <p className="text-xs text-gray-400">Mengalihkan ke dashboard...</p>
    </div>
  )
}

// ── FORM: WARGA KELUAR ──────────────────────────────────────
export function FormWargaKeluar({ wargaList }: FormWargaKeluarProps) {
  const [pending, setPending] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true); setError('')
    const result = await createLaporanKeluar(new FormData(e.currentTarget))
    setPending(false)
    if (result?.error) setError(result.error)
    else { setSuccess(true); setTimeout(() => router.push('/rt'), 2000) }
  }

  if (success) return <SuccessState />
  return (
    <form onSubmit={handleSubmit} id="form-warga-keluar" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
      <WargaSelect label="Pilih Warga" name="warga_id" required wargaList={wargaList} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Alamat Tujuan" name="alamat_tujuan" placeholder="Alamat lengkap tujuan" required />
        <Field label="Kota/Kabupaten Tujuan" name="kota_tujuan" placeholder="Contoh: Kota Bandung" required />
      </div>
      <Field label="Keterangan" name="keterangan" type="textarea" placeholder="Catatan tambahan (opsional)" />
      {error && <ErrorBox msg={error} />}
      <FormActions pending={pending} onBack={() => router.back()} submitLabel="Ajukan Laporan" submitId="btn-submit-keluar" />
    </form>
  )
}

// ── FORM: KELAHIRAN ─────────────────────────────────────────
export function FormLahir() {
  const [pending, setPending] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setPending(true); setError('')
    const { createLaporanLahir } = await import('@/lib/actions/laporan.actions')
    const result = await createLaporanLahir(new FormData(e.currentTarget))
    setPending(false)
    if (result?.error) setError(result.error)
    else { setSuccess(true); setTimeout(() => router.push('/rt'), 2000) }
  }

  if (success) return <SuccessState />
  return (
    <form onSubmit={handleSubmit} id="form-lahir" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Nama Bayi" name="nama" placeholder="Nama lengkap bayi" required />
        <Field label="Tanggal Lahir" name="tanggal_lahir" type="date" required />
        <SelectField label="Jenis Kelamin" name="jenis_kelamin" required options={[
          { value: 'L', label: 'Laki-laki' }, { value: 'P', label: 'Perempuan' }
        ]} />
        <Field label="NIK (opsional)" name="nik" placeholder="16 digit, bisa diisi kemudian" maxLength={16} />
        <Field label="Nama Ayah" name="nama_ayah" placeholder="Nama lengkap ayah" required />
        <Field label="Nama Ibu" name="nama_ibu" placeholder="Nama lengkap ibu" required />
        <Field label="Berat Lahir (kg)" name="berat_lahir_kg" type="number" placeholder="Contoh: 3.2" />
        <Field label="Alamat" name="alamat" placeholder="Alamat domisili bayi" />
      </div>
      <Field label="Keterangan" name="keterangan" type="textarea" placeholder="Catatan tambahan (opsional)" />
      {error && <ErrorBox msg={error} />}
      <FormActions pending={pending} onBack={() => router.back()} submitLabel="Ajukan Laporan" submitId="btn-submit-lahir" />
    </form>
  )
}

// ── FORM: KEMATIAN ──────────────────────────────────────────
export function FormMeninggal({ wargaList }: FormWargaKeluarProps) {
  const [pending, setPending] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setPending(true); setError('')
    const { createLaporanMeninggal } = await import('@/lib/actions/laporan.actions')
    const result = await createLaporanMeninggal(new FormData(e.currentTarget))
    setPending(false)
    if (result?.error) setError(result.error)
    else { setSuccess(true); setTimeout(() => router.push('/rt'), 2000) }
  }

  if (success) return <SuccessState />
  return (
    <form onSubmit={handleSubmit} id="form-meninggal" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
      <WargaSelect label="Pilih Warga" name="warga_id" required wargaList={wargaList} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Tanggal Meninggal" name="tanggal_meninggal" type="date" required />
        <Field label="Penyebab (opsional)" name="penyebab" placeholder="Contoh: Sakit keras" />
      </div>
      <Field label="Keterangan" name="keterangan" type="textarea" placeholder="Catatan tambahan (opsional)" />
      {error && <ErrorBox msg={error} />}
      <FormActions pending={pending} onBack={() => router.back()} submitLabel="Ajukan Laporan" submitId="btn-submit-meninggal" />
    </form>
  )
}

// ── FORM: PINDAHAN ──────────────────────────────────────────
export function FormPindahan({ wargaList, rtList }: FormWargaKeluarProps & { rtList: Array<{ id: string; nomor: string; rw?: { nomor?: string } | unknown }> }) {
  const [pending, setPending] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setPending(true); setError('')
    const { createLaporanPindahan } = await import('@/lib/actions/laporan.actions')
    const result = await createLaporanPindahan(new FormData(e.currentTarget))
    setPending(false)
    if (result?.error) setError(result.error)
    else { setSuccess(true); setTimeout(() => router.push('/rt'), 2000) }
  }

  if (success) return <SuccessState />
  return (
    <form onSubmit={handleSubmit} id="form-pindahan" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
      <WargaSelect label="Pilih Warga" name="warga_id" required wargaList={wargaList} />
      <div className="relative">
        <label htmlFor="rt_tujuan_id" className={labelClass}>RT Tujuan <span className="text-rose-500">*</span></label>
        <div className="relative">
          <select id="rt_tujuan_id" name="rt_tujuan_id" required
            className="w-full px-4 py-3 pr-10 rounded-xl bg-white border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all text-sm appearance-none cursor-pointer">
            <option value="">-- Pilih RT Tujuan --</option>
            {(rtList as Array<{ id: string; nomor: string; rw?: { nomor?: string } | unknown }>).map(rt => (
              <option key={rt.id} value={rt.id}>
                RT {rt.nomor}{rt.rw && typeof rt.rw === 'object' && 'nomor' in rt.rw ? ` / RW ${(rt.rw as {nomor?: string}).nomor}` : ''}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>
      <Field label="Alasan Pindah (opsional)" name="alasan" placeholder="Contoh: Pindah karena menikah" />
      <Field label="Keterangan" name="keterangan" type="textarea" placeholder="Catatan tambahan (opsional)" />
      {error && <ErrorBox msg={error} />}
      <FormActions pending={pending} onBack={() => router.back()} submitLabel="Ajukan Laporan" submitId="btn-submit-pindahan" />
    </form>
  )
}

// ── FORM: PERUBAHAN DATA ────────────────────────────────────
export function FormPerubahanData({ wargaList }: FormWargaKeluarProps) {
  const [pending, setPending] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [wargaId, setWargaId] = useState('')
  const [fieldDiubah, setFieldDiubah] = useState('')
  const router = useRouter()

  const selectedWarga = wargaList.find(w => w.id === wargaId)
  const fieldOptions = [
    { value: 'nama', label: 'Nama Lengkap' },
    { value: 'alamat', label: 'Alamat' },
    { value: 'pekerjaan', label: 'Pekerjaan' },
    { value: 'status_kawin', label: 'Status Perkawinan' },
    { value: 'pendidikan', label: 'Pendidikan Terakhir' },
    { value: 'nomor_hp', label: 'Nomor HP' },
  ]
  const nilaiLama = selectedWarga && fieldDiubah
    ? String(selectedWarga[fieldDiubah as keyof Warga] ?? '')
    : ''

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setPending(true); setError('')
    const { createLaporanPerubahanData } = await import('@/lib/actions/laporan.actions')
    const result = await createLaporanPerubahanData(new FormData(e.currentTarget))
    setPending(false)
    if (result?.error) setError(result.error)
    else { setSuccess(true); setTimeout(() => router.push('/rt'), 2000) }
  }

  if (success) return <SuccessState />
  return (
    <form onSubmit={handleSubmit} id="form-perubahan-data" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
      <WargaSelect label="Pilih Warga" name="warga_id" required wargaList={wargaList} value={wargaId} onChange={setWargaId} />
      <SelectField label="Data yang Diubah" name="field_diubah" required
        options={fieldOptions} value={fieldDiubah} onChange={setFieldDiubah} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Nilai Lama</label>
          <input name="nilai_lama" type="text" value={nilaiLama} readOnly
            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-500 text-sm cursor-not-allowed" />
        </div>
        <Field label="Nilai Baru" name="nilai_baru" placeholder="Masukkan nilai baru" required />
      </div>
      <Field label="Keterangan" name="keterangan" type="textarea" placeholder="Alasan perubahan data" />
      {error && <ErrorBox msg={error} />}
      <FormActions pending={pending} onBack={() => router.back()} submitLabel="Ajukan Laporan" submitId="btn-submit-perubahan" />
    </form>
  )
}
