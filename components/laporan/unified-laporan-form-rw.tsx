'use client'

import { UnifiedLaporanForm } from './unified-laporan-form'
import type { Warga } from '@/lib/types'

interface WargaWithRt extends Partial<Warga> {
  rt_id?: string
  no_kk?: string
  agama?: string
  pekerjaan?: string
  status_kawin?: string
  pendidikan?: string
  nomor_hp?: string
}

interface Props {
  rtList: Array<{ id: string; nomor: string; rw?: { nomor?: string } | unknown }>
  allRtList: Array<{ id: string; nomor: string; rw?: { nomor?: string } | unknown }>
  wargaList: WargaWithRt[]
  redirectPath?: string
}

export function UnifiedLaporanFormRW({ rtList, allRtList, wargaList, redirectPath = '/rw' }: Props) {
  return (
    <UnifiedLaporanForm
      wargaList={wargaList}
      rtList={rtList}
      allRtList={allRtList}
      showRtSelector={true}
      redirectPath={redirectPath}
    />
  )
}
