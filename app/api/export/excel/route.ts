import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const periode = searchParams.get('periode') || 'bulanan'
  const bulan = parseInt(searchParams.get('bulan') || String(new Date().getMonth() + 1))
  const tahun = parseInt(searchParams.get('tahun') || String(new Date().getFullYear()))
  const rwFilter = searchParams.get('rw')

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let startDate: Date, endDate: Date
  if (periode === 'bulanan') {
    startDate = new Date(tahun, bulan - 1, 1)
    endDate = new Date(tahun, bulan, 0, 23, 59, 59)
  } else {
    startDate = new Date(tahun, 0, 1)
    endDate = new Date(tahun, 11, 31, 23, 59, 59)
  }

  let query = supabase
    .from('laporan')
    .select('*, warga:warga_id(nik, nama), rt:rt_id(nomor, rw:rw_id(nomor))')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .order('created_at', { ascending: false })

  if (rwFilter) query = query.eq('rw_id', rwFilter)

  const { data: laporan, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  try {
    // Dynamic import exceljs
    const ExcelJS = (await import('exceljs')).default
    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'Sipandu'
    workbook.created = new Date()

    const sheet = workbook.addWorksheet('Laporan Kependudukan')
    const periodeLabel = periode === 'bulanan'
      ? `${new Intl.DateTimeFormat('id-ID', { month: 'long' }).format(startDate)} ${tahun}`
      : `Tahun ${tahun}`

    // Header info
    sheet.mergeCells('A1:H1')
    sheet.getCell('A1').value = 'LAPORAN KEPENDUDUKAN KELURAHAN SETIAMULYA'
    sheet.getCell('A1').font = { bold: true, size: 14 }
    sheet.getCell('A1').alignment = { horizontal: 'center' }

    sheet.mergeCells('A2:H2')
    sheet.getCell('A2').value = `Periode: ${periodeLabel}`
    sheet.getCell('A2').alignment = { horizontal: 'center' }

    sheet.addRow([])

    // Column headers
    const headerRow = sheet.addRow([
      'No', 'Jenis Laporan', 'Nama Warga', 'NIK', 'RT', 'RW',
      'Status', 'Tanggal Dibuat', 'Tanggal Verifikasi'
    ])
    headerRow.font = { bold: true }
    headerRow.fill = {
      type: 'pattern', pattern: 'solid',
      fgColor: { argb: 'FF1E3A5F' }
    }
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }

    const JENIS_LABEL: Record<string, string> = {
      masuk: 'Warga Masuk', keluar: 'Warga Keluar', lahir: 'Kelahiran',
      meninggal: 'Kematian', pindahan: 'Pindahan', perubahan_data: 'Perubahan Data',
    }

    laporan?.forEach((l, i) => {
      const warga = l.warga as { nik?: string; nama?: string } | null
      const rt = l.rt as { nomor?: string; rw?: { nomor?: string } | unknown } | null
      const detail = l.detail as Record<string, string>
      const nama = warga?.nama || detail?.nama || '-'
      const nik = warga?.nik || detail?.nik || '-'
      sheet.addRow([
        i + 1,
        JENIS_LABEL[l.jenis] || l.jenis,
        nama,
        nik,
        rt?.nomor ? `RT ${rt.nomor}` : '-',
        rt?.rw && typeof rt.rw === 'object' && 'nomor' in rt.rw ? `RW ${(rt.rw as {nomor?: string}).nomor}` : '-',
        l.status,
        new Date(l.created_at).toLocaleDateString('id-ID'),
        l.verified_at ? new Date(l.verified_at as string).toLocaleDateString('id-ID') : '-',
      ])
    })

    // Column widths
    sheet.columns = [
      { width: 5 }, { width: 18 }, { width: 25 }, { width: 18 },
      { width: 8 }, { width: 8 }, { width: 14 }, { width: 16 }, { width: 16 },
    ]

    const buffer = await workbook.xlsx.writeBuffer()

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="laporan-${periodeLabel.replace(/\s+/g, '-')}.xlsx"`,
      },
    })
  } catch (err) {
    console.error('Excel export error:', err)
    return NextResponse.json({ error: 'Gagal generate Excel' }, { status: 500 })
  }
}
