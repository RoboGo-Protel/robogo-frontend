import { NextResponse } from 'next/server';

export async function POST() {
  try {
    console.log('=== Test Complete Auth Flow ===');

    // Simulate successful Google auth
    const mockUserData = {
      email: 'test@example.com',
      name: 'Test User',
      googleId: '123456789',
      picture: 'https://example.com/avatar.jpg',
    };

    console.log('Simulating backend auth call...');

    // Call our backend Google auth endpoint
    const backendResponse = await fetch(
      'http://localhost:4000/api/v1/auth/google',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mockUserData),
      },
    );

    console.log('Backend response status:', backendResponse.status);

    if (backendResponse.ok) {
      const data = await backendResponse.json();
      console.log('Backend response:', data);

      if (data.token) {
        // Set the robogo_token cookie directly
        const response = NextResponse.json({
          success: true,
          message: 'Auth flow test successful',
          token: data.token,
          user: data.user,
        });

        response.cookies.set('robogo_token', data.token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 30 * 24 * 60 * 60, // 30 days
          path: '/',
        });

        console.log('Test: robogo_token cookie set successfully');
        return response;
      }
    }

    const errorData = await backendResponse.json().catch(() => ({}));
    console.error('Backend error:', errorData);

    return NextResponse.json(
      {
        success: false,
        message: 'Backend authentication failed',
        error: errorData,
      },
      { status: 400 },
    );
  } catch (error) {
    console.error('Test auth flow error:', error);
    return NextResponse.json(
      {
        success: false,
        error: String(error),
      },
      { status: 500 },
    );
  }
}
