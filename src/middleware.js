import { NextResponse } from 'next/server'

const ROLE_ALLOWED_PATHS = {
  admin:      ['/dashboard', '/dashboard/templates', '/dashboard/users', '/dashboard/settings'],
  fakultas:   ['/dashboard/fakultas', '/dashboard/settings/password'],
  sekretaris: ['/dashboard/sekretaris', '/dashboard/settings/password'],
  warek:      ['/dashboard/wakil-rektor', '/dashboard/settings/password'],
  rektor:     ['/dashboard/rektor', '/dashboard/settings/password'],
}

const PUBLIC_PATHS = ['/login', '/unauthorized', '/images', '/favicon']

export async function proxy(req) {
  const pathname = req.nextUrl.pathname

  if (PUBLIC_PATHS.some(p => pathname.startsWith(p)) || pathname === '/') {
    return NextResponse.next()
  }

  const role = req.cookies.get('user_role')?.value

  if (!role) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  const resolvedRole = Object.keys(ROLE_ALLOWED_PATHS).find(key =>
    key === role || (key === 'fakultas' && role.includes('fakultas'))
  )

  if (!resolvedRole) {
    return NextResponse.redirect(new URL('/unauthorized', req.url))
  }

  const allowedPaths = ROLE_ALLOWED_PATHS[resolvedRole]
  const isAllowed = allowedPaths.some(p => pathname.startsWith(p))

  if (!isAllowed) {
    return NextResponse.redirect(new URL('/unauthorized', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
}