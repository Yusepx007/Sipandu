'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Laporan } from '@/lib/types'
import { VerifikasiCard } from './verifikasi-card'

export function VerifikasiList({ laporan: initialLaporan }: { laporan: Laporan[] }) {
  const [laporan, setLaporan] = useState(initialLaporan)
  const router = useRouter()

  function handleProcessed(id: string) {
    setLaporan((prev) => prev.filter((l) => l.id !== id))
    router.refresh()
  }

  if (laporan.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center bg-card rounded-2xl border border-border">
        <span className="text-4xl mb-4">✓</span>
        <p className="text-foreground font-semibold">Semua laporan telah diproses</p>
        <p className="text-muted-foreground text-sm mt-1">Tidak ada laporan yang menunggu verifikasi</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {laporan.map((l) => (
        <VerifikasiCard key={l.id} laporan={l} onProcessed={() => handleProcessed(l.id)} />
      ))}
    </div>
  )
}
