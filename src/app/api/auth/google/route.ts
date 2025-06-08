import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, name, googleId, picture } = await request.json();

    console.log('Google auth request received:', {
      email,
      name,
      googleId,
      picture,
    });

    if (!email || !name || !googleId) {
      return NextResponse.json(
        { status: 'error', message: 'Missing required fields' },
        { status: 400 },
      );
    }
    const backendUrl =
      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
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
    console.log('Backend response:', data);
    if (!backendResponse.ok) {
      return NextResponse.json(
        { status: 'error', message: data.message || 'Authentication failed' },
        { status: backendResponse.status },
      );
    }

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

    return response;
  } catch (error) {
    console.error('Google auth error:', error);
    return NextResponse.json(
      { status: 'error', message: 'Internal server error' },
      { status: 500 },
    );
  }
}
