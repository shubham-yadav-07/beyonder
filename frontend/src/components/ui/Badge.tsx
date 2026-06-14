import { cn } from '@/utils/cn'
import type { ThreatLevel } from '@/types'

// Superset of statuses used across threats AND folders/monitoring.
// Intentionally named differently from the narrower `ThreatStatus`
// in @/types (which covers only threat lifecycle: active/quarantined/resolved).
export type BadgeStatus = 'active' | 'quarantined' | 'resolved' | 'protected' | 'warning' | 'scanning'

const LEVEL_CFG: Record<ThreatLevel, { label: string; cls: string }> = {
  critical: { label: 'Critical', cls: 'bg-critical-bg text-critical border-critical-border' },
  high:     { label: 'High',     cls: 'bg-high-bg text-high border-high-border' },
  medium:   { label: 'Medium',   cls: 'bg-medium-bg text-medium border-medium-border' },
  low:      { label: 'Low',      cls: 'bg-safe-bg text-safe border-safe-border' },
  none:     { label: 'Clean',    cls: 'bg-[var(--color-elevated)] text-[var(--color-text-muted)] border-[var(--color-border)]' },
}

const STATUS_CFG: Record<BadgeStatus, { label: string; cls: string; pulse?: boolean }> = {
  active:      { label: 'Active',      cls: 'bg-critical-bg text-critical border-critical-border',     pulse: true },
  quarantined: { label: 'Quarantined', cls: 'bg-high-bg text-high border-high-border' },
  resolved:    { label: 'Resolved',    cls: 'bg-safe-bg text-safe border-safe-border' },
  protected:   { label: 'Protected',   cls: 'bg-safe-bg text-safe border-safe-border' },
  warning:     { label: 'Warning',     cls: 'bg-medium-bg text-medium border-medium-border',           pulse: true },
  scanning:    { label: 'Scanning',    cls: 'bg-[var(--color-accent-subtle)] text-[var(--color-accent-text)] border-[rgba(99,102,241,.25)]', pulse: true },
}

export function ThreatBadge({ level }: { level: ThreatLevel }) {
  const { label, cls } = LEVEL_CFG[level]
  return (
    <span className={cn('badge badge-dot', cls)}>
      {label}
    </span>
  )
}

export function StatusBadge({ status }: { status: BadgeStatus }) {
  const { label, cls, pulse } = STATUS_CFG[status]
  return (
    <span className={cn('badge', cls)}>
      <span className={cn('w-1.5 h-1.5 rounded-full bg-current opacity-80 shrink-0', pulse && 'animate-pulse-dot')} />
      {label}
    </span>
  )
}

export function SeverityChip({ value }: { value: string }) {
  const map: Record<string, string> = {
    CRITICAL: 'bg-critical-bg text-critical border-critical-border',
    HIGH:     'bg-high-bg text-high border-high-border',
    MEDIUM:   'bg-medium-bg text-medium border-medium-border',
    INFO:     'bg-info-bg text-info border-info-border',
    LOW:      'bg-[var(--color-elevated)] text-[var(--color-text-muted)] border-[var(--color-border)]',
  }
  return (
    <span className={cn('badge font-mono tracking-wider', map[value] ?? map.LOW)}>
      {value}
    </span>
  )
}
