// Custom callback endpoint - disabled for production build
// This endpoint was used for custom authentication callback handling
// It has been disabled since NextAuth handles callbacks automatically
// and to resolve NextAuth v4 compatibility issues during build

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  console.log('Custom callback endpoint called but disabled for production');

  // Redirect to home since authentication is handled by NextAuth
  const url = new URL(request.url);
  const callbackUrl = url.searchParams.get('callbackUrl') || '/';

  return NextResponse.redirect(new URL(callbackUrl, request.url));
}
