import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
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
      `${apiUrl}/reports/gallery/${id}?deviceName=${encodeURIComponent(deviceName)}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    if (!res.ok) {
      throw new Error('Failed to delete image');
    }

    const data = await res.json();

    return NextResponse.json({ status: 'success', message: data.message });
  } catch (error) {
    console.error('Error deleting image:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to delete image' },
      { status: 500 },
    );
  }
}
