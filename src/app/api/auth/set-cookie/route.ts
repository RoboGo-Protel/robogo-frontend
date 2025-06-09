// Set cookie endpoint - disabled for production build
// This endpoint was used for manual cookie setting during development
// It has been disabled to resolve NextAuth v4 compatibility issues during build

import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({
    message: 'Set cookie endpoint disabled for production build',
    status: 'disabled',
    note: 'Authentication cookies are now handled automatically by NextAuth',
  });
}
