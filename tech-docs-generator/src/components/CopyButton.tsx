import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Copy, Check } from "@phosphor-icons/react"
import clsx from 'clsx'

interface CopyButtonProps {
  content: string
  className?: string
  iconSize?: number
}

export function CopyButton({ content, className, iconSize = 14 }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  return (
    <button
      onClick={handleCopy}
      className={clsx(
        "relative flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/50 rounded-md p-1.5",
        copied ? "bg-emerald-500/10 text-emerald-400" : "bg-docs-surface-strong/50 text-docs-text-muted hover:text-docs-text hover:bg-docs-surface-strong/70",
        className
      )}
      aria-label="Copy to clipboard"
      title="Copy"
    >
      <AnimatePresence mode="wait" initial={false}>
        {copied ? (
          <motion.div
            key="check"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <Check size={iconSize} />
          </motion.div>
        ) : (
          <motion.div
            key="copy"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <Copy size={iconSize} />
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  )
}
