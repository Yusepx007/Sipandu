'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createLaporanMasuk } from '@/lib/actions/laporan.actions'
import { Loader2, CheckCircle2 } from 'lucide-react'

export function FormWargaMasuk() {
  const [pending, setPending] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)
    setError('')
    const formData = new FormData(e.currentTarget)
    const result = await createLaporanMasuk(formData)
    setPending(false)

    if (result?.error) {
      setError(result.error)
    } else {
      setSuccess(true)
      setTimeout(() => router.push('/rt'), 2000)
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
        <CheckCircle2 className="w-16 h-16 text-emerald-600" />
        <h2 className="text-xl font-bold text-foreground">Laporan Berhasil Diajukan!</h2>
        <p className="text-muted-foreground text-sm">Status: Menunggu verifikasi Ketua RW</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} id="form-warga-masuk" className="space-y-5 bg-card rounded-2xl border border-border p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="NIK" name="nik" placeholder="16 digit NIK" maxLength={16} required pattern="\d{16}" />
        <Field label="Nama Lengkap" name="nama" placeholder="Nama sesuai KTP" required />
        <Field label="Tempat Lahir" name="tempat_lahir" placeholder="Kota/kabupaten" required />
        <Field label="Tanggal Lahir" name="tanggal_lahir" type="date" required />
        <SelectField label="Jenis Kelamin" name="jenis_kelamin" required options={[
          { value: 'L', label: 'Laki-laki' },
          { value: 'P', label: 'Perempuan' },
        ]} />
        <Field label="Alamat Lengkap" name="alamat" placeholder="Alamat di RT ini" required />
        <Field label="Alamat Asal" name="alamat_asal" placeholder="Alamat dari mana (opsional)" />
        <Field label="NIK Kepala Keluarga" name="nik_kepala_keluarga" placeholder="NIK KK (opsional)" maxLength={16} />
      </div>
      <Field label="Keterangan" name="keterangan" type="textarea" placeholder="Catatan tambahan (opsional)" />

      {error && <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">{error}</div>}

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={() => router.back()}
          className="flex-1 py-3 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:border-border/80 transition-all text-sm font-medium">
          Batal
        </button>
        <button id="btn-submit-masuk" type="submit" disabled={pending}
          className="flex-1 py-3 rounded-xl bg-blue-500 hover:bg-blue-400 disabled:opacity-50 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2">
          {pending ? <><Loader2 className="w-4 h-4 animate-spin" />Menyimpan...</> : 'Ajukan Laporan'}
        </button>
      </div>
    </form>
  )
}

// Reusable field components
function Field({ label, name, type = 'text', placeholder, required, maxLength, pattern }: {
  label: string; name: string; type?: string; placeholder?: string;
  required?: boolean; maxLength?: number; pattern?: string
}) {
  if (type === 'textarea') {
    return (
      <div className="space-y-1.5">
        <label htmlFor={name} className="text-sm font-medium text-foreground">{label}</label>
        <textarea id={name} name={name} placeholder={placeholder} rows={3}
          className="w-full px-4 py-3 rounded-xl bg-[hsl(222,40%,12%)] border border-[hsl(222,40%,20%)] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all text-sm resize-none" />
      </div>
    )
  }
  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="text-sm font-medium text-foreground">
        {label}{required && <span className="text-rose-600 ml-1">*</span>}
      </label>
      <input id={name} name={name} type={type} placeholder={placeholder} required={required}
        maxLength={maxLength} pattern={pattern}
        className="w-full px-4 py-3 rounded-xl bg-[hsl(222,40%,12%)] border border-[hsl(222,40%,20%)] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all text-sm" />
    </div>
  )
}

function SelectField({ label, name, required, options }: {
  label: string; name: string; required?: boolean
  options: { value: string; label: string }[]
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="text-sm font-medium text-foreground">
        {label}{required && <span className="text-rose-600 ml-1">*</span>}
      </label>
      <select id={name} name={name} required={required}
        className="w-full px-4 py-3 rounded-xl bg-[hsl(222,40%,12%)] border border-[hsl(222,40%,20%)] text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all text-sm">
        <option value="">-- Pilih --</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}

