'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createLaporanKeluar } from '@/lib/actions/laporan.actions'
import { Loader2, CheckCircle2, Search } from 'lucide-react'
import type { Warga } from '@/lib/types'

interface FormWargaKeluarProps {
  wargaList: Partial<Warga>[]
  rtList: unknown[]
  rtId: string
}

export function FormWargaKeluar({ wargaList }: FormWargaKeluarProps) {
  const [pending, setPending] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Partial<Warga> | null>(null)
  const router = useRouter()

  const filtered = wargaList.filter(
    (w) =>
      w.nama?.toLowerCase().includes(search.toLowerCase()) ||
      w.nik?.includes(search)
  )

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!selected) { setError('Pilih warga terlebih dahulu'); return }
    setPending(true)
    setError('')
    const formData = new FormData(e.currentTarget)
    formData.set('warga_id', selected.id!)
    const result = await createLaporanKeluar(formData)
    setPending(false)
    if (result?.error) { setError(result.error) } 
    else { setSuccess(true); setTimeout(() => router.push('/rt'), 2000) }
  }

  if (success) return <SuccessState />

  return (
    <form onSubmit={handleSubmit} id="form-warga-keluar" className="space-y-5 bg-card rounded-2xl border border-border p-6">
      {/* Cari warga */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Pilih Warga <span className="text-rose-400">*</span></label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama atau NIK..."
            className="w-full pl-10 pr-4 py-3 rounded-xl input-style"
          />
        </div>
        {search && (
          <div className="max-h-48 overflow-y-auto rounded-xl border border-border bg-[hsl(222,45%,10%)] divide-y divide-border">
            {filtered.length === 0 ? (
              <p className="px-4 py-3 text-sm text-muted-foreground">Tidak ditemukan</p>
            ) : filtered.map((w) => (
              <button key={w.id} type="button"
                onClick={() => { setSelected(w); setSearch('') }}
                className="w-full text-left px-4 py-3 hover:bg-accent transition-colors">
                <p className="text-sm font-medium text-foreground">{w.nama}</p>
                <p className="text-xs text-muted-foreground">{w.nik}</p>
              </button>
            ))}
          </div>
        )}
        {selected && (
          <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <div>
              <p className="text-sm font-medium text-blue-300">{selected.nama}</p>
              <p className="text-xs text-blue-400/70">{selected.nik}</p>
            </div>
            <button type="button" onClick={() => setSelected(null)} className="text-xs text-muted-foreground hover:text-rose-400">Ganti</button>
          </div>
        )}
      </div>

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

export function FormLahir() {
  const [pending, setPending] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setPending(true); setError('')
    const formData = new FormData(e.currentTarget)
    const { createLaporanLahir } = await import('@/lib/actions/laporan.actions')
    const result = await createLaporanLahir(formData)
    setPending(false)
    if (result?.error) setError(result.error)
    else { setSuccess(true); setTimeout(() => router.push('/rt'), 2000) }
  }

  if (success) return <SuccessState />

  return (
    <form onSubmit={handleSubmit} id="form-lahir" className="space-y-5 bg-card rounded-2xl border border-border p-6">
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

export function FormMeninggal({ wargaList }: FormWargaKeluarProps) {
  const [pending, setPending] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Partial<Warga> | null>(null)
  const router = useRouter()
  const filtered = wargaList.filter(w => w.nama?.toLowerCase().includes(search.toLowerCase()) || w.nik?.includes(search))

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!selected) { setError('Pilih warga terlebih dahulu'); return }
    setPending(true); setError('')
    const formData = new FormData(e.currentTarget)
    formData.set('warga_id', selected.id!)
    const { createLaporanMeninggal } = await import('@/lib/actions/laporan.actions')
    const result = await createLaporanMeninggal(formData)
    setPending(false)
    if (result?.error) setError(result.error)
    else { setSuccess(true); setTimeout(() => router.push('/rt'), 2000) }
  }

  if (success) return <SuccessState />

  return (
    <form onSubmit={handleSubmit} id="form-meninggal" className="space-y-5 bg-card rounded-2xl border border-border p-6">
      <WargaSelector wargaList={wargaList} search={search} setSearch={setSearch} selected={selected} setSelected={setSelected} filtered={filtered} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Tanggal Meninggal" name="tanggal_meninggal" type="date" required />
        <Field label="Penyebab (opsional)" name="penyebab" placeholder="Contoh: Sakit" />
      </div>
      <Field label="Keterangan" name="keterangan" type="textarea" placeholder="Catatan tambahan (opsional)" />
      {error && <ErrorBox msg={error} />}
      <FormActions pending={pending} onBack={() => router.back()} submitLabel="Ajukan Laporan" submitId="btn-submit-meninggal" />
    </form>
  )
}

export function FormPindahan({ wargaList, rtList }: FormWargaKeluarProps & { rtList: Array<{ id: string; nomor: string; rw?: { nomor?: string } | unknown }> }) {
  const [pending, setPending] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Partial<Warga> | null>(null)
  const router = useRouter()
  const filtered = wargaList.filter(w => w.nama?.toLowerCase().includes(search.toLowerCase()) || w.nik?.includes(search))

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!selected) { setError('Pilih warga terlebih dahulu'); return }
    setPending(true); setError('')
    const formData = new FormData(e.currentTarget)
    formData.set('warga_id', selected.id!)
    const { createLaporanPindahan } = await import('@/lib/actions/laporan.actions')
    const result = await createLaporanPindahan(formData)
    setPending(false)
    if (result?.error) setError(result.error)
    else { setSuccess(true); setTimeout(() => router.push('/rt'), 2000) }
  }

  if (success) return <SuccessState />

  return (
    <form onSubmit={handleSubmit} id="form-pindahan" className="space-y-5 bg-card rounded-2xl border border-border p-6">
      <WargaSelector wargaList={wargaList} search={search} setSearch={setSearch} selected={selected} setSelected={setSelected} filtered={filtered} />
      <div className="space-y-1.5">
        <label htmlFor="rt_tujuan_id" className="text-sm font-medium text-foreground">RT Tujuan <span className="text-rose-400">*</span></label>
        <select id="rt_tujuan_id" name="rt_tujuan_id" required className="w-full px-4 py-3 rounded-xl bg-[hsl(222,40%,12%)] border border-[hsl(222,40%,20%)] text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm">
          <option value="">-- Pilih RT Tujuan --</option>
          {(rtList as Array<{ id: string; nomor: string; rw?: { nomor?: string } | unknown }>).map((rt) => (
            <option key={rt.id} value={rt.id}>
              RT {rt.nomor} {rt.rw && typeof rt.rw === 'object' && 'nomor' in rt.rw ? `/ RW ${(rt.rw as {nomor?: string}).nomor}` : ''}
            </option>
          ))}
        </select>
      </div>
      <Field label="Alasan Pindah (opsional)" name="alasan" placeholder="Contoh: Pindah karena menikah" />
      <Field label="Keterangan" name="keterangan" type="textarea" placeholder="Catatan tambahan (opsional)" />
      {error && <ErrorBox msg={error} />}
      <FormActions pending={pending} onBack={() => router.back()} submitLabel="Ajukan Laporan" submitId="btn-submit-pindahan" />
    </form>
  )
}

export function FormPerubahanData({ wargaList }: FormWargaKeluarProps) {
  const [pending, setPending] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Partial<Warga> | null>(null)
  const [fieldDiubah, setFieldDiubah] = useState('')
  const router = useRouter()
  const filtered = wargaList.filter(w => w.nama?.toLowerCase().includes(search.toLowerCase()) || w.nik?.includes(search))

  const fieldOptions = [
    { value: 'nama', label: 'Nama Lengkap' },
    { value: 'alamat', label: 'Alamat' },
    { value: 'pekerjaan', label: 'Pekerjaan' },
    { value: 'status_kawin', label: 'Status Perkawinan' },
    { value: 'pendidikan', label: 'Pendidikan Terakhir' },
    { value: 'nomor_hp', label: 'Nomor HP' },
  ]

  const nilaiLama = selected && fieldDiubah
    ? String(selected[fieldDiubah as keyof Warga] ?? '')
    : ''

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!selected) { setError('Pilih warga terlebih dahulu'); return }
    setPending(true); setError('')
    const formData = new FormData(e.currentTarget)
    formData.set('warga_id', selected.id!)
    const { createLaporanPerubahanData } = await import('@/lib/actions/laporan.actions')
    const result = await createLaporanPerubahanData(formData)
    setPending(false)
    if (result?.error) setError(result.error)
    else { setSuccess(true); setTimeout(() => router.push('/rt'), 2000) }
  }

  if (success) return <SuccessState />

  return (
    <form onSubmit={handleSubmit} id="form-perubahan-data" className="space-y-5 bg-card rounded-2xl border border-border p-6">
      <WargaSelector wargaList={wargaList} search={search} setSearch={setSearch} selected={selected} setSelected={setSelected} filtered={filtered} />
      <div className="space-y-1.5">
        <label htmlFor="field_diubah" className="text-sm font-medium text-foreground">Field yang Diubah <span className="text-rose-400">*</span></label>
        <select id="field_diubah" name="field_diubah" required value={fieldDiubah} onChange={e => setFieldDiubah(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-[hsl(222,40%,12%)] border border-[hsl(222,40%,20%)] text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm">
          <option value="">-- Pilih field --</option>
          {fieldOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="nilai_lama" className="text-sm font-medium text-foreground">Nilai Lama</label>
          <input id="nilai_lama" name="nilai_lama" type="text" value={nilaiLama} readOnly
            className="w-full px-4 py-3 rounded-xl bg-[hsl(222,40%,8%)] border border-[hsl(222,40%,15%)] text-muted-foreground text-sm cursor-not-allowed" />
        </div>
        <Field label="Nilai Baru" name="nilai_baru" placeholder="Nilai yang diperbarui" required />
      </div>
      <Field label="Keterangan" name="keterangan" type="textarea" placeholder="Alasan perubahan data" />
      {error && <ErrorBox msg={error} />}
      <FormActions pending={pending} onBack={() => router.back()} submitLabel="Ajukan Laporan" submitId="btn-submit-perubahan" />
    </form>
  )
}

// ============================================================
// SHARED COMPONENTS
// ============================================================

function WargaSelector({ wargaList, search, setSearch, selected, setSelected, filtered }: {
  wargaList: Partial<Warga>[]; search: string; setSearch: (v: string) => void
  selected: Partial<Warga> | null; setSelected: (w: Partial<Warga> | null) => void
  filtered: Partial<Warga>[]
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">Pilih Warga <span className="text-rose-400">*</span></label>
      {!selected ? (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Cari nama atau NIK..." className="w-full pl-10 pr-4 py-3 rounded-xl bg-[hsl(222,40%,12%)] border border-[hsl(222,40%,20%)] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm" />
          </div>
          {search && (
            <div className="max-h-48 overflow-y-auto rounded-xl border border-border bg-[hsl(222,45%,10%)] divide-y divide-border">
              {filtered.length === 0 ? (
                <p className="px-4 py-3 text-sm text-muted-foreground">Tidak ditemukan</p>
              ) : filtered.map(w => (
                <button key={w.id} type="button" onClick={() => { setSelected(w); setSearch('') }}
                  className="w-full text-left px-4 py-3 hover:bg-accent transition-colors">
                  <p className="text-sm font-medium text-foreground">{w.nama}</p>
                  <p className="text-xs text-muted-foreground">{w.nik}</p>
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
          <div>
            <p className="text-sm font-medium text-blue-300">{selected.nama}</p>
            <p className="text-xs text-blue-400/70">{selected.nik}</p>
          </div>
          <button type="button" onClick={() => setSelected(null)} className="text-xs text-muted-foreground hover:text-rose-400 transition-colors">Ganti</button>
        </div>
      )}
    </div>
  )
}

function Field({ label, name, type = 'text', placeholder, required, maxLength }: {
  label: string; name: string; type?: string; placeholder?: string; required?: boolean; maxLength?: number
}) {
  if (type === 'textarea') return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="text-sm font-medium text-foreground">{label}</label>
      <textarea id={name} name={name} placeholder={placeholder} rows={3}
        className="w-full px-4 py-3 rounded-xl bg-[hsl(222,40%,12%)] border border-[hsl(222,40%,20%)] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm resize-none" />
    </div>
  )
  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="text-sm font-medium text-foreground">
        {label}{required && <span className="text-rose-400 ml-1">*</span>}
      </label>
      <input id={name} name={name} type={type} placeholder={placeholder} required={required} maxLength={maxLength}
        className="w-full px-4 py-3 rounded-xl bg-[hsl(222,40%,12%)] border border-[hsl(222,40%,20%)] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm" />
    </div>
  )
}

function SelectField({ label, name, required, options }: {
  label: string; name: string; required?: boolean; options: { value: string; label: string }[]
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="text-sm font-medium text-foreground">
        {label}{required && <span className="text-rose-400 ml-1">*</span>}
      </label>
      <select id={name} name={name} required={required}
        className="w-full px-4 py-3 rounded-xl bg-[hsl(222,40%,12%)] border border-[hsl(222,40%,20%)] text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm">
        <option value="">-- Pilih --</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

function ErrorBox({ msg }: { msg: string }) {
  return <div className="px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm">{msg}</div>
}

function FormActions({ pending, onBack, submitLabel, submitId }: {
  pending: boolean; onBack: () => void; submitLabel: string; submitId: string
}) {
  return (
    <div className="flex gap-3 pt-2">
      <button type="button" onClick={onBack}
        className="flex-1 py-3 rounded-xl border border-border text-muted-foreground hover:text-foreground transition-all text-sm font-medium">
        Batal
      </button>
      <button id={submitId} type="submit" disabled={pending}
        className="flex-1 py-3 rounded-xl bg-blue-500 hover:bg-blue-400 disabled:opacity-50 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2">
        {pending ? <><Loader2 className="w-4 h-4 animate-spin" />Menyimpan...</> : submitLabel}
      </button>
    </div>
  )
}

function SuccessState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-4 bg-card rounded-2xl border border-border">
      <CheckCircle2 className="w-16 h-16 text-emerald-400" />
      <h2 className="text-xl font-bold text-foreground">Laporan Berhasil Diajukan!</h2>
      <p className="text-muted-foreground text-sm">Status: Menunggu verifikasi Ketua RW</p>
      <p className="text-xs text-muted-foreground">Mengalihkan ke dashboard...</p>
    </div>
  )
}
