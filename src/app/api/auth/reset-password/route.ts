import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  try {
    const body = await req.json();

    const res = await fetch(`${apiUrl}/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('Error during password reset:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to reset password. Please try again.',
      },
      { status: 500 },
    );
  }
}
