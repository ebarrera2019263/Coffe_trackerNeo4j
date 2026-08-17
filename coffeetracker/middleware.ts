import { NextRequest, NextResponse } from 'next/server'
import { verifySessionToken, SESSION_COOKIE } from '@/lib/auth'

// Protege /admin y /api/admin con una cookie de sesión firmada (ver /login).
// Si ADMIN_PASSWORD no está definida, el acceso queda abierto (útil en dev).
export async function middleware(req: NextRequest) {
  const password = process.env.ADMIN_PASSWORD
  if (!password) return NextResponse.next()

  const token = req.cookies.get(SESSION_COOKIE)?.value
  if (await verifySessionToken(token, password)) return NextResponse.next()

  if (req.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const url = req.nextUrl.clone()
  url.pathname = '/login'
  url.search = ''
  url.searchParams.set('from', req.nextUrl.pathname)
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}
