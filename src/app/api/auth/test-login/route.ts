import { NextResponse } from 'next/server';

export async function POST() {
  const testToken =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJXYjBzT0RyN2RDMDlYb2tlSjFUUCIsImVtYWlsIjoidGVzdHVzZXJAZ21haWwuY29tIiwibmFtZSI6IlRlc3QgVXNlciIsImlhdCI6MTc0OTM1MzI3MiwiZXhwIjoxNzUxOTQ1MjcyfQ.1p7Eiu0nXn5CyeE_BjxdmjtOU3j_wkOodyqr1OPgJhQ';

  const response = NextResponse.json({
    status: 'success',
    message: 'Test login successful',
  });

  response.cookies.set('robogo_token', testToken, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}
