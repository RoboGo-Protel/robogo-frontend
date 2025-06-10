import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const deviceName = searchParams.get('deviceName');

    if (!deviceName) {
      return NextResponse.json(
        { error: 'deviceName parameter is required' },
        { status: 400 },
      );
    }

    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/devices/status?deviceName=${encodeURIComponent(deviceName)}`;
    const response = await fetch(backendUrl, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      return NextResponse.json(
        { error: 'Failed to fetch device status', details: errorData },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching device status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const deviceName = searchParams.get('deviceName');

    if (!deviceName) {
      return NextResponse.json(
        {
          success: false,
          message: 'deviceName query parameter is required',
        },
        { status: 400 },
      );
    }

    // Get request body
    const statusUpdates = await request.json();

    if (!statusUpdates || typeof statusUpdates !== 'object') {
      return NextResponse.json(
        {
          success: false,
          message: 'Request body must contain status updates object',
        },
        { status: 400 },
      );
    }

    // Forward request to backend
    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/devices/status?deviceName=${encodeURIComponent(
      deviceName,
    )}`;
    const response = await fetch(backendUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(statusUpdates),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating device status:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
      },
      { status: 500 },
    );
  }
}
