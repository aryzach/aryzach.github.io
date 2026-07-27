import { useCallback, useEffect, useRef, useState } from "react";

// Persistent, drag-to-resize column widths (in px) keyed by localStorage.
export function useResizableColumns<T extends string>(
  storageKey: string,
  cols: readonly T[],
  defaultWidth = 120,
) {
  const [widths, setWidths] = useState<Record<string, number>>(() => {
    const base: Record<string, number> = {};
    for (const c of cols) base[c] = defaultWidth;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const saved = JSON.parse(raw) as Record<string, number>;
        for (const k of Object.keys(saved)) {
          if (typeof saved[k] === "number") base[k] = saved[k];
        }
      }
    } catch {
      /* ignore */
    }
    return base;
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(widths));
    } catch {
      /* ignore */
    }
  }, [storageKey, widths]);

  const dragRef = useRef<{ col: T; startX: number; startW: number } | null>(null);

  const startResize = useCallback(
    (col: T, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const startW = widths[col] ?? defaultWidth;
      dragRef.current = { col, startX: e.clientX, startW };
      const onMove = (ev: MouseEvent) => {
        const d = dragRef.current;
        if (!d) return;
        const w = Math.max(50, d.startW + (ev.clientX - d.startX));
        setWidths((p) => ({ ...p, [d.col]: w }));
      };
      const onUp = () => {
        dragRef.current = null;
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [widths, defaultWidth],
  );

  return { widths, startResize };
}

// Small handle to render inside each <th>. Absolute-positioned to the right edge.
export function ColResizeHandle({ onMouseDown }: { onMouseDown: (e: React.MouseEvent) => void }) {
  return (
    <span
      onMouseDown={onMouseDown}
      onClick={(e) => e.stopPropagation()}
      className="absolute top-0 right-0 h-full w-1 cursor-col-resize hover:bg-primary/40 active:bg-primary/60"
      aria-hidden
    />
  );
}