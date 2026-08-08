import type { PropsWithChildren, ReactElement } from "react";

import type { PlannerFeatureSlug } from "./plannerFeaturePages";

/**
 * Lightweight animated SVG demo per feature page. Purely decorative —
 * the surrounding page copy carries the meaning, so the SVG is aria-hidden.
 * Colors come from FOCSS tokens; animations live in planner-feature-pages.css
 * and collapse to the finished frame under prefers-reduced-motion.
 */

const STROKE = "var(--color-primary)";
const ACCENT = "var(--color-bronze-500)";
const FAINT = "var(--border-muted)";
const TEXT = "var(--text-muted)";
const WASH = "var(--surface-accent-wash)";

const DEMO_STEPS = [
  { id: "01", label: "Draw floor outline" },
  { id: "02", label: "Place furniture" },
  { id: "03", label: "Export PDF & quote" },
] as const;

const ACTIVE_STEP = "02";

const STAT_BAR =
  "1,200+ layouts created · 43 cities across India · Export to PDF or Quote in 1 click.";

type SvgProps = { viewBox?: string };

function DemoSvg({ children, viewBox = "0 0 480 300" }: PropsWithChildren<SvgProps>) {
  return (
    <svg className="pfp-demo-svg" viewBox={viewBox} fill="none" aria-hidden="true" focusable="false">
      {children}
    </svg>
  );
}

function Label({ x, y, children }: PropsWithChildren<{ x: number; y: number }>) {
  return (
    <text x={x} y={y} fill={TEXT} fontSize="12" letterSpacing="0.04em">
      {children}
    </text>
  );
}

function MeasureDemo() {
  return (
    <DemoSvg>
      <rect x="90" y="50" width="280" height="170" stroke={STROKE} strokeWidth="4" pathLength={1} className="pfp-anim-draw" />
      <g className="pfp-anim-fade pfp-delay-3">
        <line x1="90" y1="250" x2="370" y2="250" stroke={ACCENT} strokeWidth="2" pathLength={1} className="pfp-anim-draw pfp-delay-3" />
        <line x1="90" y1="242" x2="90" y2="258" stroke={ACCENT} strokeWidth="2" />
        <line x1="370" y1="242" x2="370" y2="258" stroke={ACCENT} strokeWidth="2" />
      </g>
      <g className="pfp-anim-rise pfp-delay-5">
        <rect x="186" y="236" width="88" height="26" rx="13" fill={WASH} stroke={FAINT} />
        <Label x={204} y={253}>4 200 mm</Label>
      </g>
      <g className="pfp-anim-fade pfp-delay-4">
        <line x1="402" y1="50" x2="402" y2="220" stroke={ACCENT} strokeWidth="2" pathLength={1} className="pfp-anim-draw pfp-delay-4" />
        <line x1="394" y1="50" x2="410" y2="50" stroke={ACCENT} strokeWidth="2" />
        <line x1="394" y1="220" x2="410" y2="220" stroke={ACCENT} strokeWidth="2" />
      </g>
      <g className="pfp-anim-pop pfp-delay-6">
        <rect x="180" y="120" width="100" height="30" rx="15" fill={WASH} stroke={ACCENT} />
        <Label x={203} y={140}>10.7 m²</Label>
      </g>
    </DemoSvg>
  );
}

function CatalogDemo() {
  const desks = [
    { x: 80, delay: "pfp-delay-1" },
    { x: 190, delay: "pfp-delay-3" },
    { x: 300, delay: "pfp-delay-5" },
  ];
  return (
    <DemoSvg>
      <line x1="50" y1="190" x2="430" y2="190" stroke={FAINT} strokeWidth="1.5" strokeDasharray="5 6" className="pfp-anim-fade" />
      {desks.map((desk) => (
        <g key={desk.x} className={`pfp-anim-slide ${desk.delay}`}>
          <rect x={desk.x} y="110" width="100" height="56" rx="6" fill={WASH} stroke={STROKE} strokeWidth="3" />
          <circle cx={desk.x + 50} cy="190" r="16" stroke={STROKE} strokeWidth="3" fill="var(--surface-panel-strong)" />
        </g>
      ))}
      <rect x="293" y="103" width="114" height="70" rx="10" stroke={ACCENT} strokeWidth="2" strokeDasharray="4 5" className="pfp-anim-pop pfp-delay-6" />
      <g className="pfp-anim-rise pfp-delay-7">
        <rect x="160" y="232" width="160" height="28" rx="14" fill={WASH} stroke={FAINT} />
        <Label x={180} y={250}>Workstation WS-301</Label>
      </g>
    </DemoSvg>
  );
}

function ThreeDViewDemo() {
  return (
    <DemoSvg>
      <g className="pfp-anim-fade">
        <rect x="60" y="90" width="120" height="90" stroke={STROKE} strokeWidth="3" />
        <rect x="84" y="114" width="44" height="26" fill={WASH} stroke={STROKE} strokeWidth="2" />
        <Label x={86} y={210}>2D plan</Label>
      </g>
      <path d="M205 135 H252 M252 135 l-10 -8 M252 135 l-10 8" stroke={ACCENT} strokeWidth="2.5" pathLength={1} className="pfp-anim-draw pfp-delay-2" />
      <g className="pfp-anim-rise pfp-delay-3">
        <path d="M280 160 L350 124 L420 160 L350 196 Z" fill={WASH} stroke={STROKE} strokeWidth="3" strokeLinejoin="round" />
        <path d="M280 160 V110 L350 74 L420 110 V160 M280 110 L350 146 L420 110 M350 146 V196" stroke={STROKE} strokeWidth="3" strokeLinejoin="round" />
        <Label x={322} y={232}>3D orbit</Label>
      </g>
      <g className="pfp-anim-pop pfp-delay-5">
        <rect x="178" y="56" width="124" height="28" rx="14" fill={WASH} stroke={FAINT} />
        <Label x={196} y={74}>2D · 3D · Split</Label>
      </g>
    </DemoSvg>
  );
}

function AiAssistDemo() {
  const desks = [
    { x: 118, y: 178 },
    { x: 158, y: 178 },
    { x: 198, y: 178 },
    { x: 238, y: 178 },
    { x: 118, y: 214 },
    { x: 158, y: 214 },
    { x: 198, y: 214 },
    { x: 238, y: 214 },
  ];
  return (
    <DemoSvg>
      <g className="pfp-anim-fade">
        <rect x="52" y="44" width="148" height="248" rx="10" fill="var(--surface-panel-strong)" stroke={FAINT} strokeWidth="2" />
        <rect x="64" y="56" width="124" height="22" rx="11" fill={WASH} stroke={FAINT} />
        <rect x="72" y="64" width="36" height="8" rx="4" fill={ACCENT} className="pfp-anim-pulse" />
        <rect x="112" y="64" width="28" height="8" rx="4" fill={FAINT} />
        <rect x="144" y="64" width="32" height="8" rx="4" fill={FAINT} />
      </g>
      <g className="pfp-anim-rise pfp-delay-2">
        <rect x="96" y="148" width="220" height="132" rx="6" fill="var(--surface-panel)" stroke={STROKE} strokeWidth="2.5" />
        <rect x="108" y="160" width="196" height="52" rx="4" fill={WASH} stroke={STROKE} strokeWidth="1.5" strokeDasharray="4 3" />
        {desks.map((desk, i) => (
          <rect
            key={`${desk.x}-${desk.y}`}
            x={desk.x}
            y={desk.y}
            width="28"
            height="14"
            rx="2"
            fill="color-mix(in srgb, var(--color-primary) 24%, var(--surface-panel))"
            stroke={STROKE}
            strokeWidth="1.5"
            className={`pfp-anim-pop pfp-delay-${3 + (i % 4)}`}
          />
        ))}
        <rect x="108" y="224" width="196" height="44" rx="4" fill={WASH} stroke={ACCENT} strokeWidth="1.5" strokeDasharray="4 3" />
      </g>
      <g className="pfp-anim-rise pfp-delay-6">
        <rect x="96" y="292" width="220" height="28" rx="14" fill={WASH} stroke={ACCENT} />
        <Label x={156} y={310}>Apply to canvas</Label>
      </g>
      <path
        d="M340 88 l6 14 14 6 -14 6 -6 14 -6 -14 -14 -6 14 -6 Z"
        fill={ACCENT}
        className="pfp-anim-pulse pfp-delay-4"
      />
    </DemoSvg>
  );
}

function ExportDemo() {
  return (
    <DemoSvg>
      <g className="pfp-anim-rise">
        <rect x="130" y="36" width="220" height="232" rx="10" fill="var(--surface-panel-strong)" stroke={FAINT} strokeWidth="2" />
        <rect x="130" y="36" width="220" height="34" rx="10" fill={WASH} />
        <rect x="146" y="50" width="84" height="8" rx="4" fill={ACCENT} />
      </g>
      <rect x="152" y="88" width="176" height="84" stroke={STROKE} strokeWidth="2.5" pathLength={1} className="pfp-anim-draw pfp-delay-2" />
      <rect x="170" y="106" width="56" height="30" fill={WASH} stroke={STROKE} strokeWidth="2" className="pfp-anim-fade pfp-delay-3" />
      {[190, 210, 230].map((y, i) => (
        <g key={y} className={`pfp-anim-slide pfp-delay-${4 + i}`}>
          <rect x="152" y={y} width="120" height="8" rx="4" fill={FAINT} />
          <rect x="296" y={y} width="32" height="8" rx="4" fill={FAINT} />
        </g>
      ))}
      <g className="pfp-anim-pop pfp-delay-7">
        <circle cx="362" cy="232" r="28" fill={ACCENT} />
        <text x="362" y="237" fill="var(--text-inverse)" fontSize="13" fontWeight="600" textAnchor="middle">
          PDF
        </text>
      </g>
    </DemoSvg>
  );
}

const DEMOS: Record<string, () => ReactElement> = {
  measure: MeasureDemo,
  catalog: CatalogDemo,
  "3d-view": ThreeDViewDemo,
  "ai-assist": AiAssistDemo,
  export: ExportDemo,
};

function DemoStepIndicator() {
  return (
    <div className="pfp-demo-steps" aria-hidden="true">
      <p className="typ-micro pfp-demo-steps__label font-semibold uppercase">
        Step {ACTIVE_STEP} of 3
      </p>
      <ol className="pfp-demo-steps__list">
        {DEMO_STEPS.map((step) => {
          const isActive = step.id === ACTIVE_STEP;
          return (
            <li
              key={step.id}
              className={`pfp-demo-step ${isActive ? "pfp-demo-step--active" : ""}`}
            >
              <span
                className={`typ-micro font-bold ${isActive ? "pfp-demo-step__id--active" : "pfp-demo-step__id--idle"}`}
              >
                {step.id}
              </span>
              <span
                className={`typ-label ${isActive ? "pfp-demo-step__label--active" : "pfp-demo-step__label--idle"}`}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function DemoStatBar() {
  return (
    <p className="pfp-demo-stat-bar typ-micro font-semibold uppercase" aria-hidden="true">
      {STAT_BAR}
    </p>
  );
}

export function PlannerFeatureDemo({ slug }: { slug: PlannerFeatureSlug }) {
  const Demo = DEMOS[slug];
  if (!Demo) return null;
  return (
    <div className="pfp-demo-shell">
      <div className="p-3 pb-0">
        <DemoStepIndicator />
      </div>
      <figure className="pfp-demo m-3 mt-3 border-0 shadow-none" aria-hidden="true">
        <Demo />
        <figcaption className="pfp-demo-label typ-micro text-subtle">Layout preview</figcaption>
      </figure>
      <DemoStatBar />
    </div>
  );
}