import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const { id } = await context.params;
  try {
    const res = await fetch(`${apiUrl}/reports/gallery/download/${id}`);

    const headers = new Headers();
    res.headers.forEach((value, key) => {
      headers.set(key, value);
    });

    return new NextResponse(res.body, {
      status: res.status,
      headers,
    });
  } catch (error) {
    console.error("Error downloading file:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to download file" },
      { status: 500 }
    );
  }
}
