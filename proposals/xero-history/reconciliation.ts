/** Pure review logic. No network, storage or automatic approvals. */
export interface Identity {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
}
export interface XeroContact extends Identity {
  tenantId: string;
  isCustomer: boolean;
}
export interface Candidate {
  appId: string;
  reasons: string[];
}
export interface ReviewItem {
  tenantId: string;
  contactId: string;
  candidates: Candidate[];
  flag: 'suggested_match' | 'ambiguous' | 'xero_only' | 'classify_contact';
  status: 'pending';
}
const email = (value?: string | null) => (value ?? '').trim().toLowerCase();
const name = (value: string) => value.trim().replace(/\s+/g, ' ').toLowerCase();
// Keep country codes: do not infer countries or match by phone suffix.
const phone = (value?: string | null) => (value ?? '').replace(/[^0-9]/g, '');
export function proposeMatches(contact: XeroContact, app: Identity[]): ReviewItem {
  const candidates = app.flatMap(person => {
    const reasons: string[] = [];
    if (email(contact.email) && email(contact.email) === email(person.email)) reasons.push('Exact email');
    if (phone(contact.phone).length >= 10 && phone(contact.phone) === phone(person.phone)) reasons.push('Exact phone digits');
    if (name(contact.name) && name(contact.name) === name(person.name)) reasons.push('Exact name — verify identity');
    return reasons.length ? [{ appId: person.id, reasons }] : [];
  }).sort((a, b) => b.reasons.length - a.reasons.length || a.appId.localeCompare(b.appId));
  return {
    tenantId: contact.tenantId, contactId: contact.id, candidates, status: 'pending',
    flag: !contact.isCustomer ? 'classify_contact' : candidates.length > 1 ? 'ambiguous' : candidates.length ? 'suggested_match' : 'xero_only',
  };
}
export type Decision =
  | { action: 'link'; appId: string }
  | { action: 'create_customer' }
  | { action: 'exclude'; reason: string }
  | { action: 'defer'; reason: string };
export interface ReviewSubmission {
  tenantId: string;
  contactId: string;
  sourceVersion: string;
  expectedRevision: number;
  decision: Decision;
}
/** Validate before an atomic server-side decision transaction; never trust suggestions. */
export function validateReview(
  submission: ReviewSubmission,
  current: { tenantId: string; contactId: string; sourceVersion: string; revision: number; status: string },
  validAppIds: ReadonlySet<string>,
): void {
  if (submission.tenantId !== current.tenantId || submission.contactId !== current.contactId)
    throw new Error('Organization/contact mismatch');
  if (submission.sourceVersion !== current.sourceVersion || submission.expectedRevision !== current.revision)
    throw new Error('Review changed; reload before approving');
  if (current.status !== 'pending') throw new Error('Already reviewed; reopen explicitly');
  const decision = submission.decision;
  if (!decision || !['link', 'create_customer', 'exclude', 'defer'].includes(decision.action))
    throw new Error('Invalid review action');
  if (decision.action === 'link' && !validAppIds.has(decision.appId)) throw new Error('App customer does not exist');
  if ((decision.action === 'exclude' || decision.action === 'defer') && !decision.reason?.trim())
    throw new Error('A review reason is required');
}
