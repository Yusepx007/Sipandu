import type { Laporan } from '@/lib/types'
import { JENIS_LAPORAN_LABEL, STATUS_LAPORAN_LABEL } from '@/lib/types'
import { formatWaktuRelatif } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface LaporanFeedProps {
  laporan: Laporan[]
}

const jenisIcon: Record<string, string> = {
  masuk: '↓',
  keluar: '↑',
  lahir: '★',
  meninggal: '†',
  pindahan: '⇄',
  perubahan_data: '✎',
}

export function LaporanFeed({ laporan }: LaporanFeedProps) {
  if (!laporan.length) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        Belum ada laporan yang masuk
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {laporan.map((item) => (
        <div
          key={item.id}
          className="flex items-start gap-3 p-3 rounded-xl hover:bg-accent transition-colors"
        >
          {/* Jenis icon */}
          <div
            className={cn('w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 border', `jenis-${item.jenis}`)}
          >
            {jenisIcon[item.jenis] || '?'}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn('text-xs px-2 py-0.5 rounded-full border font-medium', `jenis-${item.jenis}`)}>
                {JENIS_LAPORAN_LABEL[item.jenis]}
              </span>
              {item.rt && (
                <span className="text-xs text-muted-foreground">
                  RT {item.rt.nomor}
                  {item.rt.rw && ` / RW ${item.rt.rw.nomor}`}
                </span>
              )}
            </div>
            <p className="text-sm font-medium text-foreground mt-1 truncate">
              {(item.warga as { nama?: string } | undefined)?.nama ||
                (item.detail as { nama?: string })?.nama ||
                'Warga'}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Oleh {(item.creator as { nama?: string } | undefined)?.nama || '-'} ·{' '}
              {formatWaktuRelatif(item.created_at)}
            </p>
          </div>

          {/* Status */}
          <span
            className={cn(
              'text-xs px-2 py-1 rounded-lg border font-medium flex-shrink-0',
              `badge-${item.status}`
            )}
          >
            {STATUS_LAPORAN_LABEL[item.status]}
          </span>
        </div>
      ))}
    </div>
  )
}
