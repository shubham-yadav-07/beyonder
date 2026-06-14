import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FolderOpen, Plus, Trash2, ScanLine, AlertTriangle, Loader2, FolderPlus,
  ShieldCheck, Radio, FilePlus, FileMinus, FileEdit, FileSymlink, Activity,
} from 'lucide-react'
import { StatusBadge } from '@/components/ui/Badge'
import { Card, SectionHeader } from '@/components/ui/Card'
import { Empty } from '@/components/ui/Empty'
import { SkeletonList } from '@/components/ui/Skeleton'
import { useFolders, useAddFolder, useRemoveFolder, useFileEvents, useMonitorStatus } from '@/hooks/useApi'
import { monitorApi } from '@/services/api'
import type { Folder, FileEvent } from '@/types'
import { cn } from '@/utils/cn'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'

const EVENT_CFG: Record<string, { icon: typeof FilePlus; color: string; bg: string; label: string }> = {
  created:  { icon: FilePlus,    color: 'text-safe',                       bg: 'bg-safe-bg',     label: 'Created' },
  modified: { icon: FileEdit,    color: 'text-[var(--color-accent-text)]', bg: 'bg-[var(--color-accent-subtle)]', label: 'Modified' },
  deleted:  { icon: FileMinus,   color: 'text-critical',                   bg: 'bg-critical-bg', label: 'Deleted' },
  renamed:  { icon: FileSymlink, color: 'text-medium',                     bg: 'bg-medium-bg',   label: 'Renamed' },
}

export default function FolderMonitor() {
  const [newPath, setNewPath] = useState('')
  const [scanning, setScanning] = useState<string | null>(null)
  const { data: folders = [], isLoading } = useFolders()
  const { data: events = [], isLoading: eventsLoading } = useFileEvents()
  const { data: monitorStatus } = useMonitorStatus()
  const addFolder    = useAddFolder()
  const removeFolder = useRemoveFolder()

  const handleAdd = () => {
    const path = newPath.trim()
    if (!path) return
    addFolder.mutate({ path }, { onSuccess: () => setNewPath('') })
  }

  const handleScan = async (id: string) => {
    setScanning(id)
    try {
      await monitorApi.scan(id)
      toast.success('Scan complete')
    } catch { toast.error('Scan failed') }
    finally { setScanning(null) }
  }

  const totFiles   = (folders as Folder[]).reduce((s, f) => s + (f.file_count || 0), 0)
  const totThreats = (folders as Folder[]).reduce((s, f) => s + (f.threat_count || 0), 0)
  const liveCount  = (folders as Folder[]).filter(f => f.live_watch).length

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display font-bold text-[22px] text-[var(--color-text-primary)] tracking-tight">Folder Monitor</h1>
          <p className="text-[13px] text-[var(--color-text-muted)] mt-0.5">Real-time file system surveillance — create, modify, delete &amp; rename events</p>
        </div>
        {monitorStatus && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-safe-bg border border-safe-border">
            <Radio className="w-3 h-3 text-safe animate-pulse-dot" />
            <span className="text-[10px] font-mono font-bold text-safe tracking-wide uppercase">
              {monitorStatus.live_watches} live watch{monitorStatus.live_watches !== 1 ? 'es' : ''}
            </span>
          </div>
        )}
      </div>

      {/* Add folder card */}
      <Card padding="md">
        <SectionHeader title="Add Folder to Watch" sub="OS-level file system events are captured automatically" />
        <div className="flex gap-3">
          <input value={newPath} onChange={e => setNewPath(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="C:/Users/Admin/Documents  or  /home/user/projects"
            className="input flex-1 font-mono text-[12.5px] py-2.5" />
          <button onClick={handleAdd} disabled={addFolder.isPending || !newPath.trim()}
            className="btn btn-primary">
            {addFolder.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Add
          </button>
        </div>
        <div className="flex items-center gap-2 mt-3 text-[11.5px] text-[var(--color-text-muted)]">
          <ShieldCheck className="w-3.5 h-3.5 text-[var(--color-accent-text)]" />
          File system events are blockchain-logged. New/modified files are auto-analyzed by the AI engine.
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Monitored',      v: (folders as Folder[]).length, color: 'text-[var(--color-accent-text)]' },
          { label: 'Live Watches',   v: liveCount,                    color: 'text-safe' },
          { label: 'Total Files',    v: totFiles.toLocaleString(),    color: 'text-[var(--color-text-primary)]' },
          { label: 'Active Threats', v: totThreats,                   color: totThreats ? 'text-critical' : 'text-safe' },
        ].map(({ label, v, color }) => (
          <div key={label} className="card p-4 text-center">
            <p className={cn('font-display font-bold text-[24px]', color)}>{v}</p>
            <p className="text-[10px] text-[var(--color-text-muted)] font-mono uppercase tracking-wider mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Folder list */}
        <Card padding="none" className="lg:col-span-2">
          <div className="px-5 py-4 border-b border-[var(--color-border)]">
            <SectionHeader title="Monitored Locations" sub={`${(folders as Folder[]).length} folders`} />
          </div>
          {isLoading ? (
            <div className="p-4"><SkeletonList rows={4} /></div>
          ) : (folders as Folder[]).length === 0 ? (
            <Empty icon={FolderOpen} title="No folders added" description="Add a folder above to start monitoring" className="py-12" />
          ) : (
            <div className="divide-y divide-[var(--color-border)]">
              {(folders as Folder[]).map((f, i) => (
                <motion.div key={f.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-[var(--color-elevated)] transition-colors group"
                >
                  <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-lg', {
                    'bg-safe-bg border border-safe-border':     f.status === 'protected',
                    'bg-medium-bg border border-medium-border': f.status === 'warning',
                    'bg-[var(--color-accent-subtle)] border border-[rgba(99,102,241,.2)]': f.status === 'scanning',
                  })}>
                    <FolderOpen className={cn('w-4 h-4', {
                      'text-safe':   f.status === 'protected',
                      'text-medium': f.status === 'warning',
                      'text-[var(--color-accent-text)]': f.status === 'scanning',
                    })} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[13px] font-mono font-medium text-[var(--color-text-primary)] truncate">{f.path}</p>
                      {f.live_watch && (
                        <span className="flex items-center gap-1 text-[10px] text-safe font-mono shrink-0" title="OS-level live watch active">
                          <Radio className="w-2.5 h-2.5 animate-pulse-dot" />LIVE
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-[11px] text-[var(--color-text-muted)]">{(f.file_count||0).toLocaleString()} files</span>
                      {f.last_scan && <>
                        <span className="text-[var(--color-border-strong)]">·</span>
                        <span className="text-[11px] text-[var(--color-text-muted)]">
                          Scanned {formatDistanceToNow(new Date(f.last_scan), { addSuffix: true })}
                        </span>
                      </>}
                      {f.threat_count > 0 && <>
                        <span className="text-[var(--color-border-strong)]">·</span>
                        <span className="text-[11px] text-critical font-medium flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />{f.threat_count} threat{f.threat_count > 1 ? 's' : ''}
                        </span>
                      </>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={f.status as any} />
                    <button onClick={() => handleScan(f.id)} disabled={!!scanning}
                      className="btn btn-ghost btn-sm btn-icon opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-30">
                      {scanning === f.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ScanLine className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={() => removeFolder.mutate(f.id)}
                      className="btn btn-ghost btn-sm btn-icon opacity-0 group-hover:opacity-100 transition-opacity hover:text-critical hover:bg-critical-bg">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </Card>

        {/* Live event feed */}
        <Card padding="none">
          <div className="px-5 py-4 border-b border-[var(--color-border)]">
            <SectionHeader
              title="Live File Events"
              sub="Create · Modify · Delete · Rename"
              action={<Activity className="w-4 h-4 text-[var(--color-text-muted)]" />}
            />
          </div>
          {eventsLoading ? (
            <div className="p-4"><SkeletonList rows={4} height="h-12" /></div>
          ) : !(events as FileEvent[]).length ? (
            <Empty
              icon={Radio}
              title="No file events yet"
              description="Events appear here when watched folders detect changes on this host"
              className="py-10"
            />
          ) : (
            <div className="divide-y divide-[var(--color-border)] max-h-[420px] overflow-y-auto scroll-area">
              <AnimatePresence initial={false}>
                {(events as FileEvent[]).map((ev) => {
                  const cfg = EVENT_CFG[ev.event_type] || EVENT_CFG.modified
                  const Icon = cfg.icon
                  const filename = ev.path.split(/[\\/]/).pop()
                  return (
                    <motion.div key={ev.id}
                      initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-3 px-4 py-2.5"
                    >
                      <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0', cfg.bg)}>
                        <Icon className={cn('w-3.5 h-3.5', cfg.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-mono text-[var(--color-text-primary)] truncate">{filename}</p>
                        <p className="text-[10.5px] text-[var(--color-text-muted)]">
                          <span className={cfg.color}>{cfg.label}</span>
                          {' · '}{formatDistanceToNow(new Date(ev.timestamp), { addSuffix: true })}
                        </p>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
