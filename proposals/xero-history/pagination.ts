/** Proposed resumable importer core. No production caller or storage adapter is installed. */
export const resources = ['Contacts', 'Invoices', 'CreditNotes', 'Payments'] as const;
export type Resource = typeof resources[number];
export interface Page { records: Record<string, unknown>[]; }
export interface Checkpoint { nextPage: number; complete: boolean; }
export interface ImportAdapter {
  // Implementation must use existing activeToken and fixed GET-only Xero endpoints.
  read(resource: Resource, page: number): Promise<Page>;
  // Atomically upsert by tenant/resource/source ID and advance checkpoint AFTER successful persistence.
  commit(resource: Resource, records: Record<string, unknown>[], checkpoint: Checkpoint): Promise<void>;
}
const idFields: Record<Resource, string> = {
  Contacts: 'ContactID', Invoices: 'InvoiceID', CreditNotes: 'CreditNoteID', Payments: 'PaymentID',
};
export async function importBatch(
  adapter: ImportAdapter, resource: Resource, checkpoint: Checkpoint, pageBudget = 5,
): Promise<Checkpoint> {
  if (!resources.includes(resource) || !Number.isInteger(checkpoint.nextPage) || checkpoint.nextPage < 1 ||
      !Number.isInteger(pageBudget) || pageBudget < 1 || pageBudget > 20)
    throw new Error('Invalid import checkpoint/budget');
  if (checkpoint.complete) return checkpoint;
  let result = checkpoint;
  for (let i = 0; i < pageBudget; i++) {
    const page = await adapter.read(resource, result.nextPage);
    if (!Array.isArray(page.records) || page.records.some(record =>
      !record || typeof record !== 'object' || typeof record[idFields[resource]] !== 'string' || !record[idFields[resource]]))
      throw new Error('Invalid source page; checkpoint unchanged');
    // An empty terminal page is required. A short page alone never proves completion.
    const next = { nextPage: result.nextPage + 1, complete: page.records.length === 0 };
    await adapter.commit(resource, page.records, next);
    result = next;
    if (result.complete) break;
  }
  return result;
}
