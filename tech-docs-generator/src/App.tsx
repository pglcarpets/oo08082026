import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Sidebar } from './components/Sidebar'
import { Breadcrumbs } from './components/Breadcrumbs'
import { CommandPalette } from './components/CommandPalette'
import { ReadingProgress } from './components/ReadingProgress'
import { BackToTop } from './components/BackToTop'
import { Overview } from './pages/Overview'
import { TechStack } from './pages/TechStack'
import { Architecture } from './pages/Architecture'
import { Features } from './pages/Features'
import { CodeOrganization } from './pages/CodeOrganization'
import { Database } from './pages/Database'
import { ApiDesign } from './pages/ApiDesign'
import { Testing } from './pages/Testing'
import { Deployment } from './pages/Deployment'
import { Security } from './pages/Security'
import { Performance } from './pages/Performance'
import { Workflows } from './pages/Workflows'

function AppInner() {
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false)
  const location = useLocation()

  // Listen for the custom event from the Sidebar or CommandPalette to open it
  useEffect(() => {
    const handleOpen = () => setIsCommandPaletteOpen(true)
    document.addEventListener('open-command-palette', handleOpen)
    return () => document.removeEventListener('open-command-palette', handleOpen)
  }, [])

  return (
    <div className="flex min-h-screen relative bg-docs-surface text-docs-text">
      <ReadingProgress />
      <BackToTop />
      <Sidebar />

      <CommandPalette 
        isOpen={isCommandPaletteOpen} 
        onClose={() => setIsCommandPaletteOpen(false)} 
      />

      <main className="flex-1 min-w-0 pt-14 lg:pt-0 bg-docs-surface">
        <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <Breadcrumbs />
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <Routes location={location}>
                <Route path="/" element={<Overview />} />
          <Route path="/tech-stack" element={<TechStack />} />
          <Route path="/architecture" element={<Architecture />} />
          <Route path="/features" element={<Features />} />
          <Route path="/code-organization" element={<CodeOrganization />} />
          <Route path="/database" element={<Database />} />
          <Route path="/api" element={<ApiDesign />} />
          <Route path="/testing" element={<Testing />} />
          <Route path="/deployment" element={<Deployment />} />
          <Route path="/security" element={<Security />} />
            <Route path="/performance" element={<Performance />} />
            <Route path="/workflows" element={<Workflows />} />
          </Routes>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  )
}
