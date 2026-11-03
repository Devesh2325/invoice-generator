/**
 * Salted PBKDF2 hashing for the passwords this app keeps in browser storage.
 * This keeps passwords from being stored as readable text. It does not replace
 * server-side accounts: anyone with access to the browser can still alter local data.
 */

const ITERATIONS = 210_000;
const PREFIX = 'pbkdf2';

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function fromHex(hex: string): Uint8Array {
  return Uint8Array.from(hex.match(/.{2}/g) || [], (h) => parseInt(h, 16));
}

async function derive(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, [
    'deriveBits',
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: salt as BufferSource, iterations },
    key,
    256
  );
  return new Uint8Array(bits);
}

export function isHashedPassword(stored: string): boolean {
  return stored.startsWith(`${PREFIX}$`);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derive(password, salt, ITERATIONS);
  return `${PREFIX}$${ITERATIONS}$${toHex(salt)}$${toHex(hash)}`;
}

/** Also accepts older plain-text values, so existing accounts can sign in and be upgraded. */
export async function verifyPassword(stored: string, password: string): Promise<boolean> {
  if (!stored) return false;
  if (!isHashedPassword(stored)) return stored === password;

  const [, iterations, salt, expected] = stored.split('$');
  const actual = toHex(await derive(password, fromHex(salt), Number(iterations)));
  if (actual.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < actual.length; i++) {
    diff |= actual.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}
