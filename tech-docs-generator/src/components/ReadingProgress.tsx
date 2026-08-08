import { useState, useEffect } from 'react'

export function ReadingProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      // Calculate scroll progress percentage
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight
      const scrollTop = window.scrollY || document.documentElement.scrollTop
      
      const scrollableHeight = documentHeight - windowHeight
      
      if (scrollableHeight <= 0) {
        setProgress(0)
      } else {
        const scrolled = (scrollTop / scrollableHeight) * 100
        setProgress(Math.min(100, Math.max(0, scrolled)))
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll, { passive: true })
    
    // Initial calculation
    handleScroll()
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [])

  return (
    <div className="fixed top-0 left-0 right-0 h-1 z-[100] bg-docs-surface-raised overflow-hidden lg:pl-64">
      <div 
        className="h-full bg-gradient-to-r from-brand-500 to-accent-400 transition-all duration-150 ease-out"
        style={{ width: `${progress}%`, opacity: progress > 1 ? 1 : 0 }}
      />
    </div>
  )
}
