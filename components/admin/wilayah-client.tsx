'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createRW, createRT } from '@/lib/actions/wilayah.actions'
import { MapPin, Plus, Loader2, CheckCircle2 } from 'lucide-react'

export interface RTItem {
  id: string
  nomor: string
  nama_ketua: string | null
}

export interface RWWithRT {
  id: string
  nomor: string
  nama_ketua: string | null
  rt: RTItem[]
}

interface WilayahClientProps {
  rwList: RWWithRT[]
  kelurahanNama: string
}

export function WilayahClient({ rwList: initialRwList, kelurahanNama }: WilayahClientProps) {
  const [pendingRW, setPendingRW] = useState(false)
  const [pendingRT, setPendingRT] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const router = useRouter()

  async function handleCreateRW(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPendingRW(true); setErrorMsg(''); setSuccessMsg('')
    const result = await createRW(new FormData(e.currentTarget))
    setPendingRW(false)
    if (result?.error) setErrorMsg(result.error)
    else { setSuccessMsg('RW berhasil ditambahkan!'); router.refresh() ;(e.target as HTMLFormElement).reset() }
  }

  async function handleCreateRT(e: React.FormEvent<HTMLFormElement>, rwId: string) {
    e.preventDefault()
    setPendingRT(rwId); setErrorMsg(''); setSuccessMsg('')
    const result = await createRT(new FormData(e.currentTarget))
    setPendingRT(null)
    if (result?.error) setErrorMsg(result.error)
    else { setSuccessMsg('RT berhasil ditambahkan!'); router.refresh(); (e.target as HTMLFormElement).reset() }
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Master Wilayah</h1>
        <p className="text-muted-foreground text-sm mt-1">Kelola data RW dan RT di Kelurahan {kelurahanNama}</p>
      </div>

      {errorMsg && (
        <div className="px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm">{errorMsg}</div>
      )}
      {successMsg && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm">
          <CheckCircle2 className="w-4 h-4" />{successMsg}
        </div>
      )}

      {/* Form Tambah RW */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4 text-blue-400" /> Tambah RW Baru
        </h2>
        <form onSubmit={handleCreateRW} className="flex gap-3 flex-wrap" id="form-tambah-rw">
          <div className="flex-1 min-w-32">
            <input name="nomor" placeholder="Nomor RW (cth: 04)" required
              className="w-full px-4 py-2.5 rounded-xl bg-[hsl(222,40%,12%)] border border-[hsl(222,40%,20%)] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm" />
          </div>
          <div className="flex-1 min-w-48">
            <input name="nama_ketua" placeholder="Nama Ketua RW (opsional)"
              className="w-full px-4 py-2.5 rounded-xl bg-[hsl(222,40%,12%)] border border-[hsl(222,40%,20%)] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm" />
          </div>
          <button id="btn-tambah-rw" type="submit" disabled={pendingRW}
            className="px-5 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-400 disabled:opacity-50 text-white text-sm font-semibold transition-all flex items-center gap-2">
            {pendingRW ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Tambah RW
          </button>
        </form>
      </div>

      {/* Daftar RW & RT */}
      <div className="space-y-4">
        {initialRwList.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground bg-card rounded-2xl border border-border">
            <MapPin className="w-8 h-8 mx-auto mb-3 opacity-50" />
            <p>Belum ada RW yang terdaftar</p>
          </div>
        ) : initialRwList.map((rw) => (
          <div key={rw.id} className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-[hsl(222,45%,9%)]">
              <div className="w-8 h-8 rounded-lg bg-purple-500/15 border border-purple-500/20 flex items-center justify-center">
                <span className="text-purple-400 text-xs font-bold">{rw.nomor}</span>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground text-sm">RW {rw.nomor}</p>
                {rw.nama_ketua && <p className="text-xs text-muted-foreground">{rw.nama_ketua}</p>}
              </div>
              <span className="text-xs text-muted-foreground">{rw.rt?.length || 0} RT</span>
            </div>

            <div className="p-4 space-y-2">
              {(rw.rt || []).map((rt) => (
                <div key={rt.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-sm text-foreground">RT {rt.nomor}</span>
                  {rt.nama_ketua && <span className="text-xs text-muted-foreground">— {rt.nama_ketua}</span>}
                </div>
              ))}

              <form onSubmit={(e) => handleCreateRT(e, rw.id)} className="flex gap-2 mt-3 flex-wrap"
                id={`form-tambah-rt-${rw.id}`}>
                <input name="rw_id" type="hidden" value={rw.id} />
                <input name="nomor" placeholder="Nomor RT" required
                  className="flex-1 min-w-24 px-3 py-2 rounded-lg bg-[hsl(222,40%,12%)] border border-[hsl(222,40%,20%)] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-xs" />
                <input name="nama_ketua" placeholder="Nama Ketua RT (opsional)"
                  className="flex-1 min-w-36 px-3 py-2 rounded-lg bg-[hsl(222,40%,12%)] border border-[hsl(222,40%,20%)] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-xs" />
                <button id={`btn-tambah-rt-${rw.id}`} type="submit"
                  disabled={pendingRT === rw.id}
                  className="px-4 py-2 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-blue-400 text-xs font-semibold transition-all disabled:opacity-50 flex items-center gap-1">
                  {pendingRT === rw.id ? <Loader2 className="w-3 h-3 animate-spin" /> : '+'} RT
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
