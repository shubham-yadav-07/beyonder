import { cn } from '@/utils/cn'
import { motion } from 'framer-motion'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: 'accent' | 'critical' | 'safe' | false
  hover?: boolean
  padding?: 'sm' | 'md' | 'lg' | 'none'
}

const padMap = { none: '', sm: 'p-4', md: 'p-5', lg: 'p-6' }

export function Card({ children, className, glow, hover, padding = 'md', ...rest }: CardProps) {
  const glowCls = glow === 'accent' ? 'glow-accent' : glow === 'critical' ? 'glow-critical' : glow === 'safe' ? 'glow-safe' : ''
  return (
    <div
      className={cn('card', padMap[padding], hover && 'card-interactive', glowCls, className)}
      {...rest}
    >
      {children}
    </div>
  )
}

interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  trend?: { value: string; up?: boolean }
  icon?: React.ElementType
  iconColor?: string
  iconBg?: string
  loading?: boolean
  accent?: string
  delay?: number
}

export function StatCard({ label, value, sub, trend, icon: Icon, iconColor, iconBg, loading, accent, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: 'easeOut' }}
      className="card card-interactive p-5 relative overflow-hidden group"
    >
      {/* Top row */}
      <div className="flex items-start justify-between mb-4">
        {Icon && (
          <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', iconBg || 'bg-[var(--color-elevated)]')}>
            <Icon className={cn('w-4 h-4', iconColor || 'text-[var(--color-text-muted)]')} strokeWidth={2} />
          </div>
        )}
      </div>

      {loading ? (
        <>
          <div className="skeleton h-8 w-24 rounded-lg mb-2" />
          <div className="skeleton h-3 w-16 rounded" />
        </>
      ) : (
        <>
          <p className={cn('text-[28px] font-display font-bold leading-none tracking-tight mb-1', accent || 'text-[var(--color-text-primary)]')}>
            {value}
          </p>
          <p className="text-xs text-[var(--color-text-muted)] font-medium uppercase tracking-wider">{label}</p>
          {sub && <p className="text-xs text-[var(--color-text-muted)] mt-1 opacity-70">{sub}</p>}
          {trend && (
            <p className={cn('text-xs font-medium mt-2 flex items-center gap-1', trend.up === false ? 'text-safe' : 'text-critical')}>
              {trend.up === false ? '↓' : '↑'} {trend.value}
            </p>
          )}
        </>
      )}

      {/* Bottom accent bar */}
      <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--color-accent)] to-transparent opacity-0 group-hover:opacity-40 transition-opacity" />
    </motion.div>
  )
}

export function SectionHeader({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h2 className="font-display font-semibold text-[var(--color-text-primary)] text-[15px] leading-tight">{title}</h2>
        {sub && <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{sub}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
