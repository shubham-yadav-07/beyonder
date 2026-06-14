import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Eye, EyeOff, Lock, Mail, AlertTriangle, Loader2, Check } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { authApi } from '@/services/api'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { cn } from '@/utils/cn'

const FEATURES = [
  'AI-powered malware detection with 99.2% accuracy',
  'Real-time folder monitoring & auto-quarantine',
  'Blockchain-verified immutable audit trail',
  'Mother AI self-learning threat intelligence',
]

export default function Login() {
  const [email, setEmail]       = useState('admin@beyonder.io')
  const [password, setPassword] = useState('demo1234')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const { login } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return
    setLoading(true); setError('')
    try {
      const { data } = await authApi.login(email, password)
      login(data.user, data.access_token, data.refresh_token)
      navigate('/')
    } catch (err: any) {
      const status = err?.response?.status
      setError(
        !err?.response ? 'Cannot reach the server. Is the backend running on port 8000?' :
        status === 423 ? 'Account locked — too many attempts. Try again in 15 minutes.' :
        status === 429 ? 'Too many requests. Please wait a moment.' :
        err?.response?.data?.detail || 'Invalid credentials.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex overflow-hidden">

      {/* ── Left panel — brand ── */}
      <div className="hidden lg:flex flex-col w-[520px] shrink-0 relative overflow-hidden bg-[var(--color-surface)] border-r border-[var(--color-border)]">
        {/* Background grid */}
        <div className="absolute inset-0 bg-grid opacity-60" />
        {/* Radial glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[var(--color-accent)] opacity-[0.06] rounded-full blur-[80px] pointer-events-none" />

        <div className="relative z-10 flex flex-col h-full p-10">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-auto">
            <div className="w-9 h-9 rounded-xl bg-[var(--color-accent)] flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,.5)]">
              <Shield className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-display font-bold text-[18px] text-[var(--color-text-primary)]">Beyonder</span>
          </div>

          {/* Headline */}
          <div className="py-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <p className="text-xs font-mono text-[var(--color-accent-text)] uppercase tracking-[3px] mb-3">Smart India Hackathon 2025</p>
              <h1 className="font-display font-bold text-[38px] text-[var(--color-text-primary)] leading-[1.1] tracking-tight mb-4">
                Enterprise<br />Cyber Defense<br />
                <span className="text-gradient-brand">Reimagined</span>
              </h1>
              <p className="text-[var(--color-text-muted)] text-[14px] leading-relaxed max-w-[340px]">
                AI-native cybersecurity platform protecting your infrastructure with real-time threat intelligence and autonomous response.
              </p>
            </motion.div>

            {/* Feature list */}
            <motion.ul
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.1, delayChildren: 0.4 } } }}
              className="mt-8 space-y-3"
            >
              {FEATURES.map((f) => (
                <motion.li
                  key={f}
                  variants={{ hidden: { opacity: 0, x: -12 }, visible: { opacity: 1, x: 0 } }}
                  className="flex items-start gap-3 text-[13px] text-[var(--color-text-secondary)]"
                >
                  <span className="w-5 h-5 rounded-full bg-safe-bg border border-safe-border flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-2.5 h-2.5 text-safe" strokeWidth={3} />
                  </span>
                  {f}
                </motion.li>
              ))}
            </motion.ul>
          </div>

          {/* Footer */}
          <div className="mt-auto">
            <p className="text-[11px] text-[var(--color-text-muted)] font-mono">
              Team Techvision · Problem ID SIH25127
            </p>
          </div>
        </div>
      </div>

      {/* ── Right panel — form ── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
        {/* Theme toggle */}
        <div className="absolute top-5 right-5">
          <ThemeToggle />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="w-full max-w-[400px]"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-[var(--color-accent)] flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-display font-bold text-[18px]">Beyonder</span>
          </div>

          <h2 className="font-display font-bold text-[24px] text-[var(--color-text-primary)] mb-1">Welcome back</h2>
          <p className="text-[13.5px] text-[var(--color-text-muted)] mb-8">Sign in to your security dashboard</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-[11px] text-[var(--color-text-muted)] font-semibold uppercase tracking-widest">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  required autoComplete="email"
                  className="input pl-10 py-3"
                  placeholder="you@company.io"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-[11px] text-[var(--color-text-muted)] font-semibold uppercase tracking-widest">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                <input
                  type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  required autoComplete="current-password"
                  className="input pl-10 pr-10 py-3"
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPass(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-start gap-2.5 p-3 rounded-lg bg-critical-bg border border-critical-border text-critical text-[12px]"
                >
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <button
              type="submit" disabled={loading || !email || !password}
              className={cn(
                'btn btn-primary btn-lg w-full mt-2',
                'relative overflow-hidden',
                loading && 'cursor-not-allowed'
              )}
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" />Authenticating...</>
                : <>Sign in to Dashboard</>
              }
            </button>
          </form>

          {/* Demo hint */}
          <div className="mt-5 p-3.5 rounded-xl bg-[var(--color-elevated)] border border-[var(--color-border)]">
            <p className="text-[11px] text-[var(--color-text-muted)] text-center">
              Demo credentials pre-filled ·{' '}
              <span className="font-mono text-[var(--color-accent-text)]">admin@beyonder.io</span>
              {' / '}
              <span className="font-mono text-[var(--color-accent-text)]">demo1234</span>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
