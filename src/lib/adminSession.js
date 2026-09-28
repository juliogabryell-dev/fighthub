// HMAC-signed admin_session cookie: `<json payload>.<hex signature>`
export const ADMIN_COOKIE = 'admin_session';
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 8; // seconds

const SECRET = process.env.ADMIN_SESSION_SECRET || '';

async function hmacHex(payload) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  return Array.from(new Uint8Array(signature)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function signAdminSession(admin) {
  if (!SECRET) throw new Error('ADMIN_SESSION_SECRET não configurado');
  const payload = JSON.stringify({ id: admin.id, name: admin.name, email: admin.email || '', iat: Date.now() });
  return `${payload}.${await hmacHex(payload)}`;
}

// Returns the admin payload ({ id, name, email, iat }) or null
export async function verifyAdminSession(request) {
  const token = request.cookies.get(ADMIN_COOKIE)?.value;
  if (!token || !SECRET) return null;
  const lastDot = token.lastIndexOf('.');
  if (lastDot === -1) return null;
  const payload = token.substring(0, lastDot);
  if (!safeEqual(await hmacHex(payload), token.substring(lastDot + 1))) return null;
  try {
    const admin = JSON.parse(payload);
    if (!admin.iat || Date.now() - admin.iat > ADMIN_SESSION_MAX_AGE * 1000) return null;
    return admin;
  } catch {
    return null;
  }
}
