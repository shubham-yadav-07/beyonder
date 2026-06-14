import { motion } from 'framer-motion'
import {
  Shield, AlertTriangle, HardDrive, Brain, Activity,
  TrendingDown, Zap, Globe, RefreshCw, ArrowUpRight,
  CheckCircle2, Clock, Database
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadialBarChart, RadialBar, Cell,
  BarChart, Bar, Legend
} from 'recharts'
import { StatCard, Card, SectionHeader } from '@/components/ui/Card'
import { ThreatBadge, StatusBadge } from '@/components/ui/Badge'
import { SkeletonStats, SkeletonList } from '@/components/ui/Skeleton'
import { Empty } from '@/components/ui/Empty'
import { useThreatScore, useThreatHistory, useThreats, useRunScan, useBackupStats } from '@/hooks/useApi'
import { cn } from '@/utils/cn'
import { formatDistanceToNow } from 'date-fns'

// Custom tooltip for charts
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="card p-3 text-[12px] min-w-[140px] shadow-xl">
      <p className="text-[var(--color-text-muted)] mb-2 font-medium">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span className="text-[var(--color-text-secondary)] capitalize">{p.name}</span>
          </div>
          <span className="font-semibold text-[var(--color-text-primary)]">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

const STAGGER = {
  container: { animate: { transition: { staggerChildren: 0.07 } } },
  item: { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0, transition: { duration: 0.35 } } },
}

export default function Dashboard() {
  const { data: score, isLoading: scoreLoading } = useThreatScore()
  const { data: history = [], isLoading: histLoading } = useThreatHistory()
  const { data: threats = [], isLoading: threatsLoading } = useThreats({ limit: 6 } as any)
  const { data: backupStats } = useBackupStats()
  const scan = useRunScan()

  const scoreVal   = score?.score ?? 0
  const scoreColor = scoreVal < 30 ? '#22c982' : scoreVal < 60 ? '#d4a017' : '#e8405a'
  const riskLabel  = scoreVal < 30 ? 'Low Risk' : scoreVal < 60 ? 'Medium Risk' : 'High Risk'
  const riskColor  = scoreVal < 30 ? 'text-safe' : scoreVal < 60 ? 'text-medium' : 'text-critical'

  // Distribution data for bar chart
  const distData = [
    { name: 'Critical', value: score?.critical_threats ?? 0, color: '#e8405a' },
    { name: 'High',     value: threats.filter((t: any) => t.level === 'high').length,   color: '#f27c35' },
    { name: 'Medium',   value: threats.filter((t: any) => t.level === 'medium').length, color: '#d4a017' },
    { name: 'Low',      value: threats.filter((t: any) => t.level === 'low').length,    color: '#22c982' },
  ]

  return (
    <motion.div variants={STAGGER.container} initial="initial" animate="animate" className="space-y-5">

      {/* ── Page header ── */}
      <motion.div variants={STAGGER.item} className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-[22px] text-[var(--color-text-primary)] tracking-tight">
            Security Overview
          </h1>
          <p className="text-[13px] text-[var(--color-text-muted)] mt-0.5">
            Real-time threat intelligence · {new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-safe-bg border border-safe-border">
            <span className="w-1.5 h-1.5 rounded-full bg-safe animate-pulse-dot" />
            <span className="text-[10px] font-mono font-semibold text-safe tracking-wide">LIVE</span>
          </div>
          <button
            onClick={() => scan.mutate()} disabled={scan.isPending}
            className="btn btn-primary btn-sm"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', scan.isPending && 'animate-spin')} />
            {scan.isPending ? 'Scanning…' : 'Run Scan'}
          </button>
        </div>
      </motion.div>

      {/* ── Stat cards ── */}
      <motion.div variants={STAGGER.item}>
        {scoreLoading ? <SkeletonStats cols={4} /> : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Threat Score"
              value={`${scoreVal}/100`}
              sub={riskLabel}
              icon={Shield}
              iconBg="bg-safe-bg"
              iconColor="text-safe"
              accent={riskColor}
              trend={{ value: '12 pts from last week', up: false }}
              delay={0}
            />
            <StatCard
              label="Active Threats"
              value={score?.active_threats ?? 0}
              sub={`${score?.critical_threats ?? 0} critical`}
              icon={AlertTriangle}
              iconBg="bg-critical-bg"
              iconColor="text-critical"
              accent={score?.active_threats ? 'text-critical' : 'text-safe'}
              delay={0.07}
            />
            <StatCard
              label="Files Monitored"
              value={(score?.scanned_files ?? 0).toLocaleString()}
              sub="Continuous real-time scan"
              icon={Globe}
              iconBg="bg-[var(--color-accent-subtle)]"
              iconColor="text-[var(--color-accent-text)]"
              accent="text-[var(--color-accent-text)]"
              delay={0.14}
            />
            <StatCard
              label="AI Accuracy"
              value="99.2%"
              sub="Mother AI v3.1.7"
              icon={Brain}
              iconBg="bg-[rgba(167,139,250,.12)]"
              iconColor="text-purple-400"
              accent="text-purple-400"
              delay={0.21}
            />
          </div>
        )}
      </motion.div>

      {/* ── Charts row ── */}
      <motion.div variants={STAGGER.item} className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Area chart */}
        <Card className="lg:col-span-2" padding="md">
          <SectionHeader
            title="Threat Activity"
            sub="7-day detection trend"
            action={
              <div className="flex gap-3">
                {[['#e8405a','Critical'],['#f27c35','High'],['#d4a017','Medium']].map(([c,l]) => (
                  <span key={l} className="flex items-center gap-1.5 text-[11px] text-[var(--color-text-muted)]">
                    <span className="w-2 h-2 rounded-sm" style={{background:c}}/>
                    {l}
                  </span>
                ))}
              </div>
            }
          />
          {histLoading ? (
            <div className="h-44 skeleton rounded-lg" />
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={history} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  {[['crit','#e8405a'],['high','#f27c35'],['med','#d4a017']].map(([id, c]) => (
                    <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={c} stopOpacity={0.22} />
                      <stop offset="95%" stopColor={c} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="2 4" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="critical" stroke="#e8405a" fill="url(#crit)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="high"     stroke="#f27c35" fill="url(#high)" strokeWidth={1.5} dot={false} />
                <Area type="monotone" dataKey="medium"   stroke="#d4a017" fill="url(#med)"  strokeWidth={1.5} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Risk score radial */}
        <Card padding="md" className="flex flex-col">
          <SectionHeader title="Risk Score" sub="System-wide rating" />
          <div className="flex-1 flex flex-col items-center justify-center py-2">
            {scoreLoading ? (
              <div className="w-36 h-36 skeleton rounded-full" />
            ) : (
              <>
                <div className="relative w-[152px] h-[152px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart
                      cx="50%" cy="50%"
                      innerRadius="60%" outerRadius="90%"
                      data={[{ value: 100 - scoreVal, fill: scoreColor }]}
                      startAngle={90} endAngle={-270}
                    >
                      <RadialBar dataKey="value" cornerRadius={6} background={{ fill: 'var(--color-elevated)' }} />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-display font-bold text-[32px] leading-none tracking-tight" style={{ color: scoreColor }}>
                      {scoreVal}
                    </span>
                    <span className="text-[11px] text-[var(--color-text-muted)]">/ 100</span>
                  </div>
                </div>
                <p className="font-semibold text-[14px] mt-3" style={{ color: scoreColor }}>{riskLabel}</p>
                <p className="text-[11px] text-[var(--color-text-muted)]">
                  Based on {score?.total_threats ?? 0} detections
                </p>
              </>
            )}
          </div>
        </Card>
      </motion.div>

      {/* ── Bottom row ── */}
      <motion.div variants={STAGGER.item} className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Recent threats */}
        <Card className="lg:col-span-2" padding="md">
          <SectionHeader
            title="Recent Detections"
            sub="Latest threat events"
            action={
              <a href="/threats" className="flex items-center gap-1 text-[12px] text-[var(--color-accent-text)] hover:underline">
                View all <ArrowUpRight className="w-3 h-3" />
              </a>
            }
          />
          {threatsLoading ? <SkeletonList rows={4} height="h-[58px]" /> :
           !threats.length ? (
            <Empty
              icon={CheckCircle2}
              title="No threats detected"
              description="Your system is clean. Run a scan to check."
            />
           ) : (
            <div className="space-y-1.5">
              {(threats as any[]).slice(0, 5).map((t, i) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[var(--color-elevated)] hover:bg-[var(--color-overlay)] transition-colors border border-transparent hover:border-[var(--color-border)] group"
                >
                  <div className={cn('w-1.5 h-8 rounded-full shrink-0', {
                    'bg-critical': t.level === 'critical',
                    'bg-high': t.level === 'high',
                    'bg-medium': t.level === 'medium',
                    'bg-safe': t.level === 'low',
                  })} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-[var(--color-text-primary)] truncate font-mono">{t.name}</p>
                    <p className="text-[11px] text-[var(--color-text-muted)] truncate">{t.path}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <ThreatBadge level={t.level} />
                    <StatusBadge status={t.status} />
                    <span className="text-[11px] text-[var(--color-text-muted)] font-mono w-6 text-right">{t.score}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </Card>

        {/* System health panel */}
        <div className="space-y-3">
          {/* Backup status */}
          <Card padding="sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[var(--color-accent-subtle)] flex items-center justify-center">
                <HardDrive className="w-4 h-4 text-[var(--color-accent-text)]" />
              </div>
              <div>
                <p className="text-[12px] font-semibold text-[var(--color-text-primary)]">Last Backup</p>
                <p className="text-[11px] text-[var(--color-text-muted)]">
                  {backupStats?.last_backup_at
                    ? formatDistanceToNow(new Date(backupStats.last_backup_at), { addSuffix: true })
                    : 'No backups yet'}
                </p>
              </div>
              <span className="ml-auto text-[11px] font-mono text-safe">{backupStats?.success_rate ?? 100}%</span>
            </div>
            {/* Mini progress */}
            <div className="w-full h-1.5 rounded-full bg-[var(--color-elevated)] overflow-hidden">
              <div className="h-full rounded-full bg-safe" style={{ width: `${backupStats?.success_rate ?? 100}%` }} />
            </div>
          </Card>

          {/* Threat distribution bar chart */}
          <Card padding="sm">
            <p className="text-[12px] font-semibold text-[var(--color-text-primary)] mb-3">Threat Distribution</p>
            <ResponsiveContainer width="100%" height={90}>
              <BarChart data={distData} barSize={28} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="value" radius={[4,4,0,0]}>
                  {distData.map((d, i) => <Cell key={i} fill={d.color} fillOpacity={0.85} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Quick metrics */}
          <Card padding="sm">
            {[
              { icon: Database, label: 'Blockchain Logs', val: '2,441', color: 'text-[var(--color-accent-text)]' },
              { icon: Clock, label: 'Avg Detect Time', val: '0.3s', color: 'text-safe' },
              { icon: Zap, label: 'AI Model', val: 'v3.1.7', color: 'text-purple-400' },
            ].map(({ icon: Icon, label, val, color }) => (
              <div key={label} className="flex items-center gap-3 py-2 border-b border-[var(--color-border)] last:border-0">
                <Icon className={cn('w-3.5 h-3.5 shrink-0', color)} />
                <span className="text-[12px] text-[var(--color-text-muted)] flex-1">{label}</span>
                <span className={cn('text-[12px] font-mono font-semibold', color)}>{val}</span>
              </div>
            ))}
          </Card>
        </div>
      </motion.div>
    </motion.div>
  )
}
