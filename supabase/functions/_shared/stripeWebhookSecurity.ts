/** Verify the original Stripe request bytes, including its signed delivery time. */
export async function verifyStripeSignature(payload: string, header: string | null,
  secret: string | undefined, nowSeconds = Date.now() / 1000): Promise<boolean> {
  if (!secret || !header || header.length > 8192 || !Number.isFinite(nowSeconds)) return false;
  const parts = header.split(',').map(part => part.trim().split('='));
  const timestamps = parts.filter(part => part[0] === 't').map(part => part[1]);
  if (timestamps.length !== 1 || !/^\d+$/.test(timestamps[0] || '')) return false;
  const timestamp = Number(timestamps[0]);
  if (!Number.isSafeInteger(timestamp) || timestamp <= 0 || Math.abs(nowSeconds - timestamp) > 300) return false;
  const candidates = parts.filter(part => part[0] === 'v1' && /^[a-f0-9]{64}$/i.test(part[1] || ''))
    .map(part => part[1].toLowerCase());
  if (!candidates.length) return false;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = new Uint8Array(await crypto.subtle.sign('HMAC', key,
    enc.encode(`${timestamps[0]}.${payload}`)));
  const expected = Array.from(signature, byte => byte.toString(16).padStart(2, '0')).join('');
  let matches = false;
  for (const candidate of candidates) {
    let difference = 0;
    for (let i = 0; i < expected.length; i++) difference |= candidate.charCodeAt(i) ^ expected.charCodeAt(i);
    matches = matches || difference === 0;
  }
  return matches;
}
