import { NextResponse } from "next/server";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const { id } = params;

  try {
    const res = await fetch(`${apiUrl}/reports/gallery/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      throw new Error("Failed to delete image");
    }

    const data = await res.json();

    return NextResponse.json({ status: "success", message: data.message });
  } catch (error) {
    console.error("Error deleting image:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to delete image" },
      { status: 500 }
    );
  }
}
