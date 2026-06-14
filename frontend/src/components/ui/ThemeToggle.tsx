import { Moon, Sun } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useThemeStore } from '@/store/themeStore'
import { cn } from '@/utils/cn'

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useThemeStore()

  return (
    <motion.button
      onClick={toggle}
      whileTap={{ scale: 0.9 }}
      aria-label="Toggle theme"
      className={cn(
        'btn-icon btn-ghost relative overflow-hidden',
        'w-9 h-9 flex items-center justify-center',
        className
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        {theme === 'dark' ? (
          <motion.div key="sun"
            initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.2 }}
          >
            <Sun className="w-4 h-4 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]" />
          </motion.div>
        ) : (
          <motion.div key="moon"
            initial={{ rotate: 90, opacity: 0, scale: 0.6 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: -90, opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.2 }}
          >
            <Moon className="w-4 h-4 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  )
}
