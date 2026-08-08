/** Snap-to-grid helpers. */
export const snap = (value: number, gridSize: number): number => {
  if (!gridSize || gridSize <= 0) return value;
  return Math.round(value / gridSize) * gridSize;
};

export const snapAngle = (deg: number, step = 15): number => Math.round(deg / step) * step;
