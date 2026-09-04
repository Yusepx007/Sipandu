'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { formatBulan } from '@/lib/utils'

interface TrendData {
  bulan: string
  masuk: number
  keluar: number
  lahir: number
  meninggal: number
  pindahan: number
}

interface MonthlyTrendChartProps {
  data: TrendData[]
}

const LINES = [
  { key: 'masuk', label: 'Masuk', color: '#3b82f6' },
  { key: 'keluar', label: 'Keluar', color: '#f97316' },
  { key: 'lahir', label: 'Lahir', color: '#22c55e' },
  { key: 'meninggal', label: 'Meninggal', color: '#94a3b8' },
  { key: 'pindahan', label: 'Pindahan', color: '#a855f7' },
]

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border border-border rounded-xl p-3 shadow-xl text-sm">
      <p className="font-semibold text-foreground mb-2">{formatBulan(label || '')}</p>
      {payload.map((item) => (
        <div key={item.name} className="flex items-center gap-2 text-muted-foreground">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: item.color }} />
          <span className="capitalize">{item.name}:</span>
          <span className="font-semibold text-foreground ml-auto pl-4">{item.value}</span>
        </div>
      ))}
    </div>
  )
}

export function MonthlyTrendChart({ data }: MonthlyTrendChartProps) {
  const formattedData = data.map((d) => ({
    ...d,
    bulanLabel: formatBulan(d.bulan),
  }))

  const hasData = data.some((d) =>
    d.masuk > 0 || d.keluar > 0 || d.lahir > 0 || d.meninggal > 0 || d.pindahan > 0
  )

  if (!hasData) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
        Belum ada data laporan untuk ditampilkan
      </div>
    )
  }

  return (
    <div aria-label="Grafik tren laporan bulanan">
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={formattedData} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 40% 18%)" />
          <XAxis
            dataKey="bulanLabel"
            tick={{ fill: 'hsl(215 16% 57%)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: 'hsl(215 16% 57%)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }}
            formatter={(value) => (
              <span style={{ color: 'hsl(215 16% 57%)' }}>{value}</span>
            )}
          />
          {LINES.map((line) => (
            <Line
              key={line.key}
              type="monotone"
              dataKey={line.key}
              name={line.label}
              stroke={line.color}
              strokeWidth={2}
              dot={{ r: 3, fill: line.color, strokeWidth: 0 }}
              activeDot={{ r: 5, strokeWidth: 0 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

