'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, CheckCircle2, ChevronDown, Upload, FileText, UserCheck, UserMinus, Baby, Heart, ArrowRightLeft, RefreshCw } from 'lucide-react'
import type { Warga } from '@/lib/types'
import { cn } from '@/lib/utils'

type JenisLaporan = 'masuk' | 'keluar' | 'lahir' | 'meninggal' | 'pindahan' | 'perubahan_data'

interface WargaItem extends Partial<Warga> {
  rt_id?: string
  no_kk?: string
  agama?: string
  pekerjaan?: string
  status_kawin?: string
  pendidikan?: string
  nomor_hp?: string
}

interface UnifiedLaporanFormProps {
  wargaList: WargaItem[]
  rtList?: Array<{ id: string; nomor: string; rw?: { nomor?: string } | unknown }>
  allRtList?: Array<{ id: string; nomor: string; rw?: { nomor?: string } | unknown }>
  rtId?: string
  showRtSelector?: boolean
  redirectPath?: string
}

const inputClass = 'w-full px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400 transition-all text-sm'
const labelClass = 'block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5'

function Field({
  label, name, type = 'text', placeholder, required, maxLength, readOnly, defaultValue, value, onChange, pattern
}: {
  label: string; name: string; type?: string; placeholder?: string
  required?: boolean; maxLength?: number; readOnly?: boolean; defaultValue?: string
  value?: string; onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void; pattern?: string
}) {
  if (type === 'textarea') return (
    <div>
      <label htmlFor={name} className={labelClass}>
        {label}{required && <span className="text-rose-500 ml-1">*</span>}
      </label>
      <textarea id={name} name={name} placeholder={placeholder} rows={3} value={value} onChange={onChange}
        className="w-full px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400 transition-all text-sm resize-none" />
    </div>
  )
  return (
    <div>
      <label htmlFor={name} className={labelClass}>
        {label}{required && <span className="text-rose-500 ml-1">*</span>}
      </label>
      <input id={name} name={name} type={type} placeholder={placeholder}
        required={required} maxLength={maxLength} readOnly={readOnly} defaultValue={defaultValue}
        value={value} onChange={onChange} pattern={pattern}
        className={readOnly
          ? 'w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-500 text-sm cursor-not-allowed font-medium'
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
          className="w-full px-4 py-2.5 pr-10 rounded-xl bg-white border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400 transition-all text-sm appearance-none cursor-pointer">
          <option value="">-- Pilih --</option>
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>
    </div>
  )
}

export function UnifiedLaporanForm({
  wargaList,
  rtList = [],
  allRtList = [],
  rtId = '',
  showRtSelector = false,
  redirectPath = '/rt',
}: UnifiedLaporanFormProps) {
  const router = useRouter()
  const [selectedRtId, setSelectedRtId] = useState(rtId || '')
  const [jenis, setJenis] = useState<JenisLaporan | ''>('')
  const [wargaId, setWargaId] = useState('')
  const [fieldDiubah, setFieldDiubah] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Filter warga sesuai RT aktif (jika showRtSelector aktif)
  const availableWarga = useMemo(() => {
    if (showRtSelector) {
      return selectedRtId ? wargaList.filter(w => w.rt_id === selectedRtId) : []
    }
    return wargaList
  }, [showRtSelector, selectedRtId, wargaList])

  const selectedWarga = useMemo(() => availableWarga.find(w => w.id === wargaId), [availableWarga, wargaId])

  const nilaiLama = selectedWarga && fieldDiubah
    ? String(selectedWarga[fieldDiubah as keyof WargaItem] ?? '')
    : ''

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (showRtSelector && !selectedRtId) { setError('Pilih RT terlebih dahulu'); return }
    if (!jenis) { setError('Pilih jenis laporan terlebih dahulu'); return }
    setPending(true); setError('')

    try {
      const formData = new FormData(e.currentTarget)
      if (showRtSelector && selectedRtId) {
        formData.set('rt_id_override', selectedRtId)
      }

      const actions = await import('@/lib/actions/laporan.actions')
      let result: { error?: string; success?: boolean } | undefined

      if (jenis === 'masuk') result = await actions.createLaporanMasuk(formData)
      else if (jenis === 'keluar') result = await actions.createLaporanKeluar(formData)
      else if (jenis === 'lahir') result = await actions.createLaporanLahir(formData)
      else if (jenis === 'meninggal') result = await actions.createLaporanMeninggal(formData)
      else if (jenis === 'pindahan') result = await actions.createLaporanPindahan(formData)
      else if (jenis === 'perubahan_data') result = await actions.createLaporanPerubahanData(formData)

      if (result?.error) { setError(result.error); setPending(false) }
      else { setSuccess(true); setTimeout(() => router.push(redirectPath), 2000) }
    } catch {
      setError('Terjadi kesalahan. Coba lagi.'); setPending(false)
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-4 bg-white rounded-2xl border border-gray-100 shadow-sm animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-600 animate-bounce" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Laporan Berhasil Diajukan!</h2>
        <p className="text-gray-500 text-sm">Laporan telah berhasil tersimpan dan siap diproses.</p>
        <p className="text-xs text-gray-400">Mengalihkan halaman...</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">

      {/* ── Langkah 1: Pilih RT (jika RW/Admin) ── */}
      {showRtSelector && (
        <div className="p-4 bg-blue-50/70 rounded-xl border border-blue-100">
          <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2">Langkah 1 — Pilih RT Pelapor</p>
          <SelectBox label="Pilih RT/RW" name="rt_selector" required
            value={selectedRtId}
            onChange={v => { setSelectedRtId(v); setWargaId(''); }}
            options={rtList.map(rt => {
              const rwNomor = rt.rw && typeof rt.rw === 'object' && 'nomor' in rt.rw ? (rt.rw as { nomor?: string }).nomor : undefined
              return {
                value: rt.id,
                label: rwNomor ? `RT ${rt.nomor} / RW ${rwNomor}` : `RT ${rt.nomor}`
              }
            })} />
        </div>
      )}

      {/* ── Langkah 2: Jenis Laporan Cards ── */}
      {(!showRtSelector || selectedRtId) && (
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">
            Pilih Jenis Laporan <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { id: 'masuk',          label: 'Warga Masuk',   icon: <UserCheck className="w-5 h-5 text-blue-600" /> },
              { id: 'keluar',         label: 'Warga Keluar',  icon: <UserMinus className="w-5 h-5 text-rose-600" /> },
              { id: 'lahir',          label: 'Kelahiran',     icon: <Baby className="w-5 h-5 text-emerald-600" /> },
              { id: 'meninggal',      label: 'Kematian',      icon: <Heart className="w-5 h-5 text-slate-600" /> },
              { id: 'pindahan',       label: 'Pindahan',      icon: <ArrowRightLeft className="w-5 h-5 text-purple-600" /> },
              { id: 'perubahan_data', label: 'Perubahan Data',icon: <RefreshCw className="w-5 h-5 text-cyan-600" /> },
            ].map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => { setJenis(item.id as JenisLaporan); setWargaId(''); setFieldDiubah(''); }}
                className={cn(
                  'flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all',
                  jenis === item.id
                    ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20 text-blue-900 font-semibold shadow-sm'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50 text-gray-700'
                )}
              >
                <div className="p-2 rounded-lg bg-white border border-gray-100 shadow-xs flex-shrink-0">
                  {item.icon}
                </div>
                <span className="text-xs sm:text-sm font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {jenis && <div className="border-t border-gray-100 my-4" />}

      {/* ════════════════════════════════════════════════════════ */}
      {/* 1. WARGA MASUK */}
      {/* ════════════════════════════════════════════════════════ */}
      {jenis === 'masuk' && (
        <div className="space-y-4 animate-fade-in">
          <h3 className="text-sm font-bold text-gray-900 border-l-4 border-blue-600 pl-2">Form Data Warga Masuk</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Nama Lengkap" name="nama" placeholder="Nama sesuai KTP" required />
            <Field label="NIK" name="nik" placeholder="16 digit NIK" maxLength={16} required pattern="\d{16}" />
            <Field label="No. KK" name="no_kk" placeholder="16 digit No. KK (opsional)" maxLength={16} />
            <SelectBox label="Jenis Kelamin" name="jenis_kelamin" required options={[
              { value: 'L', label: 'Laki-laki' }, { value: 'P', label: 'Perempuan' }
            ]} />
            <Field label="Tempat Lahir" name="tempat_lahir" placeholder="Kota/Kabupaten" required />
            <Field label="Tanggal Lahir" name="tanggal_lahir" type="date" required />
            <Field label="Alamat Asal" name="alamat_asal" placeholder="Alamat lengkap kota asal" required />
            <Field label="Alamat Tinggal Sekarang" name="alamat" placeholder="Alamat domisili RT sekarang" required />
            <SelectBox label="Status Hubungan Keluarga" name="hubungan_keluarga" options={[
              { value: 'Kepala Keluarga', label: 'Kepala Keluarga' },
              { value: 'Istri', label: 'Istri' },
              { value: 'Anak', label: 'Anak' },
              { value: 'Cucu', label: 'Cucu' },
              { value: 'Orang Tua', label: 'Orang Tua' },
              { value: 'Famili Lain', label: 'Famili Lain' },
            ]} />
            <SelectBox label="Agama" name="agama" options={[
              { value: 'Islam', label: 'Islam' },
              { value: 'Kristen', label: 'Kristen' },
              { value: 'Katolik', label: 'Katolik' },
              { value: 'Hindu', label: 'Hindu' },
              { value: 'Buddha', label: 'Buddha' },
              { value: 'Khonghucu', label: 'Khonghucu' },
            ]} />
            <SelectBox label="Status Perkawinan" name="status_kawin" options={[
              { value: 'Belum Kawin', label: 'Belum Kawin' },
              { value: 'Kawin', label: 'Kawin' },
              { value: 'Cerai Hidup', label: 'Cerai Hidup' },
              { value: 'Cerai Mati', label: 'Cerai Mati' },
            ]} />
            <Field label="Pekerjaan" name="pekerjaan" placeholder="Contoh: Karyawan Swasta" />
            <Field label="Nomor HP" name="nomor_hp" placeholder="Contoh: 08123456789" />
            <Field label="Tanggal Masuk" name="tanggal_masuk" type="date" defaultValue={new Date().toISOString().split('T')[0]} />
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════ */}
      {/* 2. WARGA KELUAR */}
      {/* ════════════════════════════════════════════════════════ */}
      {jenis === 'keluar' && (
        <div className="space-y-4 animate-fade-in">
          <h3 className="text-sm font-bold text-gray-900 border-l-4 border-rose-600 pl-2">Form Data Warga Keluar</h3>
          <SelectBox label="Pilih Warga / NIK" name="warga_id" required
            value={wargaId} onChange={setWargaId}
            options={availableWarga.map(w => ({ value: w.id!, label: `${w.nama} — NIK: ${w.nik}` }))} />

          {selectedWarga && (
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs space-y-1">
              <p><span className="font-semibold text-gray-700">Nama:</span> {selectedWarga.nama}</p>
              <p><span className="font-semibold text-gray-700">NIK:</span> {selectedWarga.nik}</p>
              <p><span className="font-semibold text-gray-700">No. KK:</span> {selectedWarga.no_kk || '-'}</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Alamat Tujuan" name="alamat_tujuan" placeholder="Alamat lengkap kota/kabupaten tujuan" required />
            <Field label="Alasan Pindah" name="alasan_pindah" placeholder="Contoh: Pindah Tugas / Ikut Keluarga" />
            <Field label="Tanggal Keluar" name="tanggal_keluar" type="date" defaultValue={new Date().toISOString().split('T')[0]} />
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════ */}
      {/* 3. WARGA LAHIR */}
      {/* ════════════════════════════════════════════════════════ */}
      {jenis === 'lahir' && (
        <div className="space-y-4 animate-fade-in">
          <h3 className="text-sm font-bold text-gray-900 border-l-4 border-emerald-600 pl-2">Form Data Kelahiran Bayi</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Nama Bayi" name="nama" placeholder="Nama lengkap bayi" required />
            <SelectBox label="Jenis Kelamin" name="jenis_kelamin" required options={[
              { value: 'L', label: 'Laki-laki' }, { value: 'P', label: 'Perempuan' }
            ]} />
            <Field label="Tempat Lahir" name="tempat_lahir" placeholder="Kota/Kabupaten / Rumah Sakit" />
            <Field label="Tanggal Lahir" name="tanggal_lahir" type="date" required />
            <Field label="Nama Ayah" name="nama_ayah" placeholder="Nama lengkap ayah" required />
            <Field label="NIK Ayah" name="nik_ayah" placeholder="16 digit NIK ayah" maxLength={16} />
            <Field label="Nama Ibu" name="nama_ibu" placeholder="Nama lengkap ibu" required />
            <Field label="NIK Ibu" name="nik_ibu" placeholder="16 digit NIK ibu" maxLength={16} />
            <Field label="No. KK" name="no_kk" placeholder="16 digit No. Kartu Keluarga" maxLength={16} />
            <Field label="Tanggal Pelaporan" name="tanggal_pelaporan" type="date" defaultValue={new Date().toISOString().split('T')[0]} />
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════ */}
      {/* 4. WARGA MENINGGAL */}
      {/* ════════════════════════════════════════════════════════ */}
      {jenis === 'meninggal' && (
        <div className="space-y-4 animate-fade-in">
          <h3 className="text-sm font-bold text-gray-900 border-l-4 border-slate-600 pl-2">Form Data Warga Meninggal</h3>
          <SelectBox label="Pilih Warga / NIK" name="warga_id" required
            value={wargaId} onChange={setWargaId}
            options={availableWarga.map(w => ({ value: w.id!, label: `${w.nama} — NIK: ${w.nik}` }))} />

          {selectedWarga && (
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs space-y-1">
              <p><span className="font-semibold text-gray-700">Nama:</span> {selectedWarga.nama}</p>
              <p><span className="font-semibold text-gray-700">NIK:</span> {selectedWarga.nik}</p>
              <p><span className="font-semibold text-gray-700">Jenis Kelamin:</span> {selectedWarga.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Tanggal Meninggal" name="tanggal_meninggal" type="date" required />
            <Field label="Tempat Meninggal" name="tempat_meninggal" placeholder="Contoh: RSUD / Rumah Duka" />
            <Field label="Penyebab Meninggal" name="penyebab" placeholder="Contoh: Sakit Usia Lanjut (opsional)" />
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════ */}
      {/* 5. WARGA PINDAHAN */}
      {/* ════════════════════════════════════════════════════════ */}
      {jenis === 'pindahan' && (
        <div className="space-y-4 animate-fade-in">
          <h3 className="text-sm font-bold text-gray-900 border-l-4 border-purple-600 pl-2">Form Data Warga Pindahan</h3>
          <SelectBox label="Pilih Warga / NIK" name="warga_id" required
            value={wargaId} onChange={setWargaId}
            options={availableWarga.map(w => ({ value: w.id!, label: `${w.nama} — NIK: ${w.nik}` }))} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Alamat Asal" name="alamat_asal" placeholder="Alamat domisili sebelumnya" defaultValue={selectedWarga?.alamat} />
            <Field label="Alamat Tujuan" name="alamat_tujuan" placeholder="Alamat tujuan baru" />
            {(allRtList.length > 0 || rtList.length > 0) && (
              <SelectBox label="RT Tujuan (Internal Kelurahan)" name="rt_tujuan_id"
                options={(allRtList.length > 0 ? allRtList : rtList).map(rt => {
                  const rwNomor = rt.rw && typeof rt.rw === 'object' && 'nomor' in rt.rw ? (rt.rw as { nomor?: string }).nomor : undefined
                  return {
                    value: rt.id,
                    label: rwNomor ? `RT ${rt.nomor} / RW ${rwNomor}` : `RT ${rt.nomor}`
                  }
                })} />
            )}
            <Field label="Tanggal Pindah" name="tanggal_pindah" type="date" defaultValue={new Date().toISOString().split('T')[0]} />
          </div>

          <Field label="Anggota Keluarga yang Ikut Pindah" name="anggota_keluarga_ikut"
            placeholder="Contoh: 1 Istri dan 2 Anak (sebutkan nama/NIK jika ada)" />
        </div>
      )}

      {/* ════════════════════════════════════════════════════════ */}
      {/* 6. PERUBAHAN DATA */}
      {/* ════════════════════════════════════════════════════════ */}
      {jenis === 'perubahan_data' && (
        <div className="space-y-4 animate-fade-in">
          <h3 className="text-sm font-bold text-gray-900 border-l-4 border-cyan-600 pl-2">Form Perubahan Data Warga</h3>
          <SelectBox label="Pilih Warga / NIK" name="warga_id" required
            value={wargaId} onChange={setWargaId}
            options={availableWarga.map(w => ({ value: w.id!, label: `${w.nama} — NIK: ${w.nik}` }))} />

          <SelectBox label="Data yang Ingin Diubah" name="field_diubah" required
            value={fieldDiubah} onChange={setFieldDiubah}
            options={[
              { value: 'nama',         label: 'Nama Lengkap' },
              { value: 'no_kk',        label: 'Nomor Kartu Keluarga (KK)' },
              { value: 'alamat',       label: 'Alamat' },
              { value: 'pekerjaan',    label: 'Pekerjaan' },
              { value: 'status_kawin', label: 'Status Perkawinan' },
              { value: 'agama',        label: 'Agama' },
              { value: 'pendidikan',   label: 'Pendidikan Terakhir' },
              { value: 'nomor_hp',     label: 'Nomor HP' },
            ]} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Data Lama (otomatis)</label>
              <input name="nilai_lama" type="text" value={nilaiLama} readOnly
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-500 text-sm cursor-not-allowed font-medium" />
            </div>
            <Field label="Data Baru" name="nilai_baru" placeholder="Masukkan data baru" required />
          </div>

          <Field label="Alasan Perubahan" name="alasan" placeholder="Contoh: Penyesuaian KTP terbaru" />
        </div>
      )}

      {/* ════════════════════════════════════════════════════════ */}
      {/* COMMON FIELDS: DOKUMEN & KETERANGAN */}
      {/* ════════════════════════════════════════════════════════ */}
      {jenis && (
        <div className="space-y-4 pt-2 border-t border-gray-100">
          <div>
            <label className={labelClass}>Upload Dokumen Pendukung (Opsional)</label>
            <div className="flex items-center gap-3">
              <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 transition-all cursor-pointer text-xs font-medium text-gray-600">
                <Upload className="w-4 h-4 text-gray-400" />
                <span>Pilih file dokumen (PDF / Foto KTP / KK / Surat)</span>
                <input type="file" name="dokumen_file" className="hidden" accept="image/*,.pdf" />
              </label>
            </div>
          </div>

          <Field label="Keterangan Tambahan (Opsional)" name="keterangan" type="textarea"
            placeholder="Catatan atau informasi tambahan lain yang relevan..." />
        </div>
      )}

      {error && (
        <div className="px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-sm font-medium">{error}</div>
      )}

      {/* ── Action Buttons ── */}
      {jenis && (
        <div className="flex gap-3 pt-4 border-t border-gray-100">
          <button type="button" onClick={() => router.back()}
            className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all text-sm font-semibold">
            Batal
          </button>
          <button id="btn-submit-laporan-unified" type="submit" disabled={pending || !jenis}
            className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-sm">
            {pending ? <><Loader2 className="w-4 h-4 animate-spin" />Menyimpan Laporan...</> : 'Kirim Laporan'}
          </button>
        </div>
      )}
    </form>
  )
}
