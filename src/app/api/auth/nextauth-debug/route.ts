// Debug endpoint - disabled for production build
// This endpoint was used for testing NextAuth session debugging
// It has been disabled to resolve NextAuth v4 compatibility issues during build

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: 'NextAuth debug endpoint disabled for production build',
    status: 'disabled',
  });
}
