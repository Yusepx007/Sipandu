import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/queries/dashboard'
import { VerifikasiList } from '@/components/laporan/verifikasi-list'
import { ClipboardCheck } from 'lucide-react'

export const metadata: Metadata = { title: 'Verifikasi Laporan' }

export default async function VerifikasiPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await getCurrentProfile()
  if (!profile || !['ketua_rw', 'admin_kelurahan'].includes(profile.role)) redirect('/')

  const { data: laporan } = await supabase
    .from('laporan')
    .select(`
      *,
      warga:warga_id(id, nik, nama),
      rt:rt_id(nomor, rw:rw_id(nomor)),
      creator:created_by(nama)
    `)
    .eq('status', 'diajukan')
    .order('created_at', { ascending: true }) // FIFO

  const totalDiajukan = laporan?.length || 0

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Verifikasi Laporan</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Antrean laporan dari RT yang menunggu verifikasi
          </p>
        </div>
        {totalDiajukan > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600">
            <ClipboardCheck className="w-4 h-4" />
            <span className="text-sm font-semibold">{totalDiajukan} laporan menunggu</span>
          </div>
        )}
      </div>

      {laporan && laporan.length > 0 ? (
        <VerifikasiList laporan={laporan as unknown as import('@/lib/types').Laporan[]} />
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-card rounded-2xl border border-border">
          <ClipboardCheck className="w-12 h-12 text-emerald-600 mb-4" />
          <h2 className="text-lg font-semibold text-foreground">Semua Beres!</h2>
          <p className="text-muted-foreground text-sm mt-1">Tidak ada laporan yang menunggu verifikasi</p>
        </div>
      )}
    </div>
  )
}

