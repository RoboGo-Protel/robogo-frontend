import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, name, googleId, picture } = await request.json();

    console.log('=== Google Auth API Called ===');
    console.log('Request data:', { email, name, googleId, picture: !!picture });

    if (!email || !name || !googleId) {
      console.log('Missing required fields');
      return NextResponse.json(
        { status: 'error', message: 'Missing required fields' },
        { status: 400 },
      );
    }

    const backendUrl =
      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    console.log('Backend URL:', backendUrl);
    console.log('Forwarding to backend:', `${backendUrl}/auth/google`);

    const backendResponse = await fetch(`${backendUrl}/auth/google`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        name,
        googleId,
        picture,
      }),
    });

    const data = await backendResponse.json();
    console.log('Backend response status:', backendResponse.status);
    console.log('Backend response data:', data);

    if (!backendResponse.ok) {
      console.log('Backend authentication failed');
      return NextResponse.json(
        { status: 'error', message: data.message || 'Authentication failed' },
        { status: backendResponse.status },
      );
    }

    console.log('Backend authentication successful, setting cookie');
    const response = NextResponse.json({
      status: 'success',
      message: 'Google authentication successful',
      token: data.token,
      user: data.user,
    });

    response.cookies.set('robogo_token', data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
    });

    console.log('Cookie set successfully');
    return response;
  } catch (error) {
    console.error('Google auth error:', error);
    return NextResponse.json(
      { status: 'error', message: 'Internal server error' },
      { status: 500 },
    );
  }
}
