import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  try {
    // Get auth token from cookies
    const token = request.cookies.get('robogo_token')?.value;

    // Extract deviceName from query parameters
    const { searchParams } = new URL(request.url);
    const deviceName = searchParams.get('deviceName');

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Add Bearer token if available
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Build the URL with deviceName parameter if provided
    let backendUrl = `${apiUrl}/monitoring/realtime/stop-monitoring`;
    if (deviceName) {
      backendUrl += `?deviceName=${encodeURIComponent(deviceName)}`;
    }

    const res = await fetch(backendUrl, {
      method: 'GET',
      headers,
    });

    const data = await res.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Error stopping realtime monitoring:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to stop realtime monitoring' },
      { status: 500 },
    );
  }
}
