import { notFound, redirect } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/queries/dashboard'
import type { JenisLaporan } from '@/lib/types'
import { JENIS_LAPORAN_LABEL, STATUS_LAPORAN_LABEL } from '@/lib/types'
import { formatTanggal, formatWaktuRelatif, cn } from '@/lib/utils'
import { FileText, Filter } from 'lucide-react'

const VALID_JENIS: JenisLaporan[] = ['masuk', 'keluar', 'lahir', 'meninggal', 'pindahan', 'perubahan_data']

export async function generateMetadata({ params }: { params: Promise<{ jenis: string }> }): Promise<Metadata> {
  const { jenis } = await params
  return { title: `Laporan ${JENIS_LAPORAN_LABEL[jenis as JenisLaporan] || jenis}` }
}

export default async function LaporanListPage({
  params,
  searchParams,
}: {
  params: Promise<{ jenis: string }>
  searchParams: Promise<{ status?: string; rw?: string; rt?: string }>
}) {
  const { jenis } = await params
  const sp = await searchParams

  if (!VALID_JENIS.includes(jenis as JenisLaporan)) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await getCurrentProfile()
  if (!profile) redirect('/login')

  let query = supabase
    .from('laporan')
    .select(`
      *,
      warga:warga_id(nik, nama),
      rt:rt_id(nomor, rw:rw_id(nomor)),
      creator:created_by(nama),
      verifier:verified_by(nama)
    `)
    .eq('jenis', jenis)
    .order('created_at', { ascending: false })
    .limit(100)

  if (sp.status) query = query.eq('status', sp.status)
  if (sp.rt) query = query.eq('rt_id', sp.rt)
  if (sp.rw) query = query.eq('rw_id', sp.rw)

  const { data: laporan } = await query

  const statusOptions = ['diajukan', 'diverifikasi', 'ditolak']
  const jenisLabel = JENIS_LAPORAN_LABEL[jenis as JenisLaporan]
  const allJenis = VALID_JENIS

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
          <span>Laporan</span>
          <span>/</span>
          <span className={cn('px-2 py-0.5 rounded-full border font-medium', `jenis-${jenis}`)}>{jenisLabel}</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground">Laporan {jenisLabel}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {laporan?.length || 0} laporan ditemukan
        </p>
      </div>

      {/* Jenis tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {allJenis.map((j) => (
          <Link key={j} href={`/laporan/${j}`}
            className={cn('flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
              j === jenis ? `jenis-${j}` : 'text-muted-foreground border-border hover:border-muted-foreground/50')}>
            {JENIS_LAPORAN_LABEL[j]}
          </Link>
        ))}
      </div>

      {/* Filter status */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <Link href={`/laporan/${jenis}`}
          className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
            !sp.status ? 'bg-blue-500/15 border-blue-500/30 text-blue-400' : 'text-muted-foreground border-border hover:border-muted-foreground/50')}>
          Semua
        </Link>
        {statusOptions.map((s) => (
          <Link key={s} href={`/laporan/${jenis}?status=${s}`}
            className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
              sp.status === s ? `badge-${s}` : 'text-muted-foreground border-border hover:border-muted-foreground/50')}>
            {STATUS_LAPORAN_LABEL[s as keyof typeof STATUS_LAPORAN_LABEL]}
          </Link>
        ))}
      </div>

      {/* Table */}
      {!laporan || laporan.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-card rounded-2xl border border-border text-center">
          <FileText className="w-10 h-10 text-muted-foreground/50 mb-3" />
          <p className="text-foreground font-medium">Belum ada laporan</p>
          <p className="text-muted-foreground text-sm mt-1">Belum ada laporan {jenisLabel.toLowerCase()} yang tercatat</p>
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Warga</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Wilayah</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Oleh</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tanggal</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {laporan.map((l) => {
                  const warga = l.warga as { nik?: string; nama?: string } | undefined
                  const rt = l.rt as { nomor?: string; rw?: { nomor?: string } | unknown } | undefined
                  const creator = l.creator as { nama?: string } | undefined
                  const detail = l.detail as Record<string, string>
                  const nama = warga?.nama || detail?.nama || 'Tidak diketahui'
                  const nik = warga?.nik || detail?.nik || '-'
                  return (
                    <tr key={l.id} className="hover:bg-accent/50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{nama}</p>
                        <p className="text-xs text-muted-foreground">{nik}</p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        RT {rt?.nomor}{rt?.rw && typeof rt.rw === 'object' && 'nomor' in rt.rw ? ` / RW ${(rt.rw as {nomor?: string}).nomor}` : ''}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{creator?.nama || '-'}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{formatWaktuRelatif(l.created_at)}</td>
                      <td className="px-4 py-3">
                        <span className={cn('text-xs px-2 py-1 rounded-lg border font-medium', `badge-${l.status}`)}>
                          {STATUS_LAPORAN_LABEL[l.status as keyof typeof STATUS_LAPORAN_LABEL]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/laporan/${l.jenis}/${l.id}`} className="text-xs text-blue-400 hover:text-blue-300 transition-colors">Detail →</Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-border">
            {laporan.map((l) => {
              const warga = l.warga as { nik?: string; nama?: string } | undefined
              const rt = l.rt as { nomor?: string } | undefined
              const detail = l.detail as Record<string, string>
              const nama = warga?.nama || detail?.nama || 'Tidak diketahui'
              return (
                <Link key={l.id} href={`/laporan/${l.jenis}/${l.id}`} className="flex items-center gap-3 p-4 hover:bg-accent/50 transition-colors">
                  <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold border flex-shrink-0', `jenis-${jenis}`)}>
                    {jenis === 'masuk' ? '↓' : jenis === 'keluar' ? '↑' : jenis === 'lahir' ? '★' : jenis === 'meninggal' ? '†' : jenis === 'pindahan' ? '⇄' : '✎'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground truncate">{nama}</p>
                    <p className="text-xs text-muted-foreground">RT {rt?.nomor} · {formatWaktuRelatif(l.created_at)}</p>
                  </div>
                  <span className={cn('text-xs px-2 py-1 rounded-lg border font-medium flex-shrink-0', `badge-${l.status}`)}>
                    {STATUS_LAPORAN_LABEL[l.status as keyof typeof STATUS_LAPORAN_LABEL]}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
