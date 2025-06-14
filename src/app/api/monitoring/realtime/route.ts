import { NextResponse } from "next/server";
import { NextRequest } from 'next/server';

export async function GET() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  try {
    const res = await fetch(`${apiUrl}/monitoring/realtime`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const data = await res.json();

    return NextResponse.json({ status: 'success', data: data.data || [] });
  } catch (error) {
    console.error('Error fetching images list:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to fetch images list' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const { searchParams } = new URL(request.url);
  const deviceName = searchParams.get('deviceName');

  if (!deviceName) {
    return NextResponse.json(
      { status: 'error', message: 'Device name is required' },
      { status: 400 },
    );
  }

  try {
    // Get the FormData from the request
    const formData = await request.formData();

    // Forward the request to the backend server
    const res = await fetch(
      `${apiUrl}/monitoring/realtime?deviceName=${encodeURIComponent(deviceName)}`,
      {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header for FormData, let the browser set it
      },
    );

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText || `HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error posting to monitoring/realtime:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to save data',
      },
      { status: 500 },
    );
  }
}
