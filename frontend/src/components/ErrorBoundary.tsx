import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

/**
 * Top-level error boundary.
 * Without this, any render-time exception (bad API shape, third-party
 * chart crash, etc.) white-screens the entire app with no recovery —
 * a serious risk during a live demo. This catches it and offers a reload.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Beyonder crashed:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] p-6">
          <div className="card p-8 max-w-md w-full text-center">
            <div className="w-12 h-12 rounded-2xl bg-critical-bg border border-critical-border flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-critical" />
            </div>
            <h1 className="font-display font-bold text-lg text-[var(--color-text-primary)] mb-1.5">
              Something went wrong
            </h1>
            <p className="text-[13px] text-[var(--color-text-muted)] mb-5">
              {this.state.error?.message || 'An unexpected error occurred while rendering this page.'}
            </p>
            <button onClick={() => window.location.reload()} className="btn btn-primary mx-auto">
              <RefreshCw className="w-4 h-4" />
              Reload Beyonder
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
