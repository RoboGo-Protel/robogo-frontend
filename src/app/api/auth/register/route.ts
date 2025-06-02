import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  try {
    const body = await req.json();

    const res = await fetch(`${apiUrl}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();

    return NextResponse.json({ status: "success", message: "Registrasi berhasil", data: data.data || [] });
  } catch (error) {
    console.error("Error during registration:", error);
    return NextResponse.json(
      { status: "error", message: "Registrasi gagal, silakan coba lagi." },
      { status: 500 }
    );
  }
}
