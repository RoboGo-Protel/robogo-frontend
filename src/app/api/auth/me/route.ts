import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  const cookieStore = cookies();
  const token = (await cookieStore).get('robogo_token')?.value;
  
  console.log('=== /api/auth/me called ===');
  console.log('Token dari cookies:', token ? 'Present' : 'Missing');

  if (!token) {
    console.log('No token found, returning 401');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('Making request to backend with token');
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    console.log('Backend response status:', res.status);

    if (!res.ok) {
      console.log('Backend returned error status:', res.status);
      return NextResponse.json(
        { error: 'Failed to fetch user' },
        { status: res.status },
      );
    }

    const data = await res.json();
    console.log('User data fetched successfully');

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in /api/auth/me:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}