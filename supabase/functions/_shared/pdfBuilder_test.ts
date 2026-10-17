import { sha256Hex } from './pdfBuilder.ts';
Deno.test('PDF hash includes exactly the supplied view bytes', async () => {
  const input = new Uint8Array([0, 97, 98, 99, 255]);
  const expected = 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad';
  if (await sha256Hex(input.subarray(1, 4)) !== expected) throw new Error('SHA-256 subarray bytes changed');
  if (await sha256Hex(new Uint8Array([97, 98, 99])) !== expected) throw new Error('SHA-256 bytes changed');
});
