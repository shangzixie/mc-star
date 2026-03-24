import { betterFetch } from '@better-fetch/fetch';
import createMiddleware from 'next-intl/middleware';
import { type NextRequest, NextResponse } from 'next/server';
import {
  DEFAULT_LOCALE,
  LOCALES,
  LOCALE_COOKIE_NAME,
  routing,
} from './i18n/routing';
import type { Session } from './lib/auth-types';
import {
  DEFAULT_LOGIN_REDIRECT,
  adminOnlyRoutes,
  protectedRoutes,
  routesNotAllowedByLoggedInUsers,
} from './routes';

const intlMiddleware = createMiddleware(routing);

/**
 * 1. Next.js middleware
 * https://nextjs.org/docs/app/building-your-application/routing/middleware
 *
 * 2. Better Auth middleware
 * https://www.better-auth.com/docs/integrations/next#middleware
 *
 * In Next.js middleware, it's recommended to only check for the existence of a session cookie
 * to handle redirection. To avoid blocking requests by making API or database calls.
 */
export default async function middleware(req: NextRequest) {
  const { nextUrl } = req;

  // Handle internal docs link redirection for internationalization
  // Check if this is a docs page without locale prefix
  if (nextUrl.pathname.startsWith('/docs/') || nextUrl.pathname === '/docs') {
    // Get the user's preferred locale from cookie
    const localeCookie = req.cookies.get(LOCALE_COOKIE_NAME);
    const preferredLocale = localeCookie?.value;

    // If user has a non-default locale preference, redirect to localized version
    if (
      preferredLocale &&
      preferredLocale !== DEFAULT_LOCALE &&
      LOCALES.includes(preferredLocale)
    ) {
      const localizedPath = `/${preferredLocale}${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`;
      return NextResponse.redirect(new URL(localizedPath, nextUrl));
    }
  }

  const hasSessionCookie = req.cookies.getAll().some(({ name }) => {
    return (
      name === 'better-auth.session_token' ||
      name === '__Secure-better-auth.session_token' ||
      (name.includes('better-auth') && name.includes('session_token'))
    );
  });

  // Get the pathname of the request (e.g. /zh/dashboard to /dashboard)
  const pathnameWithoutLocale = getPathnameWithoutLocale(
    nextUrl.pathname,
    LOCALES
  );

  // If the route can not be accessed by logged in users, redirect if the user is logged in
  if (hasSessionCookie) {
    const isNotAllowedRoute = routesNotAllowedByLoggedInUsers.some((route) =>
      new RegExp(`^${route}$`).test(pathnameWithoutLocale)
    );
    if (isNotAllowedRoute) {
      return NextResponse.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
    }
  }

  // Treat protected routes as prefixes so nested pages (e.g. /freight/shipments/123)
  // stay protected without needing to list every sub-route.
  const isProtectedRoute = protectedRoutes.some(
    (route) =>
      pathnameWithoutLocale === route ||
      pathnameWithoutLocale.startsWith(`${route}/`)
  );

  // If the route is a protected route, redirect to login if user is not logged in
  if (!hasSessionCookie && isProtectedRoute) {
    let callbackUrl = nextUrl.pathname;
    if (nextUrl.search) {
      callbackUrl += nextUrl.search;
    }
    const encodedCallbackUrl = encodeURIComponent(callbackUrl);
    return NextResponse.redirect(
      new URL(`/auth/login?callbackUrl=${encodedCallbackUrl}`, nextUrl)
    );
  }

  // Check if the route is admin-only
  const isAdminRoute = adminOnlyRoutes.some(
    (route) =>
      pathnameWithoutLocale === route ||
      pathnameWithoutLocale.startsWith(`${route}/`)
  );

  // If the route is admin-only, check if user has admin role
  if (hasSessionCookie && isAdminRoute) {
    // Only admin routes need role inspection; avoid session fetch on normal navigation.
    const sessionUrl = new URL('/api/auth/get-session', req.url);
    const { data: session } = await betterFetch<Session>(
      sessionUrl.toString(),
      {
        headers: {
          cookie: req.headers.get('cookie') || '',
        },
      }
    );

    if (!session) {
      let callbackUrl = nextUrl.pathname;
      if (nextUrl.search) {
        callbackUrl += nextUrl.search;
      }
      const encodedCallbackUrl = encodeURIComponent(callbackUrl);
      return NextResponse.redirect(
        new URL(`/auth/login?callbackUrl=${encodedCallbackUrl}`, nextUrl)
      );
    }

    const userRole = session?.user?.role;
    if (userRole !== 'admin') {
      return NextResponse.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
    }
  }

  // Apply intlMiddleware for all routes
  return intlMiddleware(req);
}

/**
 * Get the pathname of the request (e.g. /zh/dashboard to /dashboard)
 */
function getPathnameWithoutLocale(pathname: string, locales: string[]): string {
  const localePattern = new RegExp(`^/(${locales.join('|')})/`);
  return pathname.replace(localePattern, '/');
}

/**
 * Next.js internationalized routing
 * specify the routes the middleware applies to
 *
 * https://next-intl.dev/docs/routing#base-path
 */
export const config = {
  // The `matcher` is relative to the `basePath`
  matcher: [
    // Match all pathnames except for
    // - if they start with `/api`, `/_next`, `/__nextjs` or `/_vercel`
    // - if they contain a dot (e.g. `favicon.ico`)
    '/((?!api|_next|__nextjs|_vercel|.*\\..*).*)',
  ],
};
