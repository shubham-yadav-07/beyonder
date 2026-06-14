import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link2, CheckCircle2, Copy, ShieldCheck, Zap, Database, RefreshCw, Loader2, XCircle, Filter, Download } from 'lucide-react'
import { Card, SectionHeader } from '@/components/ui/Card'
import { Empty } from '@/components/ui/Empty'
import { SkeletonList } from '@/components/ui/Skeleton'
import { SeverityChip } from '@/components/ui/Badge'
import { useBlockchainLogs, useBlockchainStats } from '@/hooks/useApi'
import { blockchainApi } from '@/services/api'
import type { BlockchainLog } from '@/types'
import { cn } from '@/utils/cn'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export default function BlockchainLogs() {
  const [sevFilter, setSevFilter] = useState('all')
  const [verifying, setVerifying] = useState(false)
  const [exporting, setExporting] = useState(false)

  const { data: logs = [], isLoading, refetch } = useBlockchainLogs(
    sevFilter !== 'all' ? { severity: sevFilter, limit: 100 } : { limit: 100 }
  )
  const { data: stats, refetch: refetchStats } = useBlockchainStats()

  const handleVerify = async () => {
    setVerifying(true)
    try {
      const { data } = await blockchainApi.verify()
      if (data.verified)
        toast.success(`Chain verified — ${data.total_blocks} blocks, 100% integrity`)
      else
        toast.error(`Chain broken at block #${data.broken_at}`)
    } catch { toast.error('Verification failed') }
    finally { setVerifying(false) }
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const res = await blockchainApi.exportCsv()
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = 'beyonder_audit_log.csv'
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      toast.success('Audit log exported')
    } catch { toast.error('Export failed') }
    finally { setExporting(false) }
  }

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash)
    toast.success('Hash copied')
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display font-bold text-[22px] text-[var(--color-text-primary)] tracking-tight">Blockchain Logs</h1>
          <p className="text-[13px] text-[var(--color-text-muted)] mt-0.5">Immutable SHA-256 chained audit trail — tamper-evident</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExport} disabled={exporting} className="btn btn-secondary btn-sm">
            {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            Export CSV
          </button>
          <button onClick={handleVerify} disabled={verifying} className="btn btn-primary btn-sm">
            {verifying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
            Verify Chain
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Records',    v: stats?.total_records  ?? '—', icon: Database,    color: 'text-[var(--color-accent-text)]', bg: 'bg-[var(--color-accent-subtle)]' },
          { label: 'Verified Blocks',  v: stats?.verified_blocks ?? '—', icon: CheckCircle2, color: 'text-safe', bg: 'bg-safe-bg' },
          { label: 'Chain Integrity',  v: stats?.chain_integrity ?? '—', icon: ShieldCheck,  color: stats?.is_valid ? 'text-safe' : 'text-critical', bg: stats?.is_valid ? 'bg-safe-bg' : 'bg-critical-bg' },
        ].map(({ label, v, icon: Icon, color, bg }) => (
          <div key={label} className="card p-5 flex items-center gap-4">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', bg)}>
              <Icon className={cn('w-5 h-5', color)} />
            </div>
            <div>
              <p className={cn('font-display font-bold text-[22px] leading-none', color)}>{v}</p>
              <p className="text-[11px] text-[var(--color-text-muted)] font-mono uppercase tracking-wider mt-1">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Chain visualization */}
      <Card padding="md">
        <SectionHeader title="Chain Visualization" sub={`Latest ${Math.min((logs as BlockchainLog[]).length, 7)} blocks`} />
        <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1">
          {(logs as BlockchainLog[]).slice(0, 7).map((log, i) => (
            <div key={i} className="flex items-center gap-2 shrink-0">
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 rounded-xl bg-[var(--color-elevated)] border-2 border-[var(--color-accent)] border-opacity-30 flex flex-col items-center justify-center hover:border-opacity-100 transition-all cursor-pointer shadow-[0_0_12px_rgba(99,102,241,.07)]">
                  <Zap className="w-4 h-4 text-[var(--color-accent-text)]" />
                  <p className="text-[8px] font-mono text-[var(--color-text-muted)] mt-0.5 leading-tight text-center">
                    #{log.block_number}
                  </p>
                </div>
                <p className="text-[9px] font-mono text-[var(--color-text-muted)] mt-1 max-w-[56px] truncate text-center">
                  {log.event.replace(/_/g, ' ')}
                </p>
              </div>
              {i < Math.min((logs as BlockchainLog[]).length, 7) - 1 && (
                <div className="flex items-center gap-0.5 shrink-0 mb-5">
                  <div className="w-4 h-px bg-[var(--color-accent)] opacity-40" />
                  <div className="w-2 h-2 rounded-full bg-[var(--color-accent)] opacity-50" />
                  <div className="w-4 h-px bg-[var(--color-accent)] opacity-40" />
                </div>
              )}
            </div>
          ))}
          {(logs as BlockchainLog[]).length === 0 && (
            <div className="w-14 h-14 rounded-xl border-2 border-dashed border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-muted)] text-[10px]">
              empty
            </div>
          )}
          {/* Pending block */}
          {(logs as BlockchainLog[]).length > 0 && (
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-0.5 mb-5">
                <div className="w-4 h-px bg-[var(--color-border)]" />
                <div className="w-2 h-2 rounded-full bg-[var(--color-border)]" />
                <div className="w-4 h-px bg-[var(--color-border)]" />
              </div>
              <div className="w-14 h-14 rounded-xl border-2 border-dashed border-[var(--color-border)] flex flex-col items-center justify-center opacity-40 mb-5">
                <Zap className="w-4 h-4 text-[var(--color-text-muted)]" />
                <p className="text-[8px] font-mono text-[var(--color-text-muted)]">next</p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
        {['all','CRITICAL','HIGH','INFO','LOW'].map(s => (
          <button key={s} onClick={() => setSevFilter(s)}
            className={cn(
              'btn btn-xs',
              sevFilter === s ? 'btn-primary' : 'btn-secondary'
            )}>
            {s === 'all' ? 'All Events' : s}
          </button>
        ))}
        <button onClick={() => { refetch(); refetchStats() }}
          className="btn btn-ghost btn-xs btn-icon ml-auto">
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Log table */}
      <Card padding="none">
        <div className="px-5 py-4 border-b border-[var(--color-border)] flex items-center justify-between">
          <p className="font-display font-semibold text-[15px] text-[var(--color-text-primary)]">Audit Entries</p>
          <span className="text-[11px] text-[var(--color-text-muted)]">{(logs as BlockchainLog[]).length} records</span>
        </div>

        {isLoading ? (
          <div className="p-4"><SkeletonList rows={5} /></div>
        ) : (logs as BlockchainLog[]).length === 0 ? (
          <Empty
            icon={Database}
            title="No blockchain logs yet"
            description="Audit entries appear automatically as security events occur"
            className="py-12"
          />
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {(logs as BlockchainLog[]).map((log, i) => (
              <motion.div key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.025 }}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-[var(--color-elevated)] transition-colors group cursor-pointer"
              >
                {/* Verification indicator */}
                {log.verified
                  ? <CheckCircle2 className="w-4 h-4 text-safe shrink-0" />
                  : <XCircle className="w-4 h-4 text-critical shrink-0" />}

                {/* Event info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-[12.5px] font-mono font-semibold text-[var(--color-text-primary)]">{log.event}</span>
                    <SeverityChip value={log.severity} />
                  </div>
                  <button
                    onClick={() => copyHash(log.hash)}
                    className="flex items-center gap-1.5 text-[11px] font-mono text-[var(--color-text-muted)] hover:text-[var(--color-accent-text)] transition-colors"
                  >
                    {log.hash}
                    <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                  <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
                    Block #{log.block_number} &ensp;·&ensp; prev: {log.previous_hash?.slice(0, 16)}…
                  </p>
                </div>

                {/* Timestamp */}
                <div className="text-right shrink-0">
                  <p className="text-[12px] font-mono text-[var(--color-text-secondary)]">
                    {format(new Date(log.timestamp), 'HH:mm:ss')}
                  </p>
                  <p className="text-[10px] text-[var(--color-text-muted)]">
                    {format(new Date(log.timestamp), 'MMM dd, yyyy')}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
