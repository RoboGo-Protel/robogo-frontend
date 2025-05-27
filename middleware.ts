import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("robogo_token")?.value;
  const path = req.nextUrl.pathname;

  console.log("Middleware triggered at path:", path);
  console.log("Token:", token);

  const protectedPaths = ["/", "/monitoring", "/reports"];

  if (
    protectedPaths.some((p) => path.startsWith(p)) &&
    (!token || token.trim() === "")
  ) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/monitoring/:path*", "/reports/:path*"],
};
