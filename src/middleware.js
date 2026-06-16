import { NextResponse } from 'next/server'

const ROLE_ALLOWED_PATHS = {
  admin:      ['/dashboard', '/dashboard/templates', '/dashboard/users', '/dashboard/settings', '/dashboard/arsip'],
  fakultas:   ['/dashboard/fakultas', '/dashboard/settings/password', '/dashboard/fakultas/arsip'],
  sekretaris: ['/dashboard/sekretaris', '/dashboard/settings/password', ],
  warek:      ['/dashboard/wakil-rektor', '/dashboard/settings/password', ],
  rektor:     ['/dashboard/rektor', '/dashboard/settings/password', ],
}

const ALL_KNOWN_PATHS = [
  '/dashboard', '/dashboard/templates', '/dashboard/users', '/dashboard/settings',
  '/dashboard/fakultas', '/dashboard/settings/password',
  '/dashboard/sekretaris', '/dashboard/wakil-rektor', '/dashboard/rektor',
  '/dashboard/arsip',
]

const PUBLIC_PATHS = ['/login', '/unauthorized', '/images', '/favicon', '/Vidios']

export async function middleware(req) {
  const pathname = req.nextUrl.pathname

  if (PUBLIC_PATHS.some(p => pathname.startsWith(p)) || pathname === '/') {
    return NextResponse.next()
  }

  // Kalau route ga dikenal sama sekali → biarkan Next.js render 404
  const isKnownPath = ALL_KNOWN_PATHS.some(p => pathname.startsWith(p))
  if (!isKnownPath) return NextResponse.next()

  const role = req.cookies.get('user_role')?.value
  if (!role) return NextResponse.redirect(new URL('/login', req.url))

  const resolvedRole = Object.keys(ROLE_ALLOWED_PATHS).find(key =>
    key === role || (key === 'fakultas' && role.includes('fakultas'))
  )
  if (!resolvedRole) return NextResponse.redirect(new URL('/unauthorized', req.url))

  const allowedPaths = ROLE_ALLOWED_PATHS[resolvedRole]

  const isAllowed = resolvedRole === 'admin'
    ? allowedPaths.some(p =>
        p === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(p)
      )
    : allowedPaths.some(p => pathname.startsWith(p))

  if (!isAllowed) return NextResponse.redirect(new URL('/unauthorized', req.url))
  return NextResponse.next()
}

export const runtime = 'nodejs'

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
}