import type { RateCommitmentPoint } from "./rateCommitment";

export const scatterHeight = 880;
export function scatterDomains(points: RateCommitmentPoint[]) {
  return {
    x: Math.max(
      1000,
      Math.ceil(
        (Math.max(0, ...points.map((p) => p.committedValue)) * 1.05) / 1000,
      ) * 1000,
    ),
    y: Math.max(
      100,
      Math.ceil(
        (Math.max(0, ...points.map((p) => p.monthlyRate)) * 1.05) / 100,
      ) * 100,
    ),
  };
}

// Resolve collisions across every color/status in pixel space. Financial values
// remain untouched; only the chart coordinates are displaced.
export function spreadScatter(
  points: RateCommitmentPoint[],
  width: number,
  height = scatterHeight,
) {
  const domain = scatterDomains(points);
  const w = Math.max(32, width - 106),
    h = Math.max(32, height - 90);
  const gap = 18,
    inset = 10;
  const placed: { x: number; y: number }[] = [];
  return [...points]
    .sort(
      (a, b) =>
        a.committedValue - b.committedValue ||
        a.monthlyRate - b.monthlyRate ||
        a.customerId.localeCompare(b.customerId),
    )
    .map((p) => {
      const anchorX = Math.max(
        inset,
        Math.min(w - inset, (p.committedValue / domain.x) * w),
      );
      const anchorY = Math.max(
        inset,
        Math.min(h - inset, (1 - p.monthlyRate / domain.y) * h),
      );
      let x = anchorX,
        y = anchorY;
      const free = (cx: number, cy: number) =>
        placed.every((q) => Math.hypot(cx - q.x, cy - q.y) >= gap - 0.01);
      if (!free(x, y)) {
        // Search concentric rings, nearest first, to retain compact density clusters.
        search: for (
          let radius = gap;
          radius < Math.hypot(w, h) + gap;
          radius += gap / 2
        ) {
          const steps = Math.ceil((2 * Math.PI * radius) / (gap / 2));
          for (let i = 0; i < steps; i++) {
            const angle = (i / steps) * 2 * Math.PI;
            const cx = anchorX + Math.cos(angle) * radius,
              cy = anchorY + Math.sin(angle) * radius;
            if (
              cx < inset ||
              cx > w - inset ||
              cy < inset ||
              cy > h - inset ||
              !free(cx, cy)
            )
              continue;
            x = cx;
            y = cy;
            break search;
          }
        }
      }
      placed.push({ x, y });
      return {
        ...p,
        plotCommitment: (x / w) * domain.x,
        plotRate: (1 - y / h) * domain.y,
      };
    });
}
