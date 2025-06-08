import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    console.log('Auth callback triggered');

    const session = await getServerSession(authOptions);
    console.log('Session in callback:', session);

    if (session?.accessToken) {
      console.log('Setting robogo_token cookie from session');

      const response = NextResponse.redirect(new URL('/', request.url));

      response.cookies.set('robogo_token', session.accessToken as string, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60,
        path: '/',
      });

      console.log('Redirecting to home with robogo_token cookie set');
      return response;
    }

    console.log('No session or access token, redirecting to login');
    return NextResponse.redirect(new URL('/login', request.url));
  } catch (error) {
    console.error('Auth callback error:', error);
    return NextResponse.redirect(
      new URL('/login?error=callback_error', request.url),
    );
  }
}
