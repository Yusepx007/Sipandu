import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface StatCardProps {
  title: string
  value: number | string
  subtitle?: string
  icon: React.ReactNode
  color?: 'blue' | 'emerald' | 'amber' | 'rose' | 'purple' | 'cyan' | 'slate'
  trend?: {
    value: number
    label: string
  }
  href?: string
  className?: string
}

const colorMap = {
  blue: {
    icon: 'bg-blue-50 text-blue-600 border-blue-200',
    glow: 'shadow-blue-500/10',
    border: 'hover:border-blue-200',
  },
  emerald: {
    icon: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    glow: 'shadow-emerald-500/10',
    border: 'hover:border-emerald-200',
  },
  amber: {
    icon: 'bg-amber-50 text-amber-700 border-amber-200',
    glow: 'shadow-amber-500/10',
    border: 'hover:border-amber-200',
  },
  rose: {
    icon: 'bg-red-50 text-red-600 border-red-200',
    glow: 'shadow-red-500/10',
    border: 'hover:border-red-200',
  },
  purple: {
    icon: 'bg-purple-50 text-purple-700 border-purple-200',
    glow: 'shadow-purple-500/10',
    border: 'hover:border-purple-200',
  },
  cyan: {
    icon: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    glow: 'shadow-cyan-500/10',
    border: 'hover:border-cyan-200',
  },
  slate: {
    icon: 'bg-slate-100 text-slate-600 border-slate-200',
    glow: 'shadow-slate-500/10',
    border: 'hover:border-slate-300',
  },
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  color = 'blue',
  trend,
  className,
}: StatCardProps) {
  const colors = colorMap[color]

  return (
    <div
      className={cn(
        'relative p-5 rounded-2xl border border-border bg-card transition-all duration-200 card-hover shadow-lg',
        colors.glow,
        colors.border,
        className
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={cn('p-2.5 rounded-xl border', colors.icon)}>
          {icon}
        </div>
        {trend && (
          <div
            className={cn(
              'flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg',
              trend.value > 0
                ? 'text-emerald-600 bg-emerald-50'
                : trend.value < 0
                ? 'text-rose-600 bg-red-50'
                : 'text-muted-foreground bg-muted'
            )}
          >
            {trend.value > 0 ? (
              <TrendingUp className="w-3 h-3" />
            ) : trend.value < 0 ? (
              <TrendingDown className="w-3 h-3" />
            ) : (
              <Minus className="w-3 h-3" />
            )}
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>

      <div>
        <p className="text-2xl font-bold text-foreground tabular-nums">
          {typeof value === 'number' ? value.toLocaleString('id-ID') : value}
        </p>
        <p className="text-sm font-medium text-muted-foreground mt-1">{title}</p>
        {subtitle && (
          <p className="text-xs text-muted-foreground/70 mt-0.5">{subtitle}</p>
        )}
      </div>
    </div>
  )
}

