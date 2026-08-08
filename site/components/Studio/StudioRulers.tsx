"use client";
import { OO } from "@studio/lib/studioPalette";
import React, { useEffect, useRef } from "react";
import type { FabricRef } from "@studio/lib/studioTypes";

type RulersProps = {
  fabricRef: FabricRef;
  scale: number;
  zoom: number;
  cursorMm?: { x: number; y: number };
  offset?: { x: number; y: number };
};

export const Rulers = ({ fabricRef, scale, zoom, cursorMm, offset }: RulersProps) => {
  const topRef = useRef<HTMLCanvasElement>(null);
  const leftRef = useRef<HTMLCanvasElement>(null);
  const cornerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const draw = () => {
      const top = topRef.current;
      const left = leftRef.current;
      if (!top || !left) return;
      const c = fabricRef.current;
      if (!c) return;
      const dpr = window.devicePixelRatio || 1;
      const w = top.clientWidth;
      const h = left.clientHeight;
      top.width = w * dpr;
      top.height = 22 * dpr;
      left.width = 22 * dpr;
      left.height = h * dpr;
      const tctx = top.getContext("2d");
      const lctx = left.getContext("2d");
      if (!tctx || !lctx) return;
      tctx.scale(dpr, dpr);
      lctx.scale(dpr, dpr);
      tctx.clearRect(0, 0, w, 22);
      lctx.clearRect(0, 0, 22, h);

      tctx.fillStyle = lctx.fillStyle = OO.white150;
      tctx.fillRect(0, 0, w, 22);
      lctx.fillRect(0, 0, 22, h);
      tctx.strokeStyle = lctx.strokeStyle = OO.ink600;
      tctx.fillStyle = lctx.fillStyle = OO.ink600;
      tctx.font = lctx.font = "9px ui-monospace, Menlo, monospace";

      const worldMmPerPx = 1 / (scale * zoom);
      const targetPx = 80;
      const targetMm = worldMmPerPx * targetPx;
      const magnitudes = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000];
      let stepMm = magnitudes[0];
      for (const m of magnitudes) {
        stepMm = m;
        if (m >= targetMm) break;
      }
      const minorSteps = 5;
      const pxPerStep = stepMm * scale * zoom;

      const vpt = c.viewportTransform;
      if (!vpt) return;
      const originXpx = vpt[4];
      const originYpx = vpt[5];

      tctx.beginPath();
      const startMm = Math.floor((-originXpx) / (scale * zoom) / stepMm) * stepMm;
      const endMm = startMm + (w / (scale * zoom)) + stepMm * 2;
      for (let mm = startMm; mm <= endMm; mm += stepMm) {
        const x = originXpx + mm * scale * zoom;
        if (x < -20 || x > w + 20) continue;
        tctx.moveTo(Math.round(x) + 0.5, 22);
        tctx.lineTo(Math.round(x) + 0.5, 10);
        const label = stepMm >= 1000 ? `${(mm / 1000).toFixed(1)}m` : `${Math.round(mm)}`;
        tctx.fillText(label, x + 3, 10);
        for (let k = 1; k < minorSteps; k++) {
          const mx = x + (pxPerStep * k) / minorSteps;
          tctx.moveTo(Math.round(mx) + 0.5, 22);
          tctx.lineTo(Math.round(mx) + 0.5, 17);
        }
      }
      tctx.stroke();

      lctx.beginPath();
      const startMmY = Math.floor((-originYpx) / (scale * zoom) / stepMm) * stepMm;
      const endMmY = startMmY + (h / (scale * zoom)) + stepMm * 2;
      for (let mm = startMmY; mm <= endMmY; mm += stepMm) {
        const y = originYpx + mm * scale * zoom;
        if (y < -20 || y > h + 20) continue;
        lctx.moveTo(22, Math.round(y) + 0.5);
        lctx.lineTo(10, Math.round(y) + 0.5);
        const label = stepMm >= 1000 ? `${(mm / 1000).toFixed(1)}m` : `${Math.round(mm)}`;
        lctx.save();
        lctx.translate(9, y + 3);
        lctx.rotate(-Math.PI / 2);
        lctx.fillText(label, 0, 0);
        lctx.restore();
        for (let k = 1; k < minorSteps; k++) {
          const my = y + (pxPerStep * k) / minorSteps;
          lctx.moveTo(22, Math.round(my) + 0.5);
          lctx.lineTo(17, Math.round(my) + 0.5);
        }
      }
      lctx.stroke();

      if (cursorMm) {
        const cx = originXpx + cursorMm.x * scale * zoom;
        const cy = originYpx + cursorMm.y * scale * zoom;
        tctx.fillStyle = OO.midnight500;
        tctx.fillRect(cx - 0.5, 0, 1, 22);
        lctx.fillStyle = OO.midnight500;
        lctx.fillRect(0, cy - 0.5, 22, 1);
      }
    };
    draw();
    const onResize = () => draw();
    window.addEventListener("resize", onResize);
    let raf = 0;
    const loop = () => {
      draw();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(raf);
    };
  }, [fabricRef, scale, zoom, cursorMm, offset]);

  return (
    <>
      <div className="ruler-corner" ref={cornerRef} />
      <canvas className="ruler ruler--h" ref={topRef} />
      <canvas className="ruler ruler--v" ref={leftRef} />
    </>
  );
};

export default Rulers;
