import { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { SaunaAsset } from '@/lib/rentalModel';

function bookingSaunaLabel(asset: SaunaAsset) {
  return `#${asset.code} · ${asset.typeName || asset.model || 'Type unknown'} · ${asset.model || 'Model unknown'} · ${asset.sourceStatus || 'Status unknown'} · Current customer: ${asset.currentCustomerName || 'None'}`;
}

export default function BookingSaunaPicker({ assets, defaultValue }: { assets: SaunaAsset[]; defaultValue: string | null }) {
  const [value, setValue] = useState(defaultValue || '');
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const options = assets.filter(a => a.code && !a.retired && a.sourceStatus !== 'Sold')
    .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }) || a.id.localeCompare(b.id));
  const selected = assets.find(a => a.id === value);
  const visible = options.filter(a => bookingSaunaLabel(a).toLowerCase().includes(query.trim().toLowerCase()));
  return <div className="min-w-0">
    <input type="hidden" name="assetId" value={value} />
    <Popover open={open} onOpenChange={next => { setOpen(next); if (next) setQuery(''); }}>
      <PopoverTrigger asChild><Button type="button" role="combobox" aria-label="Numbered sauna" aria-expanded={open} variant="outline" className="h-auto min-h-9 w-full justify-between whitespace-normal text-left font-normal">
        <span>{selected ? bookingSaunaLabel(selected) : 'Choose numbered sauna'}</span><ChevronsUpDown className="ml-2 h-4 w-4 shrink-0" />
      </Button></PopoverTrigger>
      <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command shouldFilter={false}>
          <CommandInput aria-label="Search numbered saunas" placeholder="Search number, type, model, status or customer…" value={query} onValueChange={setQuery} />
          <p className="border-b px-3 py-2 text-xs text-muted-foreground">Exact text matches anywhere in the label · {visible.length} saunas · number order</p>
          <CommandList><CommandEmpty>No saunas contain that text.</CommandEmpty><CommandGroup>
            {visible.map(a => <CommandItem key={a.id} value={a.id} onSelect={() => { setValue(a.id); setOpen(false); }}>
              <Check className={`mr-2 h-4 w-4 shrink-0 ${value === a.id ? 'opacity-100' : 'opacity-0'}`} />
              <span>{bookingSaunaLabel(a)}</span>
            </CommandItem>)}
          </CommandGroup></CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  </div>;
}
