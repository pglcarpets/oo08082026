"use client";
import { OO } from "@studio/lib/studioPalette";
import { useEffect, useRef, useState } from "react";
import * as fabric from "fabric";

type UseFabricOptions = {
  background?: string;
  canvasOptions?: ConstructorParameters<typeof fabric.Canvas>[1];
};

export const useFabric = (options: UseFabricOptions = {}) => {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const canvasElRef = useRef<HTMLCanvasElement | null>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const el = canvasElRef.current;
    if (!wrapper || !el) return;
    if (fabricRef.current) return;

    const rect = wrapper.getBoundingClientRect();
    const c = new fabric.Canvas(el, {
      width: Math.max(300, rect.width),
      height: Math.max(300, rect.height),
      backgroundColor: options.background || OO.canvasBg,
      selection: true,
      preserveObjectStacking: true,
      stopContextMenu: true,
      fireRightClick: true,
      ...options.canvasOptions,
    });
    fabricRef.current = c;
    setReady(true);

    const ro = new ResizeObserver(() => {
      const r = wrapper.getBoundingClientRect();
      if (!fabricRef.current) return;
      fabricRef.current.setDimensions({ width: r.width, height: r.height });
      fabricRef.current.requestRenderAll();
    });
    ro.observe(wrapper);

    return () => {
      ro.disconnect();
      const cur = fabricRef.current;
      fabricRef.current = null;
      setReady(false);
      try {
        cur?.dispose();
      } catch {
        /* ignore */
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { wrapperRef, canvasElRef, fabricRef, ready };
};
