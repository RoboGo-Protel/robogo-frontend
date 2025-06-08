import { NextResponse } from "next/server";

export async function GET() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  try {
    const res = await fetch(`${apiUrl}/monitoring/realtime/stop-monitoring`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const data = await res.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Error stopping realtime monitoring:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to stop realtime monitoring" },
      { status: 500 }
    );
  }
}