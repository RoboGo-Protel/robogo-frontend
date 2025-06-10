import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ date: string; sessionId: string }> }
) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const { searchParams } = new URL(req.url);
  const deviceName = searchParams.get('deviceName');

  if (!deviceName) {
    return NextResponse.json(
      { status: 'error', message: 'deviceName parameter is required' },
      { status: 400 },
    );
  }

  const { date, sessionId } = await context.params;

  if (!date || !sessionId) {
    return NextResponse.json(
      {
        status: 'error',
        message: 'Missing date or sessionId in params',
      },
      { status: 400 },
    );
  }

  try {
    const res = await fetch(
      `${apiUrl}/reports/ultrasonic/summaries/date/${date}/session/${sessionId}?deviceName=${encodeURIComponent(deviceName)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    const data = await res.json();

    return NextResponse.json({
      status: 'success',
      data: data.data || [],
    });
  } catch (error) {
    console.error('Error proxying IMU report:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to fetch report data',
      },
      { status: 500 },
    );
  }
}
