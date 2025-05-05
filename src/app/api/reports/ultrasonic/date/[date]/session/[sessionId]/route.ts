import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ date: string; sessionId: string }> }
) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  const { date, sessionId } = await context.params;

  if (!date || !sessionId) {
    return NextResponse.json(
      {
        status: "error",
        message: "Missing date or sessionId in params",
      },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(
      `${apiUrl}/reports/ultrasonic/date/${date}/session/${sessionId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const data = await res.json();

    return NextResponse.json({
      status: "success",
      data: data.data || [],
    });
  } catch (error) {
    console.error("Error proxying ultrasonic report:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to fetch report data",
      },
      { status: 500 }
    );
  }
}
