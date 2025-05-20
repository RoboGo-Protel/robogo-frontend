import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const body = await request.json();

  try {
    const res = await fetch(`${apiUrl}/analyze/obstacle`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();

    return NextResponse.json({ status: "success", data: data.data || [] });
  } catch (error) {
    console.error("Error fetching images list:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to fetch images list" },
      { status: 500 }
    );
  }
}
