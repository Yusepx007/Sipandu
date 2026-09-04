'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createPenggunaRW, createPenggunaRT, toggleAktifPengguna } from '@/lib/actions/pengguna.actions'
import type { Profile } from '@/lib/types'
import { Users, UserPlus, Shield, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PenggunaClientProps {
  penggunaList: Profile[]
  rwList: Array<{ id: string; nomor: string }>
  rtList: Array<{ id: string; nomor: string; rw?: { nomor?: string } }>
}

export function PenggunaClient({ penggunaList, rwList, rtList }: PenggunaClientProps) {
  const [tab, setTab] = useState<'list' | 'tambah-rw' | 'tambah-rt'>('list')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleCreateRW(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setLoading(true); setError(''); setSuccess('')
    const result = await createPenggunaRW(new FormData(e.currentTarget))
    setLoading(false)
    if (result?.error) setError(result.error)
    else { setSuccess('Akun Ketua RW berhasil dibuat!'); setTab('list'); router.refresh() }
  }

  async function handleCreateRT(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setLoading(true); setError(''); setSuccess('')
    const result = await createPenggunaRT(new FormData(e.currentTarget))
    setLoading(false)
    if (result?.error) setError(result.error)
    else { setSuccess('Akun Ketua RT berhasil dibuat!'); setTab('list'); router.refresh() }
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Kelola Pengguna</h1>
          <p className="text-muted-foreground text-sm mt-1">Buat dan kelola akun Ketua RW dan Ketua RT</p>
        </div>
        <div className="flex gap-2">
          <button id="btn-tambah-rw" onClick={() => setTab('tambah-rw')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 hover:bg-purple-500/20 transition-all text-sm font-medium">
            <UserPlus className="w-4 h-4" /> Ketua RW
          </button>
          <button id="btn-tambah-rt" onClick={() => setTab('tambah-rt')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 transition-all text-sm font-medium">
            <UserPlus className="w-4 h-4" /> Ketua RT
          </button>
        </div>
      </div>

      {success && (
        <div className="px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />{success}
        </div>
      )}

      {/* Form Tambah RW */}
      {tab === 'tambah-rw' && (
        <form onSubmit={handleCreateRW} id="form-buat-pengguna-rw" className="bg-card rounded-2xl border border-border p-6 space-y-4">
          <h2 className="text-base font-semibold text-foreground">Buat Akun Ketua RW</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Nama Lengkap" name="nama" required placeholder="Nama ketua RW" />
            <Field label="Email" name="email" type="email" required placeholder="email@kelurahan.id" />
            <Field label="Password" name="password" type="password" required placeholder="Min. 8 karakter" />
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">RW <span className="text-rose-400">*</span></label>
              <select name="rw_id" required className="w-full px-4 py-3 rounded-xl bg-[hsl(222,40%,12%)] border border-[hsl(222,40%,20%)] text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm">
                <option value="">-- Pilih RW --</option>
                {rwList.map(rw => <option key={rw.id} value={rw.id}>RW {rw.nomor}</option>)}
              </select>
            </div>
          </div>
          {error && <div className="px-3 py-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">{error}</div>}
          <div className="flex gap-3">
            <button type="button" onClick={() => { setTab('list'); setError('') }}
              className="px-4 py-2.5 rounded-xl border border-border text-muted-foreground hover:text-foreground text-sm transition-all">Batal</button>
            <button id="btn-submit-buat-rw" type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-400 disabled:opacity-50 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Membuat...</> : 'Buat Akun'}
            </button>
          </div>
        </form>
      )}

      {/* Form Tambah RT */}
      {tab === 'tambah-rt' && (
        <form onSubmit={handleCreateRT} id="form-buat-pengguna-rt" className="bg-card rounded-2xl border border-border p-6 space-y-4">
          <h2 className="text-base font-semibold text-foreground">Buat Akun Ketua RT</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Nama Lengkap" name="nama" required placeholder="Nama ketua RT" />
            <Field label="Email" name="email" type="email" required placeholder="email@kelurahan.id" />
            <Field label="Password" name="password" type="password" required placeholder="Min. 8 karakter" />
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">RT <span className="text-rose-400">*</span></label>
              <select name="rt_id" required className="w-full px-4 py-3 rounded-xl bg-[hsl(222,40%,12%)] border border-[hsl(222,40%,20%)] text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm">
                <option value="">-- Pilih RT --</option>
                {rtList.map(rt => (
                  <option key={rt.id} value={rt.id}>
                    RT {rt.nomor}{rt.rw ? ` / RW ${rt.rw.nomor}` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {error && <div className="px-3 py-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">{error}</div>}
          <div className="flex gap-3">
            <button type="button" onClick={() => { setTab('list'); setError('') }}
              className="px-4 py-2.5 rounded-xl border border-border text-muted-foreground hover:text-foreground text-sm transition-all">Batal</button>
            <button id="btn-submit-buat-rt" type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-400 disabled:opacity-50 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Membuat...</> : 'Buat Akun'}
            </button>
          </div>
        </form>
      )}

      {/* Daftar Pengguna */}
      {tab === 'list' && (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="font-semibold text-foreground text-sm">{penggunaList.length} Pengguna Terdaftar</span>
          </div>

          {penggunaList.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              Belum ada pengguna. Tambah Ketua RW atau RT terlebih dahulu.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {penggunaList.map((p) => {
                const rt = p.rt as { nomor?: string; rw?: { nomor?: string } | unknown } | undefined
                const rw = p.rw as { nomor?: string } | undefined
                return (
                  <div key={p.id} className="flex items-center gap-4 px-5 py-4">
                    <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                      <Shield className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm truncate">{p.nama}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.role === 'ketua_rw'
                          ? `Ketua RW ${rw?.nomor}`
                          : `Ketua RT ${rt?.nomor}${rt?.rw && typeof rt.rw === 'object' && 'nomor' in rt.rw ? ` / RW ${(rt.rw as {nomor?: string}).nomor}` : ''}`}
                      </p>
                    </div>
                    <span className={cn('text-xs px-2 py-1 rounded-lg border font-medium',
                      p.is_active ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-muted-foreground bg-muted border-border')}>
                      {p.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Field({ label, name, type = 'text', required, placeholder }: {
  label: string; name: string; type?: string; required?: boolean; placeholder?: string
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="text-sm font-medium text-foreground">
        {label}{required && <span className="text-rose-400 ml-1">*</span>}
      </label>
      <input id={name} name={name} type={type} placeholder={placeholder} required={required}
        className="w-full px-4 py-3 rounded-xl bg-[hsl(222,40%,12%)] border border-[hsl(222,40%,20%)] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm" />
    </div>
  )
}
