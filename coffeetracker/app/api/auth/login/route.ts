import { NextResponse } from 'next/server'
import { createSessionToken, SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from '@/lib/auth'

export async function POST(request: Request) {
  const password = process.env.ADMIN_PASSWORD
  if (!password) {
    // Sin ADMIN_PASSWORD configurada el admin está abierto; el login no aplica.
    return NextResponse.json({ ok: true })
  }

  const body = await request.json().catch(() => null)
  if (!body || typeof body.password !== 'string' || body.password !== password) {
    return NextResponse.json({ error: 'Incorrect password' }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set(SESSION_COOKIE, await createSessionToken(password), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  })
  return res
}
