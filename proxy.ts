import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Public routes — tidak butuh login
  const publicRoutes = ['/login', '/auth/callback']
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    // Jika sudah login, redirect ke dashboard
    if (user) {
      // Ambil profile untuk tahu role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile) {
        const roleRoute = getRoleRoute(profile.role)
        return NextResponse.redirect(new URL(roleRoute, request.url))
      }
    }
    return supabaseResponse
  }

  // Protected routes — butuh login
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Role-based route protection
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const role = profile.role

  // Redirect root ke dashboard sesuai role
  if (pathname === '/') {
    return NextResponse.redirect(new URL(getRoleRoute(role), request.url))
  }

  // Cegah akses ke route role lain
  if (pathname.startsWith('/admin') && role !== 'admin_kelurahan') {
    return NextResponse.redirect(new URL(getRoleRoute(role), request.url))
  }

  if (pathname.startsWith('/rw') && role !== 'ketua_rw') {
    return NextResponse.redirect(new URL(getRoleRoute(role), request.url))
  }

  if (pathname.startsWith('/rt') && role !== 'ketua_rt') {
    return NextResponse.redirect(new URL(getRoleRoute(role), request.url))
  }

  return supabaseResponse
}

function getRoleRoute(role: string): string {
  switch (role) {
    case 'admin_kelurahan':
      return '/admin'
    case 'ketua_rw':
      return '/rw'
    case 'ketua_rt':
      return '/rt'
    default:
      return '/login'
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/auth (auth callbacks)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/auth).*)',
  ],
}
