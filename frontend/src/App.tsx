import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { AnimatePresence } from 'framer-motion'
import { useEffect, lazy, Suspense } from 'react'
import { useThemeStore } from '@/store/themeStore'
import { useAuthStore } from '@/store/authStore'
import AppShell from '@/components/ui/AppShell'
import { ErrorBoundary } from '@/components/ErrorBoundary'

// Lazy-loaded pages for better bundle splitting
const Dashboard      = lazy(() => import('@/pages/Dashboard'))
const Login          = lazy(() => import('@/pages/Login'))
const ThreatCenter   = lazy(() => import('@/pages/ThreatCenter'))
const BackupRecovery = lazy(() => import('@/pages/BackupRecovery'))
const BlockchainLogs = lazy(() => import('@/pages/BlockchainLogs'))
const MotherAI       = lazy(() => import('@/pages/MotherAI'))
const FolderMonitor  = lazy(() => import('@/pages/FolderMonitor'))
const Settings       = lazy(() => import('@/pages/Settings'))
const Analytics      = lazy(() => import('@/pages/Analytics'))

const qc = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
})

// Page loader fallback
function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full min-h-[200px]">
      <div className="flex gap-1.5">
        {[0, 1, 2].map(i => (
          <div key={i} className="w-2 h-2 rounded-full bg-[var(--color-accent)] opacity-60"
            style={{ animation: `bounce 0.8s ease-in-out ${i * 0.15}s infinite alternate` }} />
        ))}
      </div>
    </div>
  )
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <Suspense fallback={<PageLoader />}>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
            <Route index               element={<Dashboard />} />
            <Route path="threats"      element={<ThreatCenter />} />
            <Route path="backup"       element={<BackupRecovery />} />
            <Route path="blockchain"   element={<BlockchainLogs />} />
            <Route path="mother-ai"    element={<MotherAI />} />
            <Route path="monitor"      element={<FolderMonitor />} />
            <Route path="analytics"    element={<Analytics />} />
            <Route path="settings"     element={<Settings />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </Suspense>
  )
}

function ThemeApplier() {
  const theme = useThemeStore(s => s.theme)
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])
  return null
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={qc}>
        <ThemeApplier />
        <BrowserRouter>
          <AnimatedRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: 'var(--color-elevated)',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-border-strong)',
                fontFamily: 'Figtree, sans-serif',
                fontSize: '13px',
                boxShadow: '0 8px 24px rgba(0,0,0,.3)',
                borderRadius: '10px',
                padding: '10px 16px',
              },
              success: { iconTheme: { primary: '#22c982', secondary: 'transparent' } },
              error:   { iconTheme: { primary: '#e8405a', secondary: 'transparent' } },
            }}
          />
        </BrowserRouter>
        {/* Bounce animation for PageLoader */}
        <style>{`@keyframes bounce{from{transform:translateY(0)}to{transform:translateY(-6px)}}`}</style>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
