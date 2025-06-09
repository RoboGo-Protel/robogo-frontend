import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  console.log('Middleware triggered at path:', path);

  // Skip middleware for API routes, auth routes, and static files
  if (
    path.startsWith('/api/') ||
    path.startsWith('/auth/') ||
    path.startsWith('/_next/') ||
    path.startsWith('/favicon.ico') ||
    path === '/login' ||
    path === '/register' ||
    path === '/forgot-password' ||
    path === '/reset-password'
  ) {
    return NextResponse.next();
  }
  // Check for robogo_token (existing auth system)
  const robogoToken = req.cookies.get('robogo_token')?.value;

  console.log('Robogo token:', robogoToken ? 'Present' : 'Missing');

  const protectedPaths = [
    '/',
    '/monitoring',
    '/reports',
    '/onboarding',
    '/profile',
    '/settings',
  ];
  const isProtectedPath = protectedPaths.some((p) => path.startsWith(p));
  if (isProtectedPath) {
    // If we have a valid robogo_token, allow access
    if (robogoToken && robogoToken.trim() !== '') {
      console.log('Access granted with robogo_token');
      return NextResponse.next();
    }

    // No valid authentication, redirect to login
    console.log('Redirecting to login - no valid authentication found');
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', path);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/monitoring/:path*", "/reports/:path*"],
};
