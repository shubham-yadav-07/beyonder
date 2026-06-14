import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Shield, HardDrive, Link2, Brain,
  FolderOpen, Settings, LogOut, Bell, ChevronRight,
  Activity, Menu, X, BarChart3
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useUnreadCount } from '@/hooks/useApi'
import { ThemeToggle } from './ThemeToggle'
import { cn } from '@/utils/cn'

const NAV = [
  { to: '/',            icon: LayoutDashboard, label: 'Overview',         exact: true },
  { to: '/threats',     icon: Shield,          label: 'Threat Center' },
  { to: '/monitor',     icon: FolderOpen,      label: 'Folder Monitor' },
  { to: '/backup',      icon: HardDrive,       label: 'Backup & Recovery' },
  { to: '/blockchain',  icon: Link2,           label: 'Blockchain Logs' },
  { to: '/mother-ai',   icon: Brain,           label: 'Mother AI' },
  { to: '/analytics',   icon: BarChart3,       label: 'Analytics' },
  { to: '/settings',    icon: Settings,        label: 'Settings' },
]

function SidebarContent({ onNavClick }: { onNavClick?: () => void }) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[var(--color-accent)] flex items-center justify-center shadow-[0_0_16px_rgba(99,102,241,.45)] shrink-0">
            <Shield className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <div className="leading-tight">
            <p className="font-display font-bold text-[15px] text-[var(--color-text-primary)] tracking-tight">Beyonder</p>
            <p className="text-[9px] text-[var(--color-text-muted)] font-mono uppercase tracking-[2.5px]">Cyber Guard</p>
          </div>
        </div>
      </div>

      {/* Live status */}
      <div className="px-4 pt-3 pb-1">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-safe-bg border border-safe-border">
          <span className="w-1.5 h-1.5 rounded-full bg-safe animate-pulse-dot" />
          <span className="text-[10px] font-mono font-bold text-safe tracking-wide uppercase">Protected</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-px overflow-y-auto scroll-area">
        {NAV.map(({ to, icon: Icon, label, exact }) => (
          <NavLink key={to} to={to} end={exact} onClick={onNavClick}>
            {({ isActive }) => (
              <span className={cn(
                'flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-medium',
                'transition-all duration-150 cursor-pointer select-none group',
                isActive
                  ? 'bg-[var(--color-accent-subtle)] text-[var(--color-accent-text)] border border-[rgba(99,102,241,.18)]'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-elevated)]'
              )}>
                <Icon className={cn('w-[15px] h-[15px] shrink-0',
                  isActive
                    ? 'text-[var(--color-accent-text)]'
                    : 'text-[var(--color-text-muted)] group-hover:text-[var(--color-text-secondary)]'
                )} strokeWidth={isActive ? 2.5 : 2} />
                <span className="flex-1 truncate">{label}</span>
                {isActive && <ChevronRight className="w-3 h-3 opacity-50 shrink-0" />}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="border-t border-[var(--color-border)] p-4 space-y-2.5">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[var(--color-accent)] to-purple-600 flex items-center justify-center text-[11px] font-bold text-white shrink-0">
            {user?.name?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-[var(--color-text-primary)] truncate">{user?.name}</p>
            <p className="text-[10px] text-[var(--color-text-muted)] font-mono capitalize">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={() => { logout(); navigate('/login') }}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[11.5px] text-[var(--color-text-muted)] hover:text-[#e8405a] hover:bg-[rgba(232,64,90,.08)] transition-all"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign out
        </button>
      </div>
    </div>
  )
}

export default function AppShell() {
  const { data: unread = 0 } = useUnreadCount()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-bg)]">

      {/* ── Desktop Sidebar ── */}
      <motion.aside
        initial={{ x: -240 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="hidden md:flex w-[220px] flex-col shrink-0 border-r border-[var(--color-border)] bg-[var(--color-surface)]"
      >
        <SidebarContent />
      </motion.aside>

      {/* ── Mobile Sidebar ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="sidebar-overlay md:hidden"
            />
            <motion.aside
              initial={{ x: -240 }} animate={{ x: 0 }} exit={{ x: -240 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="fixed left-0 top-0 bottom-0 w-[220px] z-50 border-r border-[var(--color-border)] bg-[var(--color-surface)] md:hidden"
            >
              <SidebarContent onNavClick={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Topbar */}
        <header className="h-[52px] flex items-center justify-between px-4 md:px-6 border-b border-[var(--color-border)] bg-[var(--color-surface)] shrink-0">
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <button onClick={() => setMobileOpen(true)}
              className="btn btn-ghost btn-sm btn-icon md:hidden">
              <Menu className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
              <span className="text-[11px] text-[var(--color-text-muted)] font-mono hidden sm:block">
                Live · {new Date().toLocaleTimeString()}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <div className="w-px h-4 bg-[var(--color-border)]" />
            <button className="btn btn-ghost btn-sm btn-icon relative">
              <Bell className="w-[15px] h-[15px]" />
              {(unread as number) > 0 && (
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
                  className="absolute top-1.5 right-1.5 w-[7px] h-[7px] rounded-full bg-[#e8405a] border border-[var(--color-surface)]" />
              )}
            </button>
            <div className="w-px h-4 bg-[var(--color-border)]" />
            <span className="text-[11px] font-mono text-[var(--color-text-muted)] hidden sm:block">v1.1</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-[var(--color-bg)] bg-grid scroll-area">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="p-4 md:p-6 max-w-[1440px] mx-auto w-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
