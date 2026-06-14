import { useState } from 'react'
import { motion } from 'framer-motion'
import { Bell, Brain, HardDrive, Shield, Lock, Save, Loader2, CheckCircle2, User, Key } from 'lucide-react'
import { Card, SectionHeader } from '@/components/ui/Card'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { cn } from '@/utils/cn'
import { useAuthStore } from '@/store/authStore'
import { usePreferencesStore } from '@/store/preferencesStore'
import { authApi } from '@/services/api'
import toast from 'react-hot-toast'

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange} role="switch" aria-checked={on}
      className={cn('relative w-10 h-5 rounded-full transition-colors duration-200 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]',
        on ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-elevated)] border border-[var(--color-border-strong)]')}>
      <motion.span
        animate={{ x: on ? 20 : 2 }}
        transition={{ type: 'spring', stiffness: 600, damping: 35 }}
        className="absolute top-[3px] w-[14px] h-[14px] rounded-full bg-white shadow-sm"
      />
    </button>
  )
}

function SettingRow({ label, desc, on, onChange }: { label: string; desc?: string; on: boolean; onChange: () => void }) {
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-[var(--color-border)] last:border-0">
      <div className="pr-8">
        <p className="text-[13.5px] font-medium text-[var(--color-text-primary)]">{label}</p>
        {desc && <p className="text-[11.5px] text-[var(--color-text-muted)] mt-0.5">{desc}</p>}
      </div>
      <Toggle on={on} onChange={onChange} />
    </div>
  )
}

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <Card padding="none">
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-[var(--color-border)]">
        <Icon className="w-4 h-4 text-[var(--color-accent-text)]" />
        <h2 className="font-display font-semibold text-[14px] text-[var(--color-text-primary)]">{title}</h2>
      </div>
      <div className="px-5">{children}</div>
    </Card>
  )
}

export default function Settings() {
  const { user } = useAuthStore()
  const [saved, setSaved]     = useState(false)
  const [pwLoading, setPwL]   = useState(false)
  const [pw, setPw]           = useState({ current: '', next: '', confirm: '' })

  const { prefs, toggle, reset } = usePreferencesStore()

  // Toggles persist to localStorage instantly via usePreferencesStore.
  // This button now just gives explicit confirmation feedback.
  const savePrefs = () => {
    setSaved(true)
    toast.success('Preferences saved')
    setTimeout(() => setSaved(false), 2500)
  }

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pw.next !== pw.confirm) { toast.error('Passwords do not match'); return }
    if (pw.next.length < 8)     { toast.error('Min 8 characters required'); return }
    setPwL(true)
    try {
      await authApi.changePassword({ current_password: pw.current, new_password: pw.next })
      toast.success('Password updated')
      setPw({ current: '', next: '', confirm: '' })
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to update password')
    } finally { setPwL(false) }
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="font-display font-bold text-[22px] text-[var(--color-text-primary)] tracking-tight">Settings</h1>
        <p className="text-[13px] text-[var(--color-text-muted)] mt-0.5">Manage security preferences and account configuration</p>
      </div>

      {/* Profile card */}
      <Card padding="md">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--color-accent)] to-purple-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
            {user?.name?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div className="flex-1">
            <p className="font-semibold text-[15px] text-[var(--color-text-primary)]">{user?.name}</p>
            <p className="text-[12.5px] text-[var(--color-text-muted)]">{user?.email}</p>
            <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[var(--color-accent-subtle)] text-[var(--color-accent-text)] border border-[rgba(99,102,241,.2)] uppercase tracking-wider">
              {user?.role}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-[var(--color-text-muted)]">Theme</span>
            <ThemeToggle />
          </div>
        </div>
      </Card>

      <Section icon={Shield} title="Scanning & Detection">
        <SettingRow label="Real-time Scanning" desc="Monitor file system changes continuously as they happen" on={prefs.realtimeScan} onChange={() => toggle('realtimeScan')} />
        <SettingRow label="Deep AI Analysis" desc="Full behavioral + entropy analysis on every new file (uses more CPU)" on={prefs.deepScan} onChange={() => toggle('deepScan')} />
        <SettingRow label="Auto Quarantine" desc="Automatically isolate files with a threat score ≥ 70" on={prefs.autoQuarantine} onChange={() => toggle('autoQuarantine')} />
      </Section>

      <Section icon={Bell} title="Notifications">
        <SettingRow label="Critical Alerts"      desc="Immediate notification on critical-severity threats" on={prefs.notifyCritical} onChange={() => toggle('notifyCritical')} />
        <SettingRow label="High Severity Alerts"                                                            on={prefs.notifyHigh}     onChange={() => toggle('notifyHigh')} />
        <SettingRow label="Low Severity Alerts"                                                             on={prefs.notifyLow}      onChange={() => toggle('notifyLow')} />
        <SettingRow label="Email Digest"          desc="Send 6-hourly security summary to registered email" on={prefs.emailAlerts}    onChange={() => toggle('emailAlerts')} />
      </Section>

      <Section icon={HardDrive} title="Backup & Recovery">
        <SettingRow label="Auto Backup"     desc="Incremental backup every 15 minutes for changed files" on={prefs.backupAuto}    onChange={() => toggle('backupAuto')} />
        <SettingRow label="Encrypt Backups" desc="AES-256 encryption on all backup data at rest"         on={prefs.backupEncrypt} onChange={() => toggle('backupEncrypt')} />
      </Section>

      <Section icon={Brain} title="Mother AI">
        <SettingRow label="Blockchain Logging"   desc="Log all security events to the immutable audit ledger"               on={prefs.blockchainLog} onChange={() => toggle('blockchainLog')} />
        <SettingRow label="Federated Learning"   desc="Contribute anonymized threat patterns to improve the global AI model" on={prefs.aiLearning}    onChange={() => toggle('aiLearning')} />
      </Section>

      {/* Change password */}
      <Card padding="none">
        <div className="flex items-center gap-2.5 px-5 py-4 border-b border-[var(--color-border)]">
          <Key className="w-4 h-4 text-[var(--color-accent-text)]" />
          <h2 className="font-display font-semibold text-[14px] text-[var(--color-text-primary)]">Change Password</h2>
        </div>
        <form onSubmit={changePassword} className="px-5 py-4 space-y-3">
          {[
            { key: 'current', label: 'Current Password',     ph: '••••••••',        ac: 'current-password' },
            { key: 'next',    label: 'New Password',         ph: 'Min 8 characters', ac: 'new-password' },
            { key: 'confirm', label: 'Confirm New Password', ph: 'Must match above', ac: 'new-password' },
          ].map(({ key, label, ph, ac }) => (
            <div key={key}>
              <label className="block text-[11px] text-[var(--color-text-muted)] font-semibold uppercase tracking-widest mb-1.5">{label}</label>
              <input type="password" value={pw[key as keyof typeof pw]}
                onChange={e => setPw(p => ({ ...p, [key]: e.target.value }))}
                placeholder={ph} autoComplete={ac} className="input text-[13px]" />
            </div>
          ))}
          <button type="submit" disabled={pwLoading || !pw.current || !pw.next}
            className="btn btn-secondary btn-sm mt-1">
            {pwLoading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Updating…</> : <><Lock className="w-3.5 h-3.5" />Update Password</>}
          </button>
        </form>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <button onClick={savePrefs}
          className="btn btn-primary">
          {saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? 'Saved!' : 'Save Changes'}
        </button>
        <button onClick={() => {
          reset()
          toast.success('Reset to defaults')
        }} className="btn btn-secondary">Reset Defaults</button>
      </div>
    </div>
  )
}
