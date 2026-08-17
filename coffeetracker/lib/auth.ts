// Sesión de admin con cookie firmada (HMAC-SHA256 vía Web Crypto, compatible con Edge).
// Se usa ADMIN_PASSWORD como secreto de firma para no requerir otra variable.

export const SESSION_COOKIE = 'admin_session'
export const SESSION_MAX_AGE_SECONDS = 12 * 60 * 60 // 12 horas

const enc = new TextEncoder()

async function hmac(data: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data))
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function createSessionToken(secret: string): Promise<string> {
  const exp = Date.now() + SESSION_MAX_AGE_SECONDS * 1000
  return `${exp}.${await hmac(`admin:${exp}`, secret)}`
}

export async function verifySessionToken(
  token: string | undefined,
  secret: string
): Promise<boolean> {
  if (!token) return false
  const dot = token.indexOf('.')
  if (dot < 0) return false
  const exp = token.slice(0, dot)
  if (!/^\d+$/.test(exp) || Number(exp) < Date.now()) return false
  const expected = await hmac(`admin:${exp}`, secret)
  const given = token.slice(dot + 1)
  if (given.length !== expected.length) return false
  let diff = 0
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ given.charCodeAt(i)
  }
  return diff === 0
}
