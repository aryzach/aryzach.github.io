const colors:Record<string,string>={
 'Available now':'border-emerald-200 bg-emerald-50 text-emerald-800',
 'Unavailable':'border-red-200 bg-red-50 text-red-800',
 'Warehouse':'border-slate-200 bg-slate-50 text-slate-800',
 'Reserved':'border-blue-200 bg-blue-50 text-blue-800',
 'In fleet':'border-emerald-200 bg-emerald-50 text-emerald-800',
 'Ready':'border-emerald-200 bg-emerald-50 text-emerald-800',
 'With customer':'border-blue-200 bg-blue-50 text-blue-800',
 'Incoming':'border-violet-200 bg-violet-50 text-violet-800',
 'Inbound':'border-violet-200 bg-violet-50 text-violet-800',
 'Needs inspection':'border-amber-200 bg-amber-50 text-amber-900',
 'Unassigned / location unknown':'border-amber-200 bg-amber-50 text-amber-900',
 'Maintenance':'border-rose-200 bg-rose-50 text-rose-800',
};
export default function SaunaStateBadge({value}:{value:string}){
 return <span className={`inline-flex max-w-full items-start gap-1.5 rounded-md border px-2 py-1 text-[11px] font-medium leading-4 ${(value.startsWith('Available on ')?'border-amber-200 bg-amber-50 text-amber-900':colors[value])||'border-slate-200 bg-slate-100 text-slate-700'}`}><span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-current"/>{value}</span>;
}
