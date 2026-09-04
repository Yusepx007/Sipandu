'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface WilayahData {
  id: string
  label: string
  totalLaporan: number
  wargaAktif: number
}

interface WilayahComparisonChartProps {
  data: WilayahData[]
  title?: string
}

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border border-border rounded-xl p-3 shadow-xl text-sm">
      <p className="font-semibold text-foreground mb-2">{label}</p>
      {payload.map((item) => (
        <div key={item.name} className="flex items-center gap-2 text-muted-foreground">
          <span className="w-2 h-2 rounded-full" style={{ background: item.color }} />
          <span>{item.name}:</span>
          <span className="font-semibold text-foreground ml-auto pl-4">{item.value}</span>
        </div>
      ))}
    </div>
  )
}

export function WilayahComparisonChart({ data, title }: WilayahComparisonChartProps) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
        Belum ada data wilayah
      </div>
    )
  }

  return (
    <div aria-label={title || 'Perbandingan laporan antar wilayah'}>
      <ResponsiveContainer width="100%" height={Math.max(180, data.length * 44)}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 20, bottom: 5, left: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 40% 18%)" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fill: 'hsl(215 16% 57%)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <YAxis
            type="category"
            dataKey="label"
            tick={{ fill: 'hsl(213 31% 91%)', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={55}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="totalLaporan"
            name="Total Laporan"
            fill="#3b82f6"
            radius={[0, 6, 6, 0]}
            fillOpacity={0.8}
          />
          <Bar
            dataKey="wargaAktif"
            name="Warga Aktif"
            fill="#a855f7"
            radius={[0, 6, 6, 0]}
            fillOpacity={0.6}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
