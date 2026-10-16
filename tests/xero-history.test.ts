import assert from 'node:assert/strict';
import test from 'node:test';
import { proposeMatches, validateReview } from '../proposals/xero-history/reconciliation.ts';
import { importBatch } from '../proposals/xero-history/pagination.ts';

// Synthetic identifiers are unit-test inputs only, never UI/import records.
test('all exact and ambiguous matches require review, including shared emails', () => {
  const contact = { id: 'source', tenantId: 'tenant', name: ' Person ', email: 'USER@EXAMPLE.TEST', isCustomer: true };
  const single = proposeMatches(contact, [{ id: 'a', name: 'person', email: 'user@example.test' }]);
  assert.equal(single.status, 'pending');
  assert.equal(single.flag, 'suggested_match');
  assert.deepEqual(single.candidates[0].reasons, ['Exact email', 'Exact name — verify identity']);
  assert.equal(proposeMatches(contact, [{ id: 'a', name: 'person' }, { id: 'b', name: 'other', email: contact.email }]).flag, 'ambiguous');
  assert.equal(proposeMatches(contact, []).flag, 'xero_only');
  assert.equal(proposeMatches({ ...contact, isCustomer: false }, []).flag, 'classify_contact');
  assert.equal(proposeMatches({ ...contact, name: '', email: '' }, [{ id: 'a', name: '', email: '' }]).candidates.length, 0);
});
test('phone comparison never infers country or strips country codes', () => {
  const contact = { id: 'source', tenantId: 'tenant', name: '', phone: '+1 (415) 555-0100', isCustomer: true };
  assert.equal(proposeMatches(contact, [{ id: 'a', name: '', phone: '4155550100' }]).flag, 'xero_only');
  assert.equal(proposeMatches(contact, [{ id: 'a', name: '', phone: '14155550100' }]).flag, 'suggested_match');
});
test('review rejects stale, cross-tenant, missing targets and repeat decisions', () => {
  const current = { tenantId: 't', contactId: 'c', sourceVersion: 'v', revision: 1, status: 'pending' };
  const submission = { ...current, expectedRevision: 1, decision: { action: 'link' as const, appId: 'a' } };
  const ids = new Set(['a']);
  assert.doesNotThrow(() => validateReview(submission, current, ids));
  assert.throws(() => validateReview({ ...submission, tenantId: 'other' }, current, ids));
  assert.throws(() => validateReview({ ...submission, expectedRevision: 0 }, current, ids));
  assert.throws(() => validateReview({ ...submission, sourceVersion: 'old' }, current, ids));
  assert.throws(() => validateReview(submission, current, new Set()));
  assert.throws(() => validateReview(submission, { ...current, status: 'created' }, ids));
  assert.throws(() => validateReview({ ...submission, decision: { action: 'exclude', reason: ' ' } }, current, ids));
});
test('import does not treat short pages as complete, and resumes from committed checkpoint', async () => {
  const pages: number[] = [];
  const committed: number[] = [];
  const adapter = {
    read: async (_resource: string, page: number) => { pages.push(page); return { records: page < 3 ? [{ ContactID: `id-${page}` }] : [] }; },
    commit: async (_resource: string, _records: unknown[], checkpoint: { nextPage: number }) => { committed.push(checkpoint.nextPage); },
  };
  const partial = await importBatch(adapter, 'Contacts', { nextPage: 1, complete: false }, 1);
  assert.deepEqual(partial, { nextPage: 2, complete: false });
  const final = await importBatch(adapter, 'Contacts', partial);
  assert.deepEqual(final, { nextPage: 4, complete: true });
  assert.deepEqual(pages, [1, 2, 3]);
  assert.deepEqual(committed, [2, 3, 4]);
  await importBatch(adapter, 'Contacts', final);
  assert.equal(pages.length, 3);
});
test('source or persistence failure never commits completion and malformed IDs fail closed', async () => {
  let commits = 0;
  await assert.rejects(importBatch({ read: async () => { throw new Error('429'); }, commit: async () => { commits++; } }, 'Invoices', { nextPage: 1, complete: false }));
  await assert.rejects(importBatch({ read: async () => ({ records: [{}] }), commit: async () => { commits++; } }, 'Invoices', { nextPage: 1, complete: false }));
  assert.equal(commits, 0);
  await assert.rejects(importBatch({ read: async () => ({ records: [] }), commit: async () => { throw new Error('DB failure'); } }, 'Invoices', { nextPage: 1, complete: false }));
});
