import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HardDrive, RotateCcw, CheckCircle2, Clock, Database, CloudUpload,
  Loader2, ShieldCheck, AlertCircle, FolderArchive, ChevronDown,
  FileSearch, History, XCircle, GitBranch,
} from 'lucide-react'
import { Card, SectionHeader } from '@/components/ui/Card'
import { Empty } from '@/components/ui/Empty'
import { SkeletonList } from '@/components/ui/Skeleton'
import {
  useBackups, useBackupStats, useCreateBackup,
  useRestoreBackup, useValidateBackup, useRecoveryLogs,
} from '@/hooks/useApi'
import type { Backup, RecoveryLog } from '@/types'
import { cn } from '@/utils/cn'
import { formatDistanceToNow, format } from 'date-fns'

const TYPE_STYLES: Record<string, string> = {
  full:        'text-[var(--color-accent-text)] bg-[var(--color-accent-subtle)] border-[rgba(99,102,241,.2)]',
  incremental: 'text-purple-400 bg-[rgba(167,139,250,.1)] border-[rgba(167,139,250,.2)]',
  selective:   'text-info bg-info-bg border-info-border',
  snapshot:    'text-medium bg-medium-bg border-medium-border',
}

const RECOVERY_STATUS_STYLES: Record<string, { cls: string; icon: typeof CheckCircle2; label: string }> = {
  validating: { cls: 'text-info bg-info-bg border-info-border',         icon: FileSearch,   label: 'Validating' },
  restoring:  { cls: 'text-[var(--color-accent-text)] bg-[var(--color-accent-subtle)] border-[rgba(99,102,241,.2)]', icon: Loader2, label: 'Restoring' },
  complete:   { cls: 'text-safe bg-safe-bg border-safe-border',         icon: CheckCircle2, label: 'Complete' },
  failed:     { cls: 'text-critical bg-critical-bg border-critical-border', icon: XCircle,  label: 'Failed' },
}

function formatBytes(b?: number) {
  if (!b) return '—'
  if (b >= 1e9) return `${(b / 1e9).toFixed(1)} GB`
  if (b >= 1e6) return `${(b / 1e6).toFixed(0)} MB`
  return `${(b / 1e3).toFixed(0)} KB`
}

export default function BackupRecovery() {
  const [showForm, setShowForm] = useState(false)
  const [showLogs, setShowLogs] = useState(false)
  const [name, setName] = useState('')
  const [type, setType] = useState<'full' | 'incremental' | 'selective' | 'snapshot'>('full')
  const [validatingId, setValidatingId] = useState<string | null>(null)

  const { data: backups = [], isLoading } = useBackups()
  const { data: stats } = useBackupStats()
  const { data: recoveryLogs = [], isLoading: logsLoading } = useRecoveryLogs()
  const createBackup  = useCreateBackup()
  const restoreBackup = useRestoreBackup()
  const validateBackup = useValidateBackup()

  const hasCompletedBackup = (backups as Backup[]).some(b => b.status === 'complete')

  const handleCreate = () => {
    createBackup.mutate(
      { name: name.trim() || `${type.charAt(0).toUpperCase() + type.slice(1)} Backup`, type },
      { onSuccess: () => { setShowForm(false); setName('') } }
    )
  }

  const handleValidate = (id: string) => {
    setValidatingId(id)
    validateBackup.mutate(id, { onSettled: () => setValidatingId(null) })
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display font-bold text-[22px] text-[var(--color-text-primary)] tracking-tight">Backup & Recovery</h1>
          <p className="text-[13px] text-[var(--color-text-muted)] mt-0.5">AES-256 encrypted backups with checksum validation &amp; blockchain verification</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowLogs(v => !v)} className="btn btn-secondary btn-sm">
            <History className="w-3.5 h-3.5" />
            Recovery Logs
            {recoveryLogs.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-[var(--color-accent-subtle)] text-[var(--color-accent-text)] text-[10px] font-bold">
                {recoveryLogs.length}
              </span>
            )}
          </button>
          <button onClick={() => setShowForm(v => !v)} className="btn btn-primary btn-sm">
            <CloudUpload className="w-3.5 h-3.5" />
            New Backup
            <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', showForm && 'rotate-180')} />
          </button>
        </div>
      </div>

      {/* Create form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <Card padding="md" glow="accent">
              <SectionHeader title="Configure Backup" />
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-[11px] text-[var(--color-text-muted)] font-semibold uppercase tracking-widest mb-1.5">Name</label>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Pre-deploy Snapshot"
                    className="input text-[13px]" />
                </div>
                <div>
                  <label className="block text-[11px] text-[var(--color-text-muted)] font-semibold uppercase tracking-widest mb-1.5">Type</label>
                  <select value={type} onChange={e => setType(e.target.value as any)}
                    className="input text-[13px]">
                    <option value="full">Full Backup</option>
                    <option value="incremental" disabled={!hasCompletedBackup}>
                      Incremental {!hasCompletedBackup && '(requires a full backup first)'}
                    </option>
                    <option value="selective">Selective (Critical Files)</option>
                    <option value="snapshot">Pre-event Snapshot</option>
                  </select>
                </div>
              </div>

              {type === 'incremental' && hasCompletedBackup && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-[rgba(167,139,250,.08)] border border-[rgba(167,139,250,.2)] mb-3 text-[12px] text-purple-300">
                  <GitBranch className="w-4 h-4 shrink-0" />
                  This will capture only changes since your last completed backup — typically 2–12% of full size.
                </div>
              )}

              <div className="flex items-center gap-2 p-3 rounded-lg bg-[var(--color-elevated)] border border-[var(--color-border)] mb-4 text-[12px] text-[var(--color-text-muted)]">
                <ShieldCheck className="w-4 h-4 text-[var(--color-accent-text)] shrink-0" />
                AES-256 encrypted · SHA-256 checksum manifest · Blockchain hash-verified
              </div>

              <div className="flex gap-2">
                <button onClick={handleCreate} disabled={createBackup.isPending} className="btn btn-primary">
                  {createBackup.isPending ? <><Loader2 className="w-4 h-4 animate-spin" />Starting…</> : <><CloudUpload className="w-4 h-4" />Start Backup</>}
                </button>
                <button onClick={() => setShowForm(false)} className="btn btn-secondary">Cancel</button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recovery logs panel */}
      <AnimatePresence>
        {showLogs && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <Card padding="none">
              <div className="px-5 py-4 border-b border-[var(--color-border)]">
                <SectionHeader title="Recovery Logs" sub="Restore validation & progress history" />
              </div>
              {logsLoading ? (
                <div className="p-4"><SkeletonList rows={2} /></div>
              ) : !(recoveryLogs as RecoveryLog[]).length ? (
                <Empty icon={History} title="No recovery operations yet" description="Restore a backup to see its progress here" className="py-8" />
              ) : (
                <div className="divide-y divide-[var(--color-border)]">
                  {(recoveryLogs as RecoveryLog[]).map((log, i) => {
                    const cfg = RECOVERY_STATUS_STYLES[log.status]
                    const Icon = cfg.icon
                    return (
                      <motion.div key={log.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                        className="flex items-center gap-4 px-5 py-3.5">
                        <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border', cfg.cls)}>
                          <Icon className={cn('w-4 h-4', log.status === 'restoring' && 'animate-spin')} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-[13px] font-semibold text-[var(--color-text-primary)]">Recovery {log.id.slice(0, 8)}</p>
                            <span className={cn('badge', cfg.cls)}>{cfg.label}</span>
                            {log.checksum_verified && (
                              <span className="flex items-center gap-1 text-[11px] text-safe">
                                <ShieldCheck className="w-3 h-3" />checksum verified
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                            Started {formatDistanceToNow(new Date(log.started_at), { addSuffix: true })}
                            {log.files_restored > 0 && <> · {log.files_restored.toLocaleString()} files restored</>}
                            {log.error && <span className="text-critical"> · {log.error}</span>}
                          </p>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Backups',  v: stats?.total_backups ?? '—',   icon: Database,     color: 'text-[var(--color-accent-text)]', bg: 'bg-[var(--color-accent-subtle)]' },
          { label: 'Storage Used',   v: formatBytes(stats?.total_size_bytes), icon: HardDrive, color: 'text-purple-400', bg: 'bg-[rgba(167,139,250,.1)]' },
          { label: 'Last Backup',    v: stats?.last_backup_at ? formatDistanceToNow(new Date(stats.last_backup_at), { addSuffix: true }) : 'Never', icon: Clock, color: 'text-safe', bg: 'bg-safe-bg' },
          { label: 'Recovery Rate',  v: stats ? `${stats.recovery_success_rate}%` : '—', icon: CheckCircle2, color: 'text-safe', bg: 'bg-safe-bg' },
        ].map(({ label, v, icon: Icon, color, bg }) => (
          <div key={label} className="card p-4 hover:border-[var(--color-border-strong)] transition-colors">
            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center mb-3', bg)}>
              <Icon className={cn('w-4 h-4', color)} />
            </div>
            <p className={cn('font-display font-bold text-[20px] leading-none', color)}>{v}</p>
            <p className="text-[10px] text-[var(--color-text-muted)] font-mono uppercase tracking-wider mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Backup history */}
      <Card padding="none">
        <div className="px-5 py-4 border-b border-[var(--color-border)] flex items-center justify-between">
          <div>
            <p className="font-display font-semibold text-[15px] text-[var(--color-text-primary)]">Backup History</p>
            <p className="text-[11px] text-[var(--color-text-muted)]">{(backups as Backup[]).length} snapshots available</p>
          </div>
          <FolderArchive className="w-4 h-4 text-[var(--color-text-muted)]" />
        </div>
        {isLoading ? (
          <div className="p-4"><SkeletonList rows={4} /></div>
        ) : !(backups as Backup[]).length ? (
          <Empty icon={Database} title="No backups yet" description="Create your first backup to protect your data" className="py-12" />
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {(backups as Backup[]).map((b, i) => (
              <motion.div key={b.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-[var(--color-elevated)] transition-colors group"
              >
                <div className="w-9 h-9 rounded-lg bg-[var(--color-elevated)] border border-[var(--color-border)] flex items-center justify-center shrink-0">
                  <HardDrive className="w-4 h-4 text-[var(--color-text-muted)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-[13px] font-semibold text-[var(--color-text-primary)]">{b.name}</p>
                    {b.status === 'running' && (
                      <span className="flex items-center gap-1 text-[11px] text-[var(--color-accent-text)]">
                        <Loader2 className="w-3 h-3 animate-spin" />running
                      </span>
                    )}
                    {b.parent_backup_id && b.delta_pct != null && (
                      <span className="flex items-center gap-1 text-[11px] text-purple-400">
                        <GitBranch className="w-3 h-3" />{b.delta_pct}% delta
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                    {b.created_at ? format(new Date(b.created_at), 'MMM dd, yyyy · HH:mm') : '—'}
                    &ensp;·&ensp;{formatBytes(b.size_bytes)}
                    {b.file_count && <>&ensp;·&ensp;{b.file_count.toLocaleString()} files</>}
                    {b.blockchain_hash && <span className="text-[var(--color-accent-text)]">&ensp;·&ensp;⛓ verified</span>}
                  </p>
                </div>
                <span className={cn('badge', TYPE_STYLES[b.type] || TYPE_STYLES.full)}>{b.type}</span>

                {b.status === 'complete' ? (
                  <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleValidate(b.id)} disabled={validatingId === b.id}
                      title="Validate checksum integrity"
                      className="btn btn-ghost btn-sm border border-[var(--color-border)] disabled:opacity-30">
                      {validatingId === b.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={() => restoreBackup.mutate(b.id)} disabled={restoreBackup.isPending}
                      className="btn btn-ghost btn-sm border border-[var(--color-border)] disabled:opacity-30">
                      {restoreBackup.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                      Restore
                    </button>
                  </div>
                ) : b.status === 'failed' ? (
                  <span className="flex items-center gap-1 text-[11px] text-critical">
                    <AlertCircle className="w-3.5 h-3.5" />Failed
                  </span>
                ) : null}
              </motion.div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
