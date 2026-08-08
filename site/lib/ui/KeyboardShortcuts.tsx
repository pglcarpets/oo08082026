"use client";

/**
 * KeyboardShortcuts — Modal overlay triggered by '?' key.
 * Categorized shortcuts with search filter.
 */

import { useState, useEffect, useMemo } from "react";
import { X, MagnifyingGlass as Search, Keyboard } from "@phosphor-icons/react";
import { Z } from "@/lib/z-index";

interface Shortcut {
  keys: string;
  label: string;
  category: string;
}

const SHORTCUTS: Shortcut[] = [
  // Navigation
  { keys: "Space + Drag", label: "Pan canvas", category: "Navigation" },
  { keys: "Ctrl + =", label: "Zoom in", category: "Navigation" },
  { keys: "Ctrl + -", label: "Zoom out", category: "Navigation" },
  { keys: "Ctrl + 0", label: "Zoom to fit", category: "Navigation" },
  { keys: "Ctrl + 1", label: "Zoom to 100%", category: "Navigation" },
  // Drawing
  { keys: "W", label: "Wall tool", category: "Drawing" },
  { keys: "D", label: "Door tool", category: "Drawing" },
  { keys: "N", label: "Window tool", category: "Drawing" },
  { keys: "M", label: "Measurement tool", category: "Drawing" },
  { keys: "Z", label: "Zone tool", category: "Drawing" },
  { keys: "F", label: "Furniture tool", category: "Drawing" },
  // Selection
  { keys: "V", label: "Select tool", category: "Selection" },
  { keys: "Ctrl + A", label: "Select all", category: "Selection" },
  { keys: "Escape", label: "Deselect all", category: "Selection" },
  { keys: "Delete", label: "Delete selected", category: "Selection" },
  { keys: "Ctrl + G", label: "Group selected", category: "Selection" },
  { keys: "Ctrl + Shift + G", label: "Ungroup", category: "Selection" },
  // Edit
  { keys: "Ctrl + Z", label: "Undo", category: "Edit" },
  { keys: "Ctrl + Shift + Z", label: "Redo", category: "Edit" },
  { keys: "Ctrl + C", label: "Copy", category: "Edit" },
  { keys: "Ctrl + V", label: "Paste", category: "Edit" },
  { keys: "Ctrl + D", label: "Duplicate", category: "Edit" },
  { keys: "S", label: "Magic Swap", category: "Edit" },
  // Canvas
  { keys: "G", label: "Toggle grid", category: "Canvas" },
  { keys: "L", label: "Toggle layers", category: "Canvas" },
  { keys: "Ctrl + Tab", label: "Toggle 2D/3D view", category: "Canvas" },
  { keys: "?", label: "Show shortcuts", category: "Canvas" },
  // Export
  { keys: "Ctrl + E", label: "Export PDF", category: "Export" },
  { keys: "Ctrl + S", label: "Save project", category: "Export" },
  { keys: "Ctrl + Shift + E", label: "Export PNG", category: "Export" },
];

interface KeyboardShortcutsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KeyboardShortcuts({ isOpen, onClose }: KeyboardShortcutsProps) {
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!isOpen) {
      const t = setTimeout(() => setSearch(""), 0);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  const filtered = useMemo(() => {
    if (!search) {return SHORTCUTS;}
    const q = search.toLowerCase();
    return SHORTCUTS.filter(
      (s) => s.label.toLowerCase().includes(q) || s.keys.toLowerCase().includes(q)
    );
  }, [search]);

  const categories = useMemo(() => {
    const cats = new Map<string, Shortcut[]>();
    for (const s of filtered) {
      const list = cats.get(s.category) || [];
      list.push(s);
      cats.set(s.category, list);
    }
    return cats;
  }, [filtered]);

  if (!isOpen) {return null;}

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: Z.modal }}
    >
      {/* Backdrop */}
      <button
        type="button"
        className="absolute inset-0 bg-black/50 border-0 p-0 cursor-default"
        aria-label="Close keyboard shortcuts"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative w-[32.5rem] max-w-[calc(100vw-2rem)] max-h-[70vh] rounded-xl shadow-2xl overflow-hidden flex flex-col"
        style={{
          background: "var(--surface-page, var(--color-white-50))",
          border: "0.0625rem solid var(--border-soft, var(--color-bronze-100))",
        }}
        role="dialog"
        aria-label="Keyboard Shortcuts"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: "var(--border-soft, var(--color-bronze-100))" }}>
          <div className="flex items-center gap-2">
            <Keyboard size={16} style={{ color: "var(--color-primary, var(--color-ecru-500))" }} />
            <h3 className="text-sm font-semibold" style={{ color: "var(--text-strong, var(--color-ecru-950))" }}>
              Keyboard Shortcuts
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-black/5" aria-label="Close">
            <X size={16} style={{ color: "var(--text-muted, var(--color-bronze-700))" }} />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 py-2 border-b" style={{ borderColor: "var(--border-soft, var(--color-bronze-100))" }}>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: "var(--surface-inset, var(--color-bronze-50))" }}>
            <Search size={14} style={{ color: "var(--text-muted, var(--text-inverse-subtle))" }} />
            <input
              type="text"
              placeholder="Search shortcuts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-xs outline-none"
              style={{ color: "var(--text-body, var(--color-bronze-900))" }}
              autoFocus
            />
          </div>
        </div>

        {/* Shortcuts list */}
        <div className="flex-1 overflow-y-auto px-5 py-3">
          {categories.size === 0 && (
            <p className="text-xs text-center py-4" style={{ color: "var(--text-muted, var(--text-inverse-subtle))" }}>
              No shortcuts match &quot;{search}&quot;
            </p>
          )}
          {Array.from(categories.entries()).map(([category, shortcuts]) => (
            <div key={category} className="mb-4 last:mb-0">
              <h4 className="text-[0.6875rem] font-medium uppercase tracking-wide mb-2" style={{ color: "var(--text-muted, var(--text-inverse-subtle))" }}>
                {category}
              </h4>
              <div className="space-y-1">
                {shortcuts.map((shortcut) => (
                  <div key={shortcut.keys} className="flex items-center justify-between py-1">
                    <span className="text-xs" style={{ color: "var(--text-body, var(--color-bronze-800))" }}>
                      {shortcut.label}
                    </span>
                    <kbd
                      className="px-2 py-0.5 rounded text-[11px] font-mono"
                      style={{
                        background: "var(--surface-inset, var(--surface-status-bad))",
                        color: "var(--text-strong, var(--color-bronze-900))",
                        border: "1px solid var(--border-soft, var(--color-bronze-200))",
                      }}
                    >
                      {shortcut.keys}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-2 border-t text-center" style={{ borderColor: "var(--border-soft, var(--color-bronze-100))" }}>
          <span className="text-[11px]" style={{ color: "var(--text-muted, var(--text-inverse-subtle))" }}>
            Press <kbd className="px-1 py-0.5 rounded text-[0.625rem] font-mono" style={{ background: "var(--surface-inset, var(--surface-status-bad))" }}>?</kbd> anytime to show this
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook to control keyboard shortcuts modal via '?' key.
 */
export function useKeyboardShortcutsModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "?" && !e.ctrlKey && !e.metaKey) {
        // Don't trigger when typing in inputs
        const target = e.target as HTMLElement;
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {return;}
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen]);

  return { isOpen, setIsOpen, close: () => setIsOpen(false) };
}
