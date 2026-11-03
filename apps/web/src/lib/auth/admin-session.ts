/**
 * Signed admin session cookie. Uses Web Crypto so it works in both API routes
 * and middleware. The secret lives only on the server (ADMIN_SESSION_SECRET).
 */

export const ADMIN_COOKIE = 'invoxa_admin_session';
export const ADMIN_SESSION_SECONDS = 8 * 60 * 60;

const encoder = new TextEncoder();

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
    'verify',
  ]);
}

export function getSessionSecret(): string | null {
  const secret = process.env.ADMIN_SESSION_SECRET || '';
  return secret.length >= 32 ? secret : null;
}

export async function createAdminSession(secret: string, now = Date.now()): Promise<string> {
  const payload = toBase64Url(
    encoder.encode(JSON.stringify({ role: 'super_admin', exp: now + ADMIN_SESSION_SECONDS * 1000 }))
  );
  const signature = await crypto.subtle.sign('HMAC', await hmacKey(secret), encoder.encode(payload));
  return `${payload}.${toBase64Url(new Uint8Array(signature))}`;
}

export async function isValidAdminSession(
  token: string | undefined,
  secret: string | null,
  now = Date.now()
): Promise<boolean> {
  if (!token || !secret) return false;
  const [payload, signature, extra] = token.split('.');
  if (!payload || !signature || extra !== undefined) return false;
  try {
    const valid = await crypto.subtle.verify(
      'HMAC',
      await hmacKey(secret),
      fromBase64Url(signature) as BufferSource,
      encoder.encode(payload)
    );
    if (!valid) return false;
    const data = JSON.parse(new TextDecoder().decode(fromBase64Url(payload)));
    return data.role === 'super_admin' && typeof data.exp === 'number' && data.exp > now;
  } catch {
    return false;
  }
}
