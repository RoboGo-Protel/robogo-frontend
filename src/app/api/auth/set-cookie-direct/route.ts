import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('=== Set Cookie Direct Called ===');

    const body = await request.json();
    const { token } = body;

    console.log('Token received:', !!token);

    if (token) {
      console.log('Setting robogo_token cookie directly');

      const response = NextResponse.json({
        success: true,
        message: 'Auth cookie set successfully',
      });

      response.cookies.set('robogo_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: '/',
      });

      console.log('Cookie set successfully via direct method');
      return response;
    } else {
      console.log('No token provided');
      return NextResponse.json(
        {
          success: false,
          message: 'No token provided',
        },
        { status: 400 },
      );
    }
  } catch (error) {
    console.error('Error setting auth cookie directly:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
      },
      { status: 500 },
    );
  }
}
