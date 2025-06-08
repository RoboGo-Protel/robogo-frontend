import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = cookies();
    const token = (await cookieStore).get('robogo_token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'No authentication token found' },
        { status: 401 },
      );
    }
    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/others/user/config`;
    const response = await fetch(backendUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      return NextResponse.json(
        { error: 'Failed to fetch user config', details: errorData },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching user config:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const token = (await cookieStore).get('robogo_token')?.value;

    console.log('PUT /api/user/config - Token found:', !!token);

    if (!token) {
      return NextResponse.json(
        { error: 'No authentication token found' },
        { status: 401 },
      );
    }

    const body = await request.json();
    console.log('PUT /api/user/config - Request body:', body);

    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/others/user/config`;
    console.log('PUT /api/user/config - Backend URL:', backendUrl);

    const response = await fetch(backendUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    console.log(
      'PUT /api/user/config - Backend response status:',
      response.status,
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.log('PUT /api/user/config - Backend error:', errorData);
      return NextResponse.json(
        { error: 'Failed to save user config', details: errorData },
        { status: response.status },
      );
    }

    const data = await response.json();
    console.log('PUT /api/user/config - Success:', data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error saving user config:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
