import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protected routes
  if (
    !user &&
    (request.nextUrl.pathname.startsWith('/dashboard') ||
      request.nextUrl.pathname.startsWith('/prospects') ||
      request.nextUrl.pathname.startsWith('/settings'))
  ) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // 🆕 CHECK PROFIL COMPLET : Vérifier si l'utilisateur connecté a un profil complet
  if (user &&
      user.email_confirmed_at &&
      !request.nextUrl.pathname.startsWith('/complete-registration') &&
      !request.nextUrl.pathname.startsWith('/api') &&
      !request.nextUrl.pathname.startsWith('/auth') &&
      !request.nextUrl.pathname.startsWith('/_next') &&
      request.nextUrl.pathname !== '/' &&
      request.nextUrl.pathname !== '/login' &&
      request.nextUrl.pathname !== '/register'
  ) {
    // Vérifier si l'utilisateur a un profil dans la DB
    try {
      const { data: userProfile } = await supabase
        .from('users')
        .select('id, organization_id')
        .eq('auth_id', user.id)
        .single();

      // Si pas de profil ou pas d'organisation, rediriger vers complete-registration
      if (!userProfile || !userProfile.organization_id) {
        const url = request.nextUrl.clone();
        url.pathname = '/complete-registration';
        console.log(`🔧 [Middleware] Redirection ${user.email} vers /complete-registration (profil incomplet)`);
        return NextResponse.redirect(url);
      }
    } catch (error) {
      // En cas d'erreur DB, rediriger aussi vers complete-registration
      const url = request.nextUrl.clone();
      url.pathname = '/complete-registration';
      console.log(`🔧 [Middleware] Redirection ${user.email} vers /complete-registration (erreur DB)`);
      return NextResponse.redirect(url);
    }
  }

  // Redirect logged in users away from auth pages
  if (
    user &&
    (request.nextUrl.pathname === '/login' ||
      request.nextUrl.pathname === '/register')
  ) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
