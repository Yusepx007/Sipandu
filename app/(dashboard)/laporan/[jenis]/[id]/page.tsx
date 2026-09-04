import { notFound, redirect } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { JenisLaporan } from '@/lib/types'
import { JENIS_LAPORAN_LABEL, STATUS_LAPORAN_LABEL } from '@/lib/types'
import { formatTanggal, cn } from '@/lib/utils'
import { ArrowLeft, User, MapPin, Clock, CheckCircle2, XCircle } from 'lucide-react'

export const metadata: Metadata = { title: 'Detail Laporan' }

export default async function LaporanDetailPage({
  params,
}: {
  params: Promise<{ jenis: string; id: string }>
}) {
  const { jenis, id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: laporan } = await supabase
    .from('laporan')
    .select(`
      *,
      warga:warga_id(*),
      rt:rt_id(nomor, rw:rw_id(nomor, kelurahan:kelurahan_id(nama))),
      rt_asal:rt_asal_id(nomor),
      rt_tujuan:rt_tujuan_id(nomor),
      creator:created_by(nama),
      verifier:verified_by(nama)
    `)
    .eq('id', id)
    .single()

  if (!laporan) notFound()

  const warga = laporan.warga as Record<string, string> | null
  const rt = laporan.rt as { nomor?: string; rw?: { nomor?: string; kelurahan?: { nama?: string } } | unknown } | null
  const rtAsal = laporan.rt_asal as { nomor?: string } | null
  const rtTujuan = laporan.rt_tujuan as { nomor?: string } | null
  const creator = laporan.creator as { nama?: string } | null
  const verifier = laporan.verifier as { nama?: string } | null
  const detail = laporan.detail as Record<string, unknown>
  const jenisLabel = JENIS_LAPORAN_LABEL[laporan.jenis as JenisLaporan]

  return (
    <div className="max-w-2xl space-y-6 animate-fade-in">
      <Link href={`/laporan/${jenis}`}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Kembali ke daftar {jenisLabel}
      </Link>

      <div className="flex items-start gap-4">
        <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold border', `jenis-${laporan.jenis}`)}>
          {laporan.jenis === 'masuk' ? '↓' : laporan.jenis === 'keluar' ? '↑' :
           laporan.jenis === 'lahir' ? '★' : laporan.jenis === 'meninggal' ? '†' :
           laporan.jenis === 'pindahan' ? '⇄' : '✎'}
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn('text-xs px-2 py-0.5 rounded-full border font-medium', `jenis-${laporan.jenis}`)}>
              {jenisLabel}
            </span>
            <span className={cn('text-xs px-2 py-1 rounded-lg border font-medium', `badge-${laporan.status}`)}>
              {STATUS_LAPORAN_LABEL[laporan.status as keyof typeof STATUS_LAPORAN_LABEL]}
            </span>
          </div>
          <h1 className="text-xl font-bold text-foreground mt-2">Laporan {jenisLabel}</h1>
          <p className="text-xs text-muted-foreground font-mono mt-1">{laporan.id}</p>
        </div>
      </div>

      {warga && (
        <div className="bg-card rounded-2xl border border-border p-5">
          <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <User className="w-4 h-4 text-muted-foreground" /> Data Warga
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <InfoRow label="NIK" value={warga.nik} />
            <InfoRow label="Nama" value={warga.nama} />
            <InfoRow label="Tempat Lahir" value={warga.tempat_lahir} />
            <InfoRow label="Tanggal Lahir" value={warga.tanggal_lahir ? formatTanggal(warga.tanggal_lahir) : '-'} />
            <InfoRow label="Jenis Kelamin" value={warga.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'} />
            <InfoRow label="Status" value={warga.status} className="capitalize" />
            <InfoRow label="Alamat" value={warga.alamat} className="col-span-2" />
          </div>
        </div>
      )}

      {Object.keys(detail).length > 0 && (
        <div className="bg-card rounded-2xl border border-border p-5">
          <h2 className="text-sm font-semibold text-foreground mb-3">Detail Laporan</h2>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(detail).filter(([, v]) => v !== null && v !== '').map(([k, v]) => (
              <InfoRow key={k} label={k.replace(/_/g, ' ')} value={String(v)} />
            ))}
            {laporan.jenis === 'pindahan' && rtAsal && rtTujuan && (
              <>
                <InfoRow label="RT Asal" value={`RT ${rtAsal.nomor}`} />
                <InfoRow label="RT Tujuan" value={`RT ${rtTujuan.nomor}`} />
              </>
            )}
          </div>
        </div>
      )}

      <div className="bg-card rounded-2xl border border-border p-5">
        <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground" /> Riwayat Proses
        </h2>
        <div className="space-y-3">
          <AuditRow icon="+" color="blue" label="Laporan Diajukan"
            by={creator?.nama} date={laporan.created_at} />
          {laporan.status === 'diverifikasi' && (
            <AuditRow icon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
              color="emerald" label="Diverifikasi"
              by={verifier?.nama} date={laporan.verified_at as string} />
          )}
          {laporan.status === 'ditolak' && (
            <AuditRow icon={<XCircle className="w-3.5 h-3.5 text-rose-600" />}
              color="rose" label="Ditolak"
              by={verifier?.nama} date={laporan.verified_at as string}
              keterangan={laporan.keterangan || undefined} />
          )}
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={className}>
      <p className="text-xs text-muted-foreground capitalize">{label}</p>
      <p className="text-sm text-foreground font-medium mt-0.5">{value || '-'}</p>
    </div>
  )
}

function AuditRow({ icon, color, label, by, date, keterangan }: {
  icon: React.ReactNode | string; color: string; label: string
  by?: string; date?: string; keterangan?: string
}) {
  return (
    <div className="flex items-start gap-3">
      <div className={`w-7 h-7 rounded-lg bg-${color}-500/15 border border-${color}-500/20 flex items-center justify-center flex-shrink-0`}>
        {typeof icon === 'string' ? <span className={`text-${color}-400 text-xs`}>{icon}</span> : icon}
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">
          Oleh {by || '-'}{date ? ` · ${formatTanggal(date)}` : ''}
        </p>
        {keterangan && (
          <p className="text-xs text-rose-600 mt-1 bg-red-50 px-2 py-1 rounded-lg border border-rose-500/20">
            Alasan: {keterangan}
          </p>
        )}
      </div>
    </div>
  )
}
