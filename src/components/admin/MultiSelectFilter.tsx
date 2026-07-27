import { useEffect, useRef, useState } from "react";

// Compact dropdown with checkboxes for selecting one, many, or all options.
export function MultiSelectFilter({
  options,
  value,
  onChange,
  allLabel = "All",
  className,
}: {
  options: string[];
  value: string[];
  onChange: (v: string[]) => void;
  allLabel?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const toggle = (o: string) =>
    onChange(value.includes(o) ? value.filter((x) => x !== o) : [...value, o]);

  const label =
    value.length === 0
      ? allLabel
      : value.length === 1
        ? value[0]
        : `${value.length} selected`;

  return (
    <div className={`relative ${className ?? ""}`} ref={ref}>
      <button
        type="button"
        className="w-full h-6 px-1 text-xs bg-background border border-border rounded-sm outline-none text-left truncate"
        onClick={() => setOpen((o) => !o)}
      >
        {label}
      </button>
      {open && (
        <div className="absolute z-30 mt-1 min-w-[180px] max-h-64 overflow-auto bg-popover text-popover-foreground border border-border rounded-md shadow-md p-1">
          <button
            type="button"
            className="w-full text-left px-2 py-1 text-xs hover:bg-muted rounded"
            onClick={() => onChange([])}
          >
            {allLabel}
          </button>
          <div className="my-1 border-t border-border" />
          {options.map((o) => (
            <label
              key={o}
              className="flex items-center gap-2 px-2 py-1 text-xs hover:bg-muted rounded cursor-pointer"
            >
              <input
                type="checkbox"
                checked={value.includes(o)}
                onChange={() => toggle(o)}
              />
              <span className="truncate">{o}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}