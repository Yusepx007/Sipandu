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
    icon: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
    glow: 'shadow-blue-500/10',
    border: 'hover:border-blue-500/30',
  },
  emerald: {
    icon: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    glow: 'shadow-emerald-500/10',
    border: 'hover:border-emerald-500/30',
  },
  amber: {
    icon: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
    glow: 'shadow-amber-500/10',
    border: 'hover:border-amber-500/30',
  },
  rose: {
    icon: 'bg-rose-500/15 text-rose-400 border-rose-500/20',
    glow: 'shadow-rose-500/10',
    border: 'hover:border-rose-500/30',
  },
  purple: {
    icon: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
    glow: 'shadow-purple-500/10',
    border: 'hover:border-purple-500/30',
  },
  cyan: {
    icon: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20',
    glow: 'shadow-cyan-500/10',
    border: 'hover:border-cyan-500/30',
  },
  slate: {
    icon: 'bg-slate-500/15 text-slate-400 border-slate-500/20',
    glow: 'shadow-slate-500/10',
    border: 'hover:border-slate-500/30',
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
                ? 'text-emerald-400 bg-emerald-500/10'
                : trend.value < 0
                ? 'text-rose-400 bg-rose-500/10'
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
