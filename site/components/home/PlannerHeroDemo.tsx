"use client";

/**
 * PlannerHeroDemo — labeled 10×8 m office floor plan for the landing hero.
 * Staged animation: walls → zones → furniture → dimensions → selection.
 */

import { useEffect, useState } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";

import { MOTION_EASE } from "@/lib/helpers/motion";

const LOOP_MS = 10_000;

const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: (delay: number) => ({
    opacity: 1,
    transition: { duration: 0.55, delay, ease: MOTION_EASE },
  }),
};

const dropIn: Variants = {
  hidden: { opacity: 0, scale: 0.82, y: 8 },
  visible: (delay: number) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.45, delay, ease: MOTION_EASE },
  }),
};

const drawStroke: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: (delay: number) => ({
    pathLength: 1,
    opacity: 1,
    transition: { duration: 0.7, delay, ease: MOTION_EASE },
  }),
};

const slideIn: Variants = {
  hidden: { opacity: 0, x: -6 },
  visible: (delay: number) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, delay, ease: MOTION_EASE },
  }),
};

function Workstation({
  x,
  y,
  label,
  delay,
  reduced,
}: {
  x: number;
  y: number;
  label: string;
  delay: number;
  reduced: boolean | null;
}) {
  return (
    <motion.g
      custom={reduced ? 0 : delay}
      variants={dropIn}
      initial={reduced ? false : "hidden"}
      animate="visible"
    >
      <rect x={x} y={y} width={72} height={36} rx={3} className="pl-desk" />
      <rect x={x + 10} y={y + 38} width={14} height={6} rx={2} className="pl-chair" />
      <rect x={x + 48} y={y + 38} width={14} height={6} rx={2} className="pl-chair" />
      <text x={x + 36} y={y - 5} textAnchor="middle" className="pl-room-label" fontSize="7">
        {label}
      </text>
    </motion.g>
  );
}

function BoardroomTable({
  x,
  y,
  delay,
  reduced,
}: {
  x: number;
  y: number;
  delay: number;
  reduced: boolean | null;
}) {
  return (
    <motion.g
      custom={reduced ? 0 : delay}
      variants={dropIn}
      initial={reduced ? false : "hidden"}
      animate="visible"
    >
      <rect x={x} y={y} width={96} height={48} rx={8} className="pl-desk" />
      <rect x={x - 10} y={y + 12} width={7} height={18} rx={2} className="pl-chair" />
      <rect x={x + 99} y={y + 12} width={7} height={18} rx={2} className="pl-chair" />
      <rect x={x + 16} y={y - 10} width={18} height={7} rx={2} className="pl-chair" />
      <rect x={x + 62} y={y - 10} width={18} height={7} rx={2} className="pl-chair" />
      <rect x={x + 16} y={y + 51} width={18} height={7} rx={2} className="pl-chair" />
      <rect x={x + 62} y={y + 51} width={18} height={7} rx={2} className="pl-chair" />
      <text x={x + 48} y={y - 16} textAnchor="middle" className="pl-room-label" fontSize="7">
        Boardroom BR-12
      </text>
    </motion.g>
  );
}

function StorageUnit({
  x,
  y,
  delay,
  reduced,
}: {
  x: number;
  y: number;
  delay: number;
  reduced: boolean | null;
}) {
  return (
    <motion.g
      custom={reduced ? 0 : delay}
      variants={dropIn}
      initial={reduced ? false : "hidden"}
      animate="visible"
    >
      <rect x={x} y={y} width={88} height={22} rx={2} className="pl-storage" />
      <line x1={x + 29} y1={y + 3} x2={x + 29} y2={y + 19} stroke="var(--text-muted)" strokeWidth="1" />
      <line x1={x + 58} y1={y + 3} x2={x + 58} y2={y + 19} stroke="var(--text-muted)" strokeWidth="1" />
      <text x={x + 44} y={y - 5} textAnchor="middle" className="pl-room-label" fontSize="7">
        Storage ST-05
      </text>
    </motion.g>
  );
}

export function PlannerHeroDemo() {
  const reduced = useReducedMotion();
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    if (reduced) return;
    const timer = setInterval(() => setCycle((prev) => prev + 1), LOOP_MS);
    return () => clearInterval(timer);
  }, [reduced]);

  const motionInitial = reduced ? false : ("hidden" as const);
  const svgKey = reduced ? "static" : `cycle-${cycle}`;

  return (
    <div className="planner-hero-demo planner-hero-demo--hero" aria-hidden>
      <div className="planner-hero-demo__chrome">
        <span className="planner-hero-demo__dots">
          <i />
          <i />
          <i />
        </span>
        <span className="planner-hero-demo__title">Office layout · 10 × 8 m</span>
        <span className="planner-hero-demo__segment">
          <i data-active="true">2D</i>
          <i>3D</i>
          <i>Split</i>
        </span>
      </div>

      <div className="planner-hero-demo__canvas">
        <svg viewBox="0 0 480 360" role="presentation" key={svgKey}>
          {/* Phase 1 — walls */}
          <motion.rect
            x={32}
            y={24}
            width={416}
            height={332}
            rx={2}
            className="pl-wall"
            fill="none"
            custom={0}
            variants={drawStroke}
            initial={motionInitial}
            animate="visible"
          />
          <motion.line
            x1={312}
            y1={24}
            x2={312}
            y2={108}
            className="pl-wall"
            custom={reduced ? 0 : 0.15}
            variants={drawStroke}
            initial={motionInitial}
            animate="visible"
          />
          <motion.line
            x1={312}
            y1={148}
            x2={312}
            y2={200}
            className="pl-wall"
            custom={reduced ? 0 : 0.25}
            variants={drawStroke}
            initial={motionInitial}
            animate="visible"
          />
          <motion.path
            d="M 312 148 A 28 28 0 0 1 340 120"
            className="pl-door"
            fill="none"
            custom={reduced ? 0 : 0.35}
            variants={drawStroke}
            initial={motionInitial}
            animate="visible"
          />
          <motion.g
            custom={reduced ? 0 : 0.4}
            variants={fadeIn}
            initial={motionInitial}
            animate="visible"
          >
            <text x={326} y={142} className="pl-zone-label">
              Door
            </text>
            <line x1={32} y1={88} x2={32} y2={128} className="pl-door" strokeWidth="2.5" />
            <line x1={32} y1={200} x2={32} y2={240} className="pl-door" strokeWidth="2.5" />
            <text x={44} y={82} className="pl-zone-label">
              Window
            </text>
          </motion.g>

          {/* Phase 2 — zones */}
          <motion.g
            custom={reduced ? 0 : 0.75}
            variants={fadeIn}
            initial={motionInitial}
            animate="visible"
          >
            <rect x={48} y={40} width={248} height={200} rx={6} className="pl-zone" />
            <text x={58} y={54} className="pl-zone-label">
              OPEN PLAN · 4 WORKSTATIONS
            </text>
          </motion.g>
          <motion.g
            custom={reduced ? 0 : 0.85}
            variants={fadeIn}
            initial={motionInitial}
            animate="visible"
          >
            <rect x={324} y={40} width={112} height={148} rx={6} className="pl-zone pl-zone--alt" />
            <text x={334} y={54} className="pl-zone-label">
              BOARDROOM
            </text>
          </motion.g>

          {/* Phase 3 — furniture */}
          <Workstation x={68} y={72} label="Workstation WS-301" delay={1.1} reduced={reduced} />
          <Workstation x={168} y={72} label="Workstation WS-302" delay={1.25} reduced={reduced} />
          <Workstation x={68} y={152} label="Workstation WS-303" delay={1.4} reduced={reduced} />
          <Workstation x={168} y={152} label="Workstation WS-304" delay={1.55} reduced={reduced} />
          <BoardroomTable x={332} y={88} delay={1.7} reduced={reduced} />
          <StorageUnit x={68} y={280} delay={1.85} reduced={reduced} />

          {/* Phase 4 — dimensions */}
          <motion.g
            custom={reduced ? 0 : 2.2}
            variants={slideIn}
            initial={motionInitial}
            animate="visible"
          >
            <line x1={32} y1={348} x2={448} y2={348} className="pl-dim-line" />
            <line x1={32} y1={342} x2={32} y2={354} className="pl-dim-line" />
            <line x1={448} y1={342} x2={448} y2={354} className="pl-dim-line" />
            <rect x={196} y={340} width={88} height={15} rx={3} className="pl-dim-badge" />
            <text x={240} y={351} textAnchor="middle" className="pl-dim-text">
              10 000 mm
            </text>
          </motion.g>
          <motion.g
            custom={reduced ? 0 : 2.35}
            variants={slideIn}
            initial={motionInitial}
            animate="visible"
          >
            <line x1={462} y1={24} x2={462} y2={356} className="pl-dim-line" />
            <line x1={456} y1={24} x2={468} y2={24} className="pl-dim-line" />
            <line x1={456} y1={356} x2={468} y2={356} className="pl-dim-line" />
            <rect x={454} y={178} width={15} height={72} rx={3} className="pl-dim-badge" />
            <text
              x={461}
              y={214}
              textAnchor="middle"
              className="pl-dim-text"
              transform="rotate(-90 461 214)"
            >
              8 000 mm
            </text>
          </motion.g>

          {/* Phase 5 — selection + cursor on WS-304 */}
          <motion.g
            custom={reduced ? 0 : 2.9}
            variants={fadeIn}
            initial={motionInitial}
            animate="visible"
          >
            <rect
              x={160}
              y={144}
              width={84}
              height={52}
              rx={4}
              className="pl-selection"
            />
            <motion.g
              animate={reduced ? undefined : { x: [0, 4, 0], y: [0, -3, 0] }}
              transition={{ duration: 1.2, delay: 3.1, repeat: Infinity, repeatDelay: 2.5 }}
            >
              <polygon points="178,198 178,210 190,204" className="pl-cursor" />
            </motion.g>
          </motion.g>
        </svg>

        <motion.span
          className="planner-hero-demo__saved"
          custom={reduced ? 0 : 2.5}
          variants={fadeIn}
          initial={motionInitial}
          animate="visible"
        >
          ● Saved
        </motion.span>
      </div>

      <div className="planner-hero-demo__status">
        <span>6 furniture items</span>
        <span>2 zones</span>
        <span>
          Floor <strong>80 m²</strong>
        </span>
        <span className="planner-hero-demo__status-right">True to scale</span>
      </div>
    </div>
  );
}
