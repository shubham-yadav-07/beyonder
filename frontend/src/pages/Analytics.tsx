import { motion } from 'framer-motion'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts'
import { Card, SectionHeader } from '@/components/ui/Card'
import { SkeletonStats } from '@/components/ui/Skeleton'
import { useThreatScore, useThreatHistory, useBackupStats, useBlockchainStats } from '@/hooks/useApi'
import { TrendingUp, TrendingDown, Shield, HardDrive, Zap, Clock } from 'lucide-react'
import { cn } from '@/utils/cn'

// Custom tooltip
function ChartTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="card p-3 text-[12px] min-w-[130px] shadow-xl border border-[var(--color-border-strong)]">
      <p className="text-[var(--color-text-muted)] mb-2 font-medium">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span className="text-[var(--color-text-secondary)] capitalize">{p.dataKey}</span>
          </div>
          <span className="font-bold text-[var(--color-text-primary)]">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

const THREAT_CATEGORIES = [
  { name: 'Ransomware',       value: 32, color: '#e8405a' },
  { name: 'Trojan',           value: 24, color: '#f27c35' },
  { name: 'Keylogger',        value: 18, color: '#d4a017' },
  { name: 'Adware/PUP',       value: 14, color: '#38b6f5' },
  { name: 'System Masquerade',value: 8,  color: '#a78bfa' },
  { name: 'Other',            value: 4,  color: '#555a72' },
]

const SECURITY_SCORE_HISTORY = [
  { month: 'Aug', score: 68 }, { month: 'Sep', score: 72 }, { month: 'Oct', score: 65 },
  { month: 'Nov', score: 78 }, { month: 'Dec', score: 82 }, { month: 'Jan', score: 77 },
]

const RESPONSE_TIME = [
  { day: 'Mon', detect: 0.4, quarantine: 1.2 },
  { day: 'Tue', detect: 0.3, quarantine: 0.9 },
  { day: 'Wed', detect: 0.5, quarantine: 1.4 },
  { day: 'Thu', detect: 0.2, quarantine: 0.7 },
  { day: 'Fri', detect: 0.3, quarantine: 1.1 },
  { day: 'Sat', detect: 0.4, quarantine: 1.0 },
  { day: 'Sun', detect: 0.3, quarantine: 0.8 },
]

const STAGGER = {
  container: { animate: { transition: { staggerChildren: 0.06 } } },
  item: { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0, transition: { duration: 0.3 } } },
}

function KPICard({ label, value, change, changeLabel, icon: Icon, color, bg }: any) {
  const isPositive = change >= 0
  return (
    <motion.div variants={STAGGER.item} className="card p-5 card-interactive relative overflow-hidden">
      <div className="flex items-start justify-between mb-4">
        <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', bg)}>
          <Icon className={cn('w-4 h-4', color)} />
        </div>
        <span className={cn('text-[11px] font-semibold flex items-center gap-1',
          isPositive ? 'text-[#e8405a]' : 'text-[#22c982]')}>
          {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {Math.abs(change)}%
        </span>
      </div>
      <p className={cn('font-display font-bold text-[28px] leading-none tracking-tight mb-1', color)}>{value}</p>
      <p className="text-[11px] text-[var(--color-text-muted)] font-medium uppercase tracking-wider">{label}</p>
      <p className="text-[11px] text-[var(--color-text-muted)] mt-1 opacity-70">{changeLabel}</p>
      <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--color-accent)] to-transparent opacity-0 group-hover:opacity-40 transition-opacity" />
    </motion.div>
  )
}

export default function Analytics() {
  const { data: score, isLoading: scoreLoad } = useThreatScore()
  const { data: history = [], isLoading: histLoad } = useThreatHistory()
  const { data: backupStats } = useBackupStats()
  const { data: chainStats } = useBlockchainStats()

  return (
    <motion.div variants={STAGGER.container} initial="initial" animate="animate" className="space-y-5">

      {/* Header */}
      <motion.div variants={STAGGER.item} className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-[22px] text-[var(--color-text-primary)] tracking-tight">Analytics</h1>
          <p className="text-[13px] text-[var(--color-text-muted)] mt-0.5">Security intelligence dashboard and trend analysis</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-safe-bg border border-safe-border">
          <span className="w-1.5 h-1.5 rounded-full bg-safe animate-pulse-dot" />
          <span className="text-[10px] font-mono font-bold text-safe tracking-wide uppercase">Live</span>
        </div>
      </motion.div>

      {/* KPI Row */}
      {scoreLoad ? <SkeletonStats cols={4} /> : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard label="Security Score" value={`${100 - (score?.score ?? 23)}/100`} change={-12}
            changeLabel="vs last month" icon={Shield}
            color="text-[#22c982]" bg="bg-safe-bg" />
          <KPICard label="Threats Blocked" value={score?.total_threats ?? 0} change={8}
            changeLabel="this month" icon={Zap}
            color="text-[#e8405a]" bg="bg-critical-bg" />
          <KPICard label="Detection Speed" value="0.3s" change={-35}
            changeLabel="avg response time" icon={Clock}
            color="text-[var(--color-accent-text)]" bg="bg-[var(--color-accent-subtle)]" />
          <KPICard label="Backup Coverage" value={`${backupStats?.success_rate ?? 100}%`} change={-2}
            changeLabel="files protected" icon={HardDrive}
            color="text-[#a78bfa]" bg="bg-[rgba(167,139,250,.1)]" />
        </div>
      )}

      {/* Main charts row */}
      <motion.div variants={STAGGER.item} className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Threat trend area chart */}
        <Card className="lg:col-span-2" padding="md">
          <SectionHeader title="Threat Detection Trend" sub="Daily breakdown by severity — last 7 days"
            action={
              <div className="flex gap-3">
                {[['#e8405a','Critical'],['#f27c35','High'],['#d4a017','Medium']].map(([c,l]) => (
                  <span key={l} className="flex items-center gap-1.5 text-[11px] text-[var(--color-text-muted)]">
                    <span className="w-2 h-2 rounded-sm" style={{ background: c }} />
                    {l}
                  </span>
                ))}
              </div>
            }
          />
          {histLoad ? <div className="h-48 skeleton rounded-lg" /> : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={history} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  {[['crit','#e8405a'],['high','#f27c35'],['med','#d4a017']].map(([id,c]) => (
                    <linearGradient key={id} id={`g${id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={c} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={c} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="2 4" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: 'var(--color-text-muted)', fontSize: 11, fontFamily: 'Fira Code' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTip />} />
                <Area type="monotone" dataKey="critical" stroke="#e8405a" fill="url(#gcrit)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="high"     stroke="#f27c35" fill="url(#ghigh)" strokeWidth={1.5} dot={false} />
                <Area type="monotone" dataKey="medium"   stroke="#d4a017" fill="url(#gmed)"  strokeWidth={1.5} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Threat category pie */}
        <Card padding="md" className="flex flex-col">
          <SectionHeader title="Threat Categories" sub="By malware type" />
          <div className="flex-1 flex flex-col items-center">
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={THREAT_CATEGORIES} cx="50%" cy="50%" innerRadius={45} outerRadius={70}
                  paddingAngle={2} dataKey="value" strokeWidth={0}>
                  {THREAT_CATEGORIES.map((c, i) => <Cell key={i} fill={c.color} />)}
                </Pie>
                <Tooltip content={<ChartTip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="w-full space-y-1.5 mt-1">
              {THREAT_CATEGORIES.map(c => (
                <div key={c.name} className="flex items-center justify-between text-[11.5px]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: c.color }} />
                    <span className="text-[var(--color-text-muted)]">{c.name}</span>
                  </div>
                  <span className="font-mono font-semibold text-[var(--color-text-secondary)]">{c.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Second row */}
      <motion.div variants={STAGGER.item} className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Security score over time */}
        <Card padding="md">
          <SectionHeader title="Security Score History" sub="Monthly trend — higher is better" />
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={SECURITY_SCORE_HISTORY} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 4" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[50, 100]} tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTip />} />
              <Line type="monotone" dataKey="score" stroke="var(--color-accent)" strokeWidth={2.5}
                dot={{ fill: 'var(--color-accent)', r: 4, strokeWidth: 0 }}
                activeDot={{ r: 6, fill: 'var(--color-accent)' }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Response time bar chart */}
        <Card padding="md">
          <SectionHeader title="Response Time" sub="Detection & quarantine speed (seconds)" />
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={RESPONSE_TIME} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barGap={4}>
              <CartesianGrid strokeDasharray="2 4" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: 'var(--color-text-muted)' }} />
              <Bar dataKey="detect"    fill="#6366f1" radius={[3,3,0,0]} fillOpacity={0.85} />
              <Bar dataKey="quarantine" fill="#22c982" radius={[3,3,0,0]} fillOpacity={0.85} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </motion.div>

      {/* Stats summary row */}
      <motion.div variants={STAGGER.item} className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Events Logged',    v: (chainStats?.total_records ?? 2441).toLocaleString(), note: 'Blockchain verified', color: 'text-[var(--color-accent-text)]' },
          { label: 'Files Protected',        v: (score?.scanned_files ?? 13809).toLocaleString(),     note: 'Active monitoring',   color: 'text-[#22c982]' },
          { label: 'Avg Threat Score',       v: `${score?.score ?? 23}/100`,                          note: 'Low risk zone',       color: 'text-[#22c982]' },
          { label: 'Backup Snapshots',       v: backupStats?.total_backups ?? 5,                      note: '100% encrypted',      color: 'text-[#a78bfa]' },
        ].map(({ label, v, note, color }) => (
          <div key={label} className="card p-4 text-center">
            <p className={cn('font-display font-bold text-[22px] leading-none', color)}>{v}</p>
            <p className="text-[11px] text-[var(--color-text-muted)] font-mono uppercase tracking-wider mt-1.5">{label}</p>
            <p className="text-[10.5px] text-[var(--color-text-muted)] mt-0.5 opacity-60">{note}</p>
          </div>
        ))}
      </motion.div>
    </motion.div>
  )
}
