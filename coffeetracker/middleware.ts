import { NextRequest, NextResponse } from 'next/server'

// Protege /admin y /api/admin con Basic Auth.
// Si ADMIN_PASSWORD no está definida, el acceso queda abierto (útil en dev).
export function middleware(req: NextRequest) {
  const password = process.env.ADMIN_PASSWORD
  if (!password) return NextResponse.next()

  const auth = req.headers.get('authorization')
  if (auth?.startsWith('Basic ')) {
    const decoded = atob(auth.slice(6))
    const pass = decoded.slice(decoded.indexOf(':') + 1)
    if (pass === password) return NextResponse.next()
  }

  return new NextResponse('Autenticación requerida', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="CoffeTracker Admin"' },
  })
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}
