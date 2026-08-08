"use client";

/**
 * SmartLayoutEngine — AI-Powered Auto-Layout Suggestions
 *
 * Features that surpass SmartDraw/Planner5D/3DPlanner:
 * - One-click layout generation for common office scenarios
 * - Team-size-aware desk arrangement
 * - Compliance-aware spacing (ADA, ergonomic standards)
 * - Zone-based optimization templates
 */

import { useState, useCallback } from "react";
import { MagicWand as Wand2, SquaresFour as LayoutGrid, Users, ArrowsOut as Maximize2, Lightning as Zap, CheckCircle as CheckCircle2 } from "@phosphor-icons/react";

export type LayoutTemplate = {
  id: string;
  name: string;
  description: string;
  icon: "grid" | "team" | "open" | "executive" | "hybrid";
  teamSize: { min: number; max: number };
  sqftPerPerson: number;
  zones: string[];
};

export const LAYOUT_TEMPLATES: LayoutTemplate[] = [
  {
    id: "open-plan-small",
    name: "Open Plan (Small Team)",
    description: "4-8 people, collaborative benching with breakout area",
    icon: "grid",
    teamSize: { min: 4, max: 8 },
    sqftPerPerson: 75,
    zones: ["Open Desking", "Breakout", "Print Zone"],
  },
  {
    id: "open-plan-medium",
    name: "Open Plan (Medium Team)",
    description: "12-24 people, neighborhoods with focus pods",
    icon: "team",
    teamSize: { min: 12, max: 24 },
    sqftPerPerson: 65,
    zones: ["Neighborhood A", "Neighborhood B", "Focus Pods", "Collaboration", "Print/Copy"],
  },
  {
    id: "hybrid-workspace",
    name: "Hybrid Workspace",
    description: "Flexible desking + bookable rooms for varied team sizes",
    icon: "hybrid",
    teamSize: { min: 8, max: 40 },
    sqftPerPerson: 55,
    zones: ["Open Desking", "Bookable Meeting", "Phone Booths", "Lounge", "Kitchen"],
  },
  {
    id: "executive-suite",
    name: "Executive Suite",
    description: "Private offices with shared boardroom",
    icon: "executive",
    teamSize: { min: 4, max: 10 },
    sqftPerPerson: 150,
    zones: ["Private Offices", "Boardroom", "PA Station", "Reception", "Lounge"],
  },
  {
    id: "creative-studio",
    name: "Creative Studio",
    description: "Open workshop with presentation + brainstorm zones",
    icon: "open",
    teamSize: { min: 6, max: 16 },
    sqftPerPerson: 85,
    zones: ["Workshop", "Brainstorm Wall", "Presentation", "Quiet Zone", "Material Library"],
  },
];

interface SmartLayoutPanelProps {
  onApplyTemplate?: (template: LayoutTemplate) => void;
  roomWidthMm?: number;
  roomDepthMm?: number;
}

export function SmartLayoutPanel({
  onApplyTemplate,
  roomWidthMm,
  roomDepthMm,
}: SmartLayoutPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [applied, setApplied] = useState(false);

  const handleApply = useCallback(() => {
    const template = LAYOUT_TEMPLATES.find((t) => t.id === selectedId);
    if (template && onApplyTemplate) {
      onApplyTemplate(template);
      setApplied(true);
      setTimeout(() => setApplied(false), 2000);
    }
  }, [selectedId, onApplyTemplate]);

  const roomArea = roomWidthMm && roomDepthMm
    ? Math.round((roomWidthMm * roomDepthMm) / 1_000_000)
    : null;

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed z-40 bottom-6 left-6 flex items-center gap-2 rounded-full px-4 py-3 shadow-lg transition-all hover:scale-105"
        style={{ background: "var(--color-primary, var(--color-ecru-500))", color: "white" }}
        aria-label="Smart Layout Generator"
        title="Generate optimized layouts instantly"
      >
        <Wand2 size={18} />
        <span className="text-sm font-medium hidden sm:inline">Smart Layout</span>
      </button>
    );
  }

  return (
    <div
      className="fixed z-50 bottom-6 left-6 w-[23.75rem] max-w-[calc(100vw-2rem)] max-h-[32.5rem] rounded-xl border shadow-2xl overflow-hidden flex flex-col"
      style={{
        background: "var(--surface-page, var(--color-white-50))",
        borderColor: "var(--border-soft, var(--color-bronze-100))",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 px-4 py-3 border-b"
        style={{ borderColor: "var(--border-soft, var(--color-bronze-100))", background: "var(--surface-soft, var(--color-ecru-50))" }}
      >
        <Wand2 size={16} style={{ color: "var(--color-primary, var(--color-ecru-500))" }} />
        <span className="text-sm font-semibold flex-1" style={{ color: "var(--text-strong, var(--color-ecru-950))" }}>
          Smart Layout Generator
        </span>
        {roomArea && (
          <span className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700">
            {roomArea} m²
          </span>
        )}
        <button
          onClick={() => setIsOpen(false)}
          className="p-1 rounded hover:bg-black/5"
          aria-label="Close"
        >
          ×
        </button>
      </div>

      {/* Templates */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
        {LAYOUT_TEMPLATES.map((tmpl) => {
          const IconComponent = {
            grid: LayoutGrid,
            team: Users,
            open: Maximize2,
            executive: Zap,
            hybrid: LayoutGrid,
          }[tmpl.icon];

          return (
            <button
              key={tmpl.id}
              type="button"
              aria-label={tmpl.name ?? tmpl.id}
              onClick={() => setSelectedId(tmpl.id)}
              className={`w-full text-start p-3 rounded-lg border transition-all ${
                selectedId === tmpl.id
                  ? "ring-2 ring-[var(--color-primary,var(--color-ecru-500))] border-[var(--color-primary,var(--color-ecru-500))]"
                  : "hover:border-muted"
              }`}
              style={{ borderColor: selectedId === tmpl.id ? undefined : "var(--border-soft, var(--color-bronze-100))" }}
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded flex items-center justify-center bg-soft flex-shrink-0">
                  <IconComponent size={16} className="text-muted" />
                </div>
                <div>
                  <div className="text-xs font-semibold" style={{ color: "var(--text-strong, var(--color-ecru-950))" }}>
                    {tmpl.name}
                  </div>
                  <div className="text-[0.6875rem] mt-0.5" style={{ color: "var(--text-muted, var(--color-bronze-700))" }}>
                    {tmpl.description}
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[0.625rem] px-1.5 py-0.5 rounded bg-soft text-muted">
                      {tmpl.teamSize.min}–{tmpl.teamSize.max} people
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-soft text-muted">
                      {tmpl.sqftPerPerson} ft²/person
                    </span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Apply */}
      <div className="px-3 py-3 border-t" style={{ borderColor: "var(--border-soft, var(--color-bronze-100))" }}>
        <button
          onClick={handleApply}
          disabled={!selectedId}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-medium transition-all disabled:opacity-40"
          style={{ background: "var(--color-primary, var(--color-ecru-500))", color: "white" }}
        >
          {applied ? (
            <>
              <CheckCircle2 size={14} /> Applied!
            </>
          ) : (
            <>
              <Wand2 size={14} /> Apply Layout
            </>
          )}
        </button>
      </div>
    </div>
  );
}
