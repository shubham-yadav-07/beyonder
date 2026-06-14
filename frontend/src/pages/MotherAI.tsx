import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, Send, Zap, TrendingUp, Loader2, RefreshCw, Copy, Check } from 'lucide-react'
import { aiApi } from '@/services/api'
import { Card } from '@/components/ui/Card'
import { cn } from '@/utils/cn'
import { format } from 'date-fns'
import ReactMarkdown from 'react-markdown'
import toast from 'react-hot-toast'

interface Message { id: string; role: 'user'|'ai'; content: string; intent?: string; confidence?: number; ts: string }

const INIT: Message = {
  id: '0', role: 'ai',
  content: "Hello! I'm **Mother AI** — Beyonder's central intelligence core running on v3.1.7.\n\nI've analyzed **2.3 million threat signatures** and I'm continuously learning from your system's activity through pattern recognition and historical analysis.\n\nI can help you:\n- **Analyze** any file path for threats\n- **Show patterns** — recurring threat types & directories\n- **Find similar** threats using feature-based matching\n- **Predict** tomorrow's risk trend\n- **Recommend** system hardening steps\n\nHow can I protect you today?",
  ts: new Date().toISOString()
}

const QUICK_PROMPTS = [
  { label: 'System Status', prompt: 'What is my current system status?' },
  { label: 'Show Patterns', prompt: 'Show recurring threat patterns' },
  { label: 'Find Similar', prompt: 'Find threats similar to my latest detection' },
  { label: 'Predict Risk', prompt: 'Predict tomorrow\'s risk trend' },
  { label: 'Harden System', prompt: 'How can I harden my system?' },
  { label: 'Ransomware Defense', prompt: 'What is ransomware and how does Beyonder stop it?' },
  { label: 'Analyze File', prompt: 'Analyze C:/Users/Admin/Downloads/crack.exe' },
]

function MessageBubble({ msg, onCopy }: { msg: Message; onCopy: (c: string) => void }) {
  const isAI = msg.role === 'ai'
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className={cn('flex gap-3', !isAI && 'flex-row-reverse')}>
      <div className={cn('w-7 h-7 rounded-lg shrink-0 flex items-center justify-center border',
        isAI
          ? 'bg-[var(--color-accent-subtle)] border-[rgba(99,102,241,.2)]'
          : 'bg-[var(--color-elevated)] border-[var(--color-border)]')}>
        {isAI
          ? <Brain className="w-3.5 h-3.5 text-[var(--color-accent-text)]" />
          : <span className="text-[10px] font-bold text-[var(--color-text-muted)]">YOU</span>}
      </div>

      <div className={cn('max-w-[80%] group relative')}>
        <div className={cn(
          'rounded-xl px-4 py-3 text-[13px] leading-relaxed',
          isAI
            ? 'bg-[var(--color-elevated)] border border-[var(--color-border)] text-[var(--color-text-primary)]'
            : 'bg-[var(--color-accent)] text-white'
        )}>
          {isAI ? (
            <div className="prose prose-sm max-w-none prose-p:text-[var(--color-text-primary)] prose-strong:text-[var(--color-text-primary)] prose-li:text-[var(--color-text-secondary)] prose-code:text-[var(--color-accent-text)] prose-code:bg-[var(--color-overlay)] prose-code:px-1 prose-code:rounded">
              <ReactMarkdown>{msg.content}</ReactMarkdown>
            </div>
          ) : (
            <p>{msg.content}</p>
          )}

          {/* Copy button */}
          <button onClick={() => onCopy(msg.content)}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded bg-[var(--color-overlay)] hover:bg-[var(--color-border)] text-[var(--color-text-muted)]">
            <Copy className="w-3 h-3" />
          </button>
        </div>

        <div className={cn('flex items-center gap-2 mt-1 px-1', !isAI && 'flex-row-reverse')}>
          <span className="text-[10px] text-[var(--color-text-muted)]">{format(new Date(msg.ts), 'HH:mm')}</span>
          {msg.intent && <span className="text-[10px] font-mono text-[var(--color-accent-text)] opacity-60">[{msg.intent}]</span>}
          {msg.confidence && <span className="text-[10px] text-[var(--color-text-muted)] opacity-50">{(msg.confidence*100).toFixed(0)}%</span>}
        </div>
      </div>
    </motion.div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="w-7 h-7 rounded-lg bg-[var(--color-accent-subtle)] border border-[rgba(99,102,241,.2)] flex items-center justify-center">
        <Brain className="w-3.5 h-3.5 text-[var(--color-accent-text)]" />
      </div>
      <div className="bg-[var(--color-elevated)] border border-[var(--color-border)] rounded-xl px-4 py-3">
        <div className="flex gap-1.5 items-center h-4">
          {[0,1,2].map(i => (
            <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)]"
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.15 }} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function MotherAI() {
  const [messages, setMessages] = useState<Message[]>([INIT])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [stats, setStats]       = useState<any>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLInputElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, loading])
  useEffect(() => { aiApi.stats().then(r => setStats(r.data)).catch(() => {}) }, [])

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content)
    toast.success('Copied to clipboard')
  }

  const send = async (text?: string) => {
    const content = (text || input).trim()
    if (!content || loading) return
    setInput('')
    setMessages(m => [...m, { id: Date.now().toString(), role: 'user', content, ts: new Date().toISOString() }])
    setLoading(true)
    const history = messages.slice(-8).map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.content }))
    try {
      const { data } = await aiApi.chat(content, history)
      setMessages(m => [...m, {
        id: (Date.now()+1).toString(), role: 'ai',
        content: data.reply, intent: data.intent, confidence: data.confidence, ts: data.timestamp
      }])
    } catch (err: any) {
      setMessages(m => [...m, {
        id: (Date.now()+1).toString(), role: 'ai',
        content: err?.response?.status === 401
          ? 'Session expired. Please log in again.'
          : 'Unable to connect to the AI engine. Please ensure the backend is running.',
        ts: new Date().toISOString()
      }])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-[22px] text-[var(--color-text-primary)] tracking-tight">Mother AI</h1>
          <p className="text-[13px] text-[var(--color-text-muted)] mt-0.5">Intent-aware cybersecurity intelligence assistant</p>
        </div>
        <div className="flex items-center gap-2">
          {stats && (
            <div className="hidden md:flex items-center gap-2">
              {[
                { label: 'Model', val: `v${stats.model_version}`, color: 'text-[var(--color-accent-text)]' },
                { label: 'Accuracy', val: `${stats.accuracy}%`, color: 'text-safe' },
                { label: 'Chats', val: stats.conversations, color: 'text-[var(--color-text-muted)]' },
              ].map(({ label, val, color }) => (
                <div key={label} className="px-3 py-1.5 rounded-lg bg-[var(--color-elevated)] border border-[var(--color-border)] text-[11px]">
                  <span className="text-[var(--color-text-muted)]">{label}: </span>
                  <span className={cn('font-mono font-semibold', color)}>{val}</span>
                </div>
              ))}
            </div>
          )}
          <button onClick={() => setMessages([INIT])}
            className="btn btn-ghost btn-sm">
            <RefreshCw className="w-3.5 h-3.5" />
            Clear
          </button>
        </div>
      </div>

      {/* AI Status bar */}
      <Card padding="sm">
        <div className="flex items-center gap-4">
          <motion.div
            animate={{ boxShadow: ['0 0 8px rgba(99,102,241,.3)','0 0 24px rgba(99,102,241,.6)','0 0 8px rgba(99,102,241,.3)'] }}
            transition={{ duration: 2.5, repeat: Infinity }}
            className="w-10 h-10 rounded-full bg-[var(--color-accent-subtle)] border border-[rgba(99,102,241,.25)] flex items-center justify-center shrink-0"
          >
            <Brain className="w-5 h-5 text-[var(--color-accent-text)]" />
          </motion.div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-semibold text-[var(--color-text-primary)]">Mother AI is active</span>
              <span className="w-1.5 h-1.5 rounded-full bg-safe animate-pulse-dot" />
            </div>
            <p className="text-[11px] text-[var(--color-text-muted)] truncate">
              {stats
                ? `${(stats.signatures_analyzed/1e6).toFixed(1)}M signatures · ${stats.conversations} conversations · Model v${stats.model_version}`
                : 'Connecting to AI engine…'}
            </p>
          </div>
          {/* Live waveform */}
          <div className="flex gap-0.5 items-end h-5 shrink-0">
            {[4,7,3,9,5,8,4,6,3,7].map((h, i) => (
              <motion.div key={i}
                className="w-[3px] rounded-sm bg-[var(--color-accent)]"
                animate={{ height: [`${h*2}px`, `${h*3.5}px`, `${h*2}px`] }}
                transition={{ duration: 1.2+i*0.1, repeat: Infinity, delay: i*0.1, ease: 'easeInOut' }}
              />
            ))}
          </div>
        </div>
      </Card>

      {/* Chat window */}
      <Card padding="none" className="flex flex-col overflow-hidden" style={{ height: '60vh', minHeight: 400 }}>
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map(msg => <MessageBubble key={msg.id} msg={msg} onCopy={handleCopy} />)}
          {loading && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>

        {/* Quick prompts */}
        <div className="px-4 py-2.5 border-t border-[var(--color-border)] flex flex-wrap gap-1.5">
          {QUICK_PROMPTS.map(({ label, prompt }) => (
            <button key={label} onClick={() => send(prompt)} disabled={loading}
              className="btn btn-xs btn-ghost border border-[var(--color-border)] disabled:opacity-40">
              {label}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-[var(--color-border)]">
          <div className="flex gap-2.5 items-center bg-[var(--color-elevated)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 focus-within:border-[var(--color-accent)] focus-within:ring-1 focus-within:ring-[rgba(99,102,241,.15)] transition-all">
            <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
              placeholder="Ask anything — or type a file path to analyze it…"
              className="flex-1 bg-transparent text-[13.5px] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] outline-none" />
            <button onClick={() => send()} disabled={loading || !input.trim()}
              className="btn btn-primary btn-sm btn-icon disabled:opacity-40 shrink-0">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[10px] text-[var(--color-text-muted)] mt-2 text-center">
            AI responses are for security guidance only. Always verify critical decisions.
          </p>
        </div>
      </Card>
    </div>
  )
}
