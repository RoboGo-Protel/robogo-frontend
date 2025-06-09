import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function POST() {
  console.log('=== Set Cookie API Called ===');
  
  try {
    // Get the session from NextAuth
    const session = await getServerSession(authOptions);
    console.log('Session data:', session);
    
    if (session?.accessToken) {
      console.log('Found accessToken in session, setting robogo_token cookie');
      
      const response = NextResponse.json({
        success: true,
        message: 'robogo_token cookie set successfully',
        hasToken: true,
      });
      
      // Set the robogo_token cookie
      response.cookies.set('robogo_token', session.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: '/',
      });
      
      console.log('robogo_token cookie set successfully');
      return response;
    } else {
      console.log('No accessToken found in session');
      return NextResponse.json({
        success: false,
        message: 'No accessToken found in session',
        hasToken: false,
      });
    }
  } catch (error) {
    console.error('Error in set cookie API:', error);
    return NextResponse.json({
      success: false,
      message: 'Error setting cookie',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
