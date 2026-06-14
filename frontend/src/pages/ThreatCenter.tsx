import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield, Search, ScanLine, Archive, CheckCircle2,
  ChevronDown, ChevronUp, Hash, Loader2, Filter, Download
} from 'lucide-react'
import { ThreatBadge, StatusBadge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Empty } from '@/components/ui/Empty'
import { SkeletonList } from '@/components/ui/Skeleton'
import { useThreats, useRunScan, useQuarantineThreat, useResolveThreat, useThreatScore } from '@/hooks/useApi'
import type { Threat, ThreatLevel } from '@/types'
import { cn } from '@/utils/cn'
import { formatDistanceToNow } from 'date-fns'

const LEVELS: (ThreatLevel | 'all')[] = ['all','critical','high','medium','low']

const LEVEL_BORDER: Record<string, string> = {
  critical: 'border-l-critical',
  high:     'border-l-high',
  medium:   'border-l-medium',
  low:      'border-l-safe',
  none:     'border-l-[var(--color-border)]',
}

export default function ThreatCenter() {
  const [filter, setFilter]   = useState<ThreatLevel | 'all'>('all')
  const [search, setSearch]   = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)

  const { data: threats = [], isLoading } = useThreats(filter !== 'all' ? { level: filter } : {})
  const { data: scoreData } = useThreatScore()
  const scan       = useRunScan()
  const quarantine = useQuarantineThreat()
  const resolve    = useResolveThreat()

  const filtered = (threats as Threat[]).filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.path.toLowerCase().includes(search.toLowerCase())
  )

  const counts = { critical: 0, high: 0, medium: 0, low: 0 } as Record<string, number>
  ;(threats as Threat[]).forEach(t => { if (t.level in counts) counts[t.level]++ })

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-[22px] text-[var(--color-text-primary)] tracking-tight">Threat Center</h1>
          <p className="text-[13px] text-[var(--color-text-muted)] mt-0.5">AI-powered malware detection and incident response</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn btn-secondary btn-sm">
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
          <button onClick={() => scan.mutate()} disabled={scan.isPending} className="btn btn-primary btn-sm">
            {scan.isPending
              ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Scanning…</>
              : <><ScanLine className="w-3.5 h-3.5" />Run AI Scan</>}
          </button>
        </div>
      </div>

      {/* Severity summary cards */}
      <div className="grid grid-cols-4 gap-3">
        {(['critical','high','medium','low'] as ThreatLevel[]).map(lvl => {
          const styles: Record<ThreatLevel, { bg: string; text: string; border: string; ring: string }> = {
            critical: { bg: 'bg-critical-bg', text: 'text-critical', border: 'border-critical-border', ring: 'ring-critical' },
            high:     { bg: 'bg-high-bg',     text: 'text-high',     border: 'border-high-border',     ring: 'ring-high' },
            medium:   { bg: 'bg-medium-bg',   text: 'text-medium',   border: 'border-medium-border',   ring: 'ring-medium' },
            low:      { bg: 'bg-safe-bg',      text: 'text-safe',     border: 'border-safe-border',     ring: 'ring-safe' },
            none:     { bg: '', text: '', border: '', ring: '' },
          }
          const s = styles[lvl]
          return (
            <button key={lvl} onClick={() => setFilter(filter === lvl ? 'all' : lvl)}
              className={cn(
                'card p-4 text-center transition-all cursor-pointer hover:scale-[1.02]',
                filter === lvl && 'ring-1 ring-offset-1 ring-offset-[var(--color-bg)]',
                filter === lvl && s.ring
              )}>
              <p className={cn('font-display font-bold text-[26px] leading-none', s.text)}>{counts[lvl]}</p>
              <p className={cn('text-[10px] uppercase font-mono font-bold tracking-wider mt-1.5', s.text)}>{lvl}</p>
            </button>
          )
        })}
      </div>

      {/* Search + filter bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search name, path, type…"
            className="input pl-9 py-2.5 text-[13px]" />
        </div>
        <div className="flex gap-1 p-1 rounded-lg bg-[var(--color-elevated)] border border-[var(--color-border)]">
          {LEVELS.map(lvl => (
            <button key={lvl} onClick={() => setFilter(lvl)}
              className={cn(
                'px-3 py-1.5 rounded-md text-[12px] font-medium capitalize transition-all',
                filter === lvl
                  ? 'bg-[var(--color-accent)] text-white shadow-sm'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
              )}>
              {lvl}
            </button>
          ))}
        </div>
        <span className="text-[12px] text-[var(--color-text-muted)] ml-auto">
          {filtered.length} {filtered.length === 1 ? 'threat' : 'threats'}
        </span>
      </div>

      {/* Threat list */}
      {isLoading ? <SkeletonList rows={5} height="h-16" /> :
       filtered.length === 0 ? (
        <Empty
          icon={CheckCircle2}
          title="No threats found"
          description={search ? 'Try a different search term' : 'System is clean — run a scan to check for new threats'}
        />
       ) : (
        <div className="space-y-2">
          {filtered.map((threat, i) => (
            <motion.div key={threat.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className={cn(
                'card border-l-[3px] overflow-hidden transition-all',
                'hover:border-[var(--color-border-strong)]',
                LEVEL_BORDER[threat.level] || LEVEL_BORDER.none
              )}
              style={{ padding: 0 }}
            >
              {/* Row */}
              <div className="flex items-center gap-3 px-4 py-3.5 cursor-pointer"
                onClick={() => setExpanded(expanded === threat.id ? null : threat.id)}>
                <Shield className="w-4 h-4 text-[var(--color-text-muted)] shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-[var(--color-text-primary)] font-mono truncate">{threat.name}</p>
                  <p className="text-[11px] text-[var(--color-text-muted)] truncate">{threat.path}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] text-[var(--color-text-muted)] font-mono hidden md:block">
                    {formatDistanceToNow(new Date(threat.detected_at), { addSuffix: true })}
                  </span>
                  <ThreatBadge level={threat.level} />
                  <StatusBadge status={threat.status} />
                  <div className="w-9 h-7 rounded bg-[var(--color-elevated)] border border-[var(--color-border)] flex items-center justify-center text-[11px] font-bold font-mono text-[var(--color-text-primary)]">
                    {threat.score}
                  </div>
                  {expanded === threat.id
                    ? <ChevronUp className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                    : <ChevronDown className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />}
                </div>
              </div>

              {/* Expanded detail */}
              <AnimatePresence>
                {expanded === threat.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-[var(--color-border)] px-4 py-4 bg-[var(--color-elevated)]">
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
                          <p className="text-[10px] text-[var(--color-text-muted)] font-mono uppercase tracking-wider mb-1.5">AI Analysis</p>
                          <p className="text-[12.5px] text-[var(--color-text-secondary)] leading-relaxed">{threat.details}</p>
                        </div>
                        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
                          <p className="text-[10px] text-[var(--color-text-muted)] font-mono uppercase tracking-wider mb-1.5 flex items-center gap-1">
                            <Hash className="w-3 h-3" />File Hash
                          </p>
                          <p className="text-[11px] font-mono text-[var(--color-accent-text)] break-all leading-relaxed">{threat.hash}</p>
                          <p className="text-[10px] text-[var(--color-text-muted)] mt-1">Type: {threat.type}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {threat.status === 'active' && (
                          <button onClick={() => quarantine.mutate(threat.id)}
                            disabled={quarantine.isPending}
                            className="btn btn-sm btn-secondary border-high-border text-high hover:bg-high-bg">
                            {quarantine.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Archive className="w-3 h-3" />}
                            Quarantine
                          </button>
                        )}
                        {threat.status !== 'resolved' && (
                          <button onClick={() => resolve.mutate(threat.id)}
                            disabled={resolve.isPending}
                            className="btn btn-sm btn-secondary border-safe-border text-safe hover:bg-safe-bg">
                            {resolve.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                            Mark Resolved
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
       )}
    </div>
  )
}
