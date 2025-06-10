import { NextResponse } from "next/server";
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const { searchParams } = new URL(request.url);
  const deviceName = searchParams.get('deviceName');

  if (!deviceName) {
    return NextResponse.json(
      { status: 'error', message: 'deviceName parameter is required' },
      { status: 400 },
    );
  }

  try {
    const res = await fetch(
      `${apiUrl}/reports/ultrasonic?deviceName=${encodeURIComponent(deviceName)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
    const data = await res.json();

    return NextResponse.json({ status: 'success', data: data.data || [] });
  } catch (error) {
    console.error('Error fetching ultrasonic list:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to fetch ultrasonic list' },
      { status: 500 },
    );
  }
}
