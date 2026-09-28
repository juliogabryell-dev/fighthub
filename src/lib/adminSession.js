// Verifies the HMAC-signed admin_session cookie (same format as /api/fulladmin/session).
const SECRET = process.env.ADMIN_SESSION_SECRET || '';
const MAX_AGE_MS = 8 * 60 * 60 * 1000;

async function sign(payload) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  return Array.from(new Uint8Array(signature)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyAdminSession(request) {
  const token = request.cookies.get('admin_session')?.value;
  if (!token || !SECRET) return null;
  const lastDot = token.lastIndexOf('.');
  if (lastDot === -1) return null;
  const payload = token.substring(0, lastDot);
  if ((await sign(payload)) !== token.substring(lastDot + 1)) return null;
  try {
    const admin = JSON.parse(payload);
    if (admin.iat && Date.now() - admin.iat > MAX_AGE_MS) return null;
    return admin;
  } catch {
    return null;
  }
}
