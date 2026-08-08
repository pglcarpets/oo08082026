import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  House as Home,
  Stack as Layers,
  GitBranch,
  PuzzlePiece as Puzzle,
  FolderOpen,
  Database,
  Globe,
  TestTube,
  Rocket,
  Shield,
  Lightning as Zap,
  GitCommit,
  Monitor,
  Cube as Box,
  Wrench,
  CaretDown as ChevronDown,
  List as Menu,
  X,
  MagnifyingGlass as Search,
  SignOut,
  type Icon,
} from "@phosphor-icons/react";
import clsx from 'clsx'
import { signOutDocsSession, useSession } from '../auth/AuthProvider'
import { navItems } from '../data/navigation'
import type { NavItem } from '../types'

const iconMap: Record<string, Icon> = {
  Home, Layers, GitBranch, Puzzle, FolderOpen, Database,
  Globe, TestTube, Rocket, Shield, Zap, GitCommit,
  Monitor, Box, Wrench,
}

function NavIcon({ name, size = 16 }: { name: string; size?: number }) {
  const Icon = iconMap[name]
  return Icon ? <Icon size={size} /> : null
}

const DEPTH_PADDING = ['pl-3', 'pl-6', 'pl-9'] as const
function depthPl(depth: number) {
  return DEPTH_PADDING[Math.min(depth, DEPTH_PADDING.length - 1)]
}

function NavItemComponent({ item, depth = 0 }: { item: NavItem; depth?: number }) {
  const location = useLocation()
  const [open, setOpen] = useState(() => {
    if (!item.children) return false
    return item.children.some(c => location.pathname === c.path.split('#')[0])
  })

  const isActive = location.pathname === item.path.split('#')[0]

  if (item.children) {
    return (
      <div>
        <button
          onClick={() => setOpen(!open)}
          className={clsx(
            'w-full flex items-center justify-between py-2 rounded-lg text-sm transition-colors group',
            depthPl(depth),
            isActive
              ? 'bg-brand-500/12 text-brand-800 font-medium'
              : 'text-docs-text-muted hover:text-docs-text-strong hover:bg-docs-surface-strong/60'
          )}
        >
          <div className="flex items-center gap-2.5">
            <NavIcon name={item.icon} size={15} />
            <span className="font-medium">{item.label}</span>
          </div>
          <ChevronDown
            size={13}
            className={clsx('transition-transform duration-200', open && 'rotate-180')}
          />
        </button>
        {open && (
          <div className="mt-0.5 ml-3 border-l border-docs-border pl-3 space-y-0.5">
            {item.children.map(child => (
              <NavItemComponent key={child.id} item={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <NavLink
      to={item.path}
      className={({ isActive: linkActive }) => clsx(
        'flex items-center gap-2.5 py-1.5 rounded-lg text-sm transition-colors',
        depthPl(depth),
        depth === 0 && 'font-medium',
        linkActive || (isActive && depth === 0)
          ? 'bg-brand-500/12 text-brand-800 font-medium'
          : 'text-docs-text-muted hover:text-docs-text-strong hover:bg-docs-surface-strong/60'
      )}
    >
      {depth === 0 && <NavIcon name={item.icon} size={15} />}
      {depth > 0 && <span className="w-1 h-1 rounded-full bg-current opacity-60 flex-shrink-0" />}
      {item.label}
    </NavLink>
  )
}

export function Sidebar() {
  const session = useSession()
  const [mobileOpen, setMobileOpen] = useState(false)

  const content = (
    <div className="flex flex-col h-full">
      {/* Brand — real One&Only assets (public/logo-v2.webp + icon.png) */}
      <div className="px-4 py-5 border-b border-docs-border">
        <a href="/" className="flex items-center gap-2.5 min-w-0 no-underline text-inherit">
          <img
            src="/icon.png"
            alt=""
            width={32}
            height={32}
            className="w-8 h-8 rounded-lg object-contain shrink-0"
          />
          <div className="min-w-0">
            <img
              src="/logo-v2.webp"
              alt="One&Only Furniture"
              width={160}
              height={41}
              className="h-6 w-auto max-w-[9.5rem] object-contain object-left"
            />
            <div className="text-xs text-docs-text-muted mt-0.5">Tech Stack Docs</div>
          </div>
        </a>
      </div>

      {/* Search */}
      <div className="px-4 py-3 border-b border-docs-border">
        <button
          onClick={() => document.dispatchEvent(new CustomEvent('open-command-palette'))}
          className="w-full flex items-center justify-between bg-docs-surface-raised hover:bg-docs-surface-strong border border-docs-border hover:border-docs-border-hover rounded-xl px-3 py-2 text-sm text-docs-text-muted transition-all group"
        >
          <span className="flex items-center gap-2">
            <Search size={15} className="group-hover:text-docs-text transition-colors" />
            <span className="group-hover:text-docs-text transition-colors">Search docs...</span>
          </span>
          <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 bg-docs-surface-strong border border-docs-border rounded text-[0.625rem] text-docs-text-subtle font-sans group-hover:text-docs-text-muted group-hover:border-docs-border-hover transition-colors">
            <span className="text-xs">⌘</span> K
          </kbd>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        {navItems.map(item => (
          <NavItemComponent key={item.id} item={item} />
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-docs-border space-y-2">
        {session.status === 'authenticated' ? (
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-xs text-docs-text-subtle" title={session.user.email}>
              {session.user.email}
            </p>
            <button
              type="button"
              onClick={() => {
                void signOutDocsSession()
              }}
              className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs text-docs-text-muted hover:bg-docs-surface-strong/60 hover:text-docs-text-strong"
              aria-label="Sign out"
            >
              <SignOut size={14} />
              Sign out
            </button>
          </div>
        ) : null}
        <p className="text-xs text-docs-text-subtle">
          One&Only · Tech Stack Docs
        </p>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-3.5 left-3.5 z-50 rounded-xl border border-docs-border bg-docs-surface-raised/95 p-2.5 text-docs-text-strong shadow-sm backdrop-blur-sm"
        aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation'}
      >
        {mobileOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          role="button"
          tabIndex={0}
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              setMobileOpen(false)
            }
          }}
        />
      )}

      {/* Mobile sidebar */}
      <aside className={clsx(
        'lg:hidden fixed top-0 left-0 z-[45] h-full w-64 bg-docs-surface border-r border-docs-border transform transition-transform duration-200',
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        {content}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-docs-surface border-r border-docs-border flex-shrink-0 sticky top-0 h-screen overflow-hidden">
        {content}
      </aside>
    </>
  )
}
