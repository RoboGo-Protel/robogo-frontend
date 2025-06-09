import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const cookieStore = cookies();
  const token = (await cookieStore).get('robogo_token')?.value;

  return NextResponse.json({
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
    cookies: {
      robogo_token: token ? 'Present' : 'Missing',
      all_cookies: Object.fromEntries(
        (await cookieStore).getAll().map((c) => [c.name, c.value]),
      ),
    },
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? 'Present' : 'Missing',
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET
        ? 'Present'
        : 'Missing',
    },
  });
}
