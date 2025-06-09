import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  console.log('=== Google Success Callback ===');
  
  try {
    // Get the session from NextAuth
    const session = await getServerSession(authOptions);
    console.log('Session data:', session);
    
    if (session?.accessToken) {
      console.log('Found accessToken in session, setting robogo_token cookie');
      
      const url = new URL(request.url);
      const callbackUrl = url.searchParams.get('callbackUrl') || '/';
      
      const response = NextResponse.redirect(new URL(callbackUrl, request.url));
      
      // Set the robogo_token cookie
      response.cookies.set('robogo_token', session.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: '/',
      });
      
      console.log('robogo_token cookie set, redirecting to:', callbackUrl);
      return response;
    } else {
      console.log('No accessToken found in session, redirecting to login');
      return NextResponse.redirect(new URL('/login?error=NoAccessToken', request.url));
    }
  } catch (error) {
    console.error('Error in Google success callback:', error);
    return NextResponse.redirect(new URL('/login?error=CallbackError', request.url));
  }
}
