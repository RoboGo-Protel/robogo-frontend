import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function PUT() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('robogo_token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Authorization token not found' },
        { status: 401 },
      );
    }
    const response = await fetch(`${BACKEND_URL}/others/user/skip-onboarding`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: 'Failed to skip onboarding' }));
      return NextResponse.json(
        { error: errorData.message || 'Failed to skip onboarding' },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in skip onboarding API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
