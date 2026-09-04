'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { verifikasiLaporan, tolakLaporan } from '@/lib/actions/laporan.actions'
import type { Laporan } from '@/lib/types'
import { JENIS_LAPORAN_LABEL, STATUS_LAPORAN_LABEL } from '@/lib/types'
import { formatTanggal, formatWaktuRelatif, cn } from '@/lib/utils'
import { CheckCircle2, XCircle, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'

interface VerifikasiCardProps {
  laporan: Laporan
  onProcessed: () => void
}

export function VerifikasiCard({ laporan, onProcessed }: VerifikasiCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [showTolakForm, setShowTolakForm] = useState(false)
  const [alasan, setAlasan] = useState('')
  const [loading, setLoading] = useState<'verifikasi' | 'tolak' | null>(null)
  const [error, setError] = useState('')

  async function handleVerifikasi() {
    setLoading('verifikasi'); setError('')
    const result = await verifikasiLaporan(laporan.id)
    setLoading(null)
    if (result?.error) setError(result.error)
    else onProcessed()
  }

  async function handleTolak() {
    if (!alasan.trim()) { setError('Alasan penolakan wajib diisi'); return }
    setLoading('tolak'); setError('')
    const result = await tolakLaporan(laporan.id, alasan)
    setLoading(null)
    if (result?.error) setError(result.error)
    else onProcessed()
  }

  const detail = laporan.detail as Record<string, string>
  const wargaNama = (laporan.warga as { nama?: string } | undefined)?.nama || detail?.nama || 'Tidak diketahui'
  const wargaNIK = (laporan.warga as { nik?: string } | undefined)?.nik || detail?.nik || '-'
  const creatorNama = (laporan.creator as { nama?: string } | undefined)?.nama || '-'
  const rtNomor = (laporan.rt as { nomor?: string } | undefined)?.nomor || '-'

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden transition-all">
      {/* Header */}
      <div className="flex items-center gap-4 p-4">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold border flex-shrink-0', `jenis-${laporan.jenis}`)}>
          {laporan.jenis === 'masuk' ? '↓' : laporan.jenis === 'keluar' ? '↑' :
           laporan.jenis === 'lahir' ? '★' : laporan.jenis === 'meninggal' ? '†' :
           laporan.jenis === 'pindahan' ? '⇄' : '✎'}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn('text-xs px-2 py-0.5 rounded-full border font-medium', `jenis-${laporan.jenis}`)}>
              {JENIS_LAPORAN_LABEL[laporan.jenis]}
            </span>
            <span className="text-xs text-muted-foreground">RT {rtNomor}</span>
          </div>
          <p className="font-semibold text-foreground text-sm mt-1 truncate">{wargaNama}</p>
          <p className="text-xs text-muted-foreground">NIK: {wargaNIK} · Oleh {creatorNama} · {formatWaktuRelatif(laporan.created_at)}</p>
        </div>

        <button onClick={() => setExpanded(!expanded)}
          className="p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground flex-shrink-0">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Detail Panel */}
      {expanded && (
        <div className="border-t border-border px-4 pb-4">
          {/* Detail data */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            {Object.entries(detail).filter(([, v]) => v !== null && v !== '').map(([k, v]) => (
              <div key={k}>
                <p className="text-xs text-muted-foreground capitalize">{k.replace(/_/g, ' ')}</p>
                <p className="text-sm text-foreground font-medium">{String(v)}</p>
              </div>
            ))}
            {laporan.keterangan && (
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground">Keterangan</p>
                <p className="text-sm text-foreground">{laporan.keterangan}</p>
              </div>
            )}
          </div>

          {/* Aksi */}
          {error && <div className="mt-3 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-rose-600 text-xs">{error}</div>}

          {!showTolakForm ? (
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowTolakForm(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 text-rose-600 hover:bg-red-50 transition-all text-sm font-medium">
                <XCircle className="w-4 h-4" />Tolak
              </button>
              <button id={`btn-verifikasi-${laporan.id.slice(0, 8)}`}
                onClick={handleVerifikasi} disabled={loading !== null}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition-all text-sm font-medium disabled:opacity-50">
                {loading === 'verifikasi' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Verifikasi
              </button>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              <textarea value={alasan} onChange={e => setAlasan(e.target.value)} rows={2}
                placeholder="Alasan penolakan (wajib diisi)..."
                className="w-full px-4 py-3 rounded-xl bg-[hsl(222,40%,12%)] border border-red-200 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-rose-500/50 text-sm resize-none" />
              <div className="flex gap-3">
                <button onClick={() => setShowTolakForm(false)}
                  className="px-4 py-2.5 rounded-xl border border-border text-muted-foreground hover:text-foreground transition-all text-sm">Batal</button>
                <button id={`btn-tolak-${laporan.id.slice(0, 8)}`}
                  onClick={handleTolak} disabled={loading !== null}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/15 border border-red-200 text-rose-600 hover:bg-rose-500/20 transition-all text-sm font-medium disabled:opacity-50">
                  {loading === 'tolak' ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                  Konfirmasi Tolak
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

