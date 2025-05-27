import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({
    message: "Logout successful",
  });

  const expiredDate = new Date(0);

  response.cookies.set("robogo_token", "", {
    path: "/",
    httpOnly: true,
    expires: expiredDate,
  });

  response.cookies.set("next-auth.session-token", "", {
    path: "/",
    httpOnly: true,
    expires: expiredDate,
  });

  response.cookies.set("next-auth.csrf-token", "", {
    path: "/",
    httpOnly: true,
    expires: expiredDate,
  });

  response.cookies.set("next-auth.callback-url", "", {
    path: "/",
    httpOnly: true,
    expires: expiredDate,
  });

  return response;
}
