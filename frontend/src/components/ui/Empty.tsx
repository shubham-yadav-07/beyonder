import { cn } from '@/utils/cn'
import type { LucideIcon } from 'lucide-react'

interface EmptyProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function Empty({ icon: Icon, title, description, action, className }: EmptyProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 text-center', className)}>
      <div className="w-14 h-14 rounded-2xl bg-[var(--color-elevated)] border border-[var(--color-border)] flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-[var(--color-text-muted)] opacity-50" />
      </div>
      <p className="font-display font-semibold text-[var(--color-text-secondary)] text-sm">{title}</p>
      {description && <p className="text-xs text-[var(--color-text-muted)] mt-1 max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
