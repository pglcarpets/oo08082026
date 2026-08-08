import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface TooltipProps {
  children: React.ReactNode
  content: string
}

export function Tooltip({ children, content }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)

  return (
    <span 
      className="relative inline-block cursor-help group"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      <span className="border-b border-dashed border-docs-border-hover hover:border-brand-400 hover:text-brand-300 transition-colors">
        {children}
      </span>
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs px-3 py-2 bg-docs-surface-raised border border-docs-border text-xs text-docs-text rounded-lg shadow-xl pointer-events-none"
          >
            {content}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[0.0625rem] border-[0.3125rem] border-transparent border-t-docs-border" />
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[0.125rem] border-[5px] border-transparent border-t-docs-surface-raised" />
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  )
}
