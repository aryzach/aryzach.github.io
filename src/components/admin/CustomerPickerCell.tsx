import { useMemo, useState } from "react";
import { Check, ChevronsUpDown, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

export interface CustomerOption {
  id: string;
  name: string;
  email: string | null;
}

interface Props {
  value: string | null; // customer id
  customers: CustomerOption[];
  // Customer ids already assigned to another row (for this field). Used to
  // hide them from the dropdown so a customer can't be picked twice.
  disabledIds?: Set<string>;
  placeholder?: string;
  onChange: (customerId: string | null) => void | Promise<void>;
}

export function CustomerPickerCell({ value, customers, disabledIds, placeholder = "", onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const current = useMemo(() => customers.find((c) => c.id === value) || null, [customers, value]);
  const visible = useMemo(() => {
    return customers.filter((c) => c.id === value || !disabledIds?.has(c.id));
  }, [customers, disabledIds, value]);

  const label = current?.name || (value ? "(unknown)" : "");

  return (
    <div className="flex items-center gap-1">
      <Popover open={open} onOpenChange={(o) => { setOpen(o); }}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex-1 min-w-0 text-left h-7 px-2 text-xs border border-transparent hover:border-border rounded-sm truncate"
          >
            {label || <span className="text-muted-foreground">{placeholder}</span>}
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-64 p-0">
          <Command>
              <CommandInput placeholder="Search customers…" />
              <CommandList>
                <CommandEmpty>No customer found.</CommandEmpty>
                <CommandGroup>
                  {visible.map((c) => (
                    <CommandItem
                      key={c.id}
                      value={`${c.name} ${c.email ?? ""}`}
                      onSelect={async () => {
                        setBusy(true);
                        try { await onChange(c.id); setOpen(false); } finally { setBusy(false); }
                      }}
                    >
                      <Check className={`mr-2 h-3 w-3 ${value === c.id ? "opacity-100" : "opacity-0"}`} />
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs truncate">{c.name}</span>
                        {c.email && <span className="text-[10px] text-muted-foreground truncate">{c.email}</span>}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
              <div className="border-t p-1 flex gap-1">
                {value && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs"
                    disabled={busy}
                    onClick={async () => {
                      setBusy(true);
                      try { await onChange(null); setOpen(false); } finally { setBusy(false); }
                    }}
                  >
                    Clear
                  </Button>
                )}
              </div>
          </Command>
        </PopoverContent>
      </Popover>
      {value && !open && (
        <button
          type="button"
          aria-label="Clear"
          className="text-muted-foreground hover:text-foreground p-0.5"
          onClick={async (e) => { e.stopPropagation(); await onChange(null); }}
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}