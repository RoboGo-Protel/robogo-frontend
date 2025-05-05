import { NextResponse } from "next/server";

export async function GET() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  try {
    const res = await fetch(`${apiUrl}/monitoring/logs`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await res.json();

    return NextResponse.json({ status: "success", data: data.data || [] });
  } catch (error) {
    console.error("Error fetching logs list:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to fetch logs list" },
      { status: 500 }
    );
  }
}
