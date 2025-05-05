import { NextResponse } from "next/server";

export async function GET() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  try {
    const res = await fetch(`${apiUrl}/reports/imu/dates-with-sessions`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await res.json();

    return NextResponse.json({ status: "success", data: data.data || [] });
  } catch (error) {
    console.error("Error fetching imu list:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to fetch imu list" },
      { status: 500 }
    );
  }
}
