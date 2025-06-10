import { NextResponse } from "next/server";
import { NextRequest } from 'next/server';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const { searchParams } = new URL(request.url);
  const deviceName = searchParams.get('deviceName');

  if (!deviceName) {
    return NextResponse.json(
      { status: 'error', message: 'deviceName parameter is required' },
      { status: 400 },
    );
  }

  const { id } = await context.params;
  try {
    const res = await fetch(
      `${apiUrl}/reports/gallery/download/${id}?deviceName=${encodeURIComponent(deviceName)}`,
    );

    const headers = new Headers();
    res.headers.forEach((value, key) => {
      headers.set(key, value);
    });

    return new NextResponse(res.body, {
      status: res.status,
      headers,
    });
  } catch (error) {
    console.error('Error downloading file:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to download file' },
      { status: 500 },
    );
  }
}
