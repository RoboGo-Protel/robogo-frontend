// filepath: g:\Kuliah\Semester 6\Proyek Telematika\RoboGo\Dashboard Website\RoboGo\client\src\app\api\auth\token\route.ts
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function GET(request: NextRequest) {
  try {
    // Get token from cookies
    const token = request.cookies.get('robogo_token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'No authentication token found' },
        { status: 401 },
      );
    }

    // Verify the token is valid
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return NextResponse.json(
        { error: 'JWT secret not configured' },
        { status: 500 },
      );
    }
    try {
      jwt.verify(token, secret);
      return NextResponse.json({ token });
    } catch {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 },
      );
    }
  } catch (error) {
    console.error('Error getting auth token:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
