export interface XeroCashRecord {
  id: string; contactId: string; date: string; type: string; status: string; currency: string;
  amount: string; reference: string; description: string; accountNames: string[];
  lines?: {description:string;accountCode:string;accountName:string;amount:string;taxAmount:string}[];
}
export interface XeroHistoryContact { contactId: string; name: string; customerId: string | null; pendingMatches: string[]; reviewState: string; snapshotAt: string; }
export interface XeroHistoryResult { contacts: XeroHistoryContact[]; transactions?: XeroCashRecord[]; coverage?: { terminalPageReached: boolean; note: string; snapshotAt?: string }; }
export type HistorySelection = { customerId?: string; contactId?: string };
export function xeroDate(value: unknown): string {
  if (typeof value !== 'string') throw new Error('Missing Xero date');
  const iso=value.match(/^\d{4}-\d{2}-\d{2}/)?.[0];
  if(iso && Number.isFinite(Date.parse(iso)) && new Date(iso).toISOString().slice(0,10)===iso) return iso;
  const match=value.match(/^\/Date\((-?\d+)(?:[+-]\d{4})?\)\/$/);
  if(!match || !Number.isFinite(Number(match[1]))) throw new Error('Invalid Xero date');
  return new Date(Number(match[1])).toISOString().slice(0,10);
}
export function displayCashAmount(amount: string, currency: string): string {
  const value=Number(amount);
  return Number.isFinite(value) && /^[A-Z]{3}$/.test(currency) ? new Intl.NumberFormat('en-US',{style:'currency',currency}).format(value) : `${amount} ${currency}`;
}
