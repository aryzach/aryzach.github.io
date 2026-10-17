import { buildSignedContractPdf, sha256Hex } from './pdfBuilder.ts';
import { PDFDocument } from 'https://esm.sh/pdf-lib@1.17.1';
Deno.test('PDF hash includes exactly the supplied view bytes', async () => {
  const input = new Uint8Array([0, 97, 98, 99, 255]);
  const expected = 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad';
  if (await sha256Hex(input.subarray(1, 4)) !== expected) throw new Error('SHA-256 subarray bytes changed');
  if (await sha256Hex(new Uint8Array([97, 98, 99])) !== expected) throw new Error('SHA-256 bytes changed');
});

Deno.test('PDF builder merges synthetic summary/audit with every master page', async () => {
  // This is an in-memory rendering fixture, not a signature or real agreement.
  const master = await PDFDocument.create();
  master.addPage([612, 792]).drawText('ISOLATED TEST MASTER PAGE ONE - NOT AN AGREEMENT');
  master.addPage([612, 792]).drawText('ISOLATED TEST MASTER PAGE TWO - NOT AN AGREEMENT');
  const bytes = await buildSignedContractPdf({
    summary: {
      reservation_id: 'fixture-reservation', agreement_version: 'TEST ONLY',
      customer_legal_name: 'SYNTHETIC PDF FIXTURE', phone: null,
      email: 'fixture@example.invalid', installation_address: 'TEST ONLY - NO DELIVERY',
      sauna_type: 'Indoor Traditional', placement: 'indoor', commitment_months: 3,
      monthly_price: 123, installation_fee: 0, delivery_fee: 0, security_deposit: 456,
      insurance_selected: false, insurance_monthly_price: 0, second_heater_selected: false,
      second_heater_monthly_price: 0, stair_elevator_charge: null,
      preferred_installation_date: '2030-01-16',
    },
    audit: {
      typed_legal_name: 'SYNTHETIC PDF FIXTURE', signed_at: '2030-01-01T00:00:00Z',
      time_zone: 'America/Los_Angeles', ip_address: null, user_agent: 'isolated-unit-test',
      agreement_version: 'TEST ONLY', reservation_id: 'fixture-reservation', contract_id: 'fixture-contract',
      acknowledgments: [{ key: 'fixture', text: 'Synthetic rendering fixture only', accepted_at: '2030-01-01T00:00:00Z' }],
      electronic_consent_confirmed: false,
    },
    masterAgreementPdfBytes: await master.save(),
  });
  const merged = await PDFDocument.load(bytes);
  if (merged.getPageCount() < 4) throw new Error('Summary, audit or master pages were omitted');
  const pages = merged.getPages();
  for (const page of pages) {
    if (page.getWidth() !== 612 || page.getHeight() !== 792) throw new Error('PDF page size changed');
  }
  if (!/^[0-9a-f]{64}$/.test(await sha256Hex(bytes))) throw new Error('PDF hash unavailable');
});
