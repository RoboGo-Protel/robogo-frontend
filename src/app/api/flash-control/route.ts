// API route untuk proxy flash control ke ESP32-CAM
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const cameraUrl = searchParams.get('cameraUrl');
    const action = searchParams.get('action');

    if (!cameraUrl || !action) {
      return NextResponse.json(
        { success: false, message: 'Missing cameraUrl or action parameter' },
        { status: 400 },
      );
    }

    // Validate action
    const validActions = ['on', 'off', 'bright', 'medium', 'low'];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { success: false, message: 'Invalid action' },
        { status: 400 },
      );
    }

    // Convert WebSocket URL to HTTP URL for flash control
    const baseUrl = cameraUrl
      .replace('ws://', 'http://')
      .replace('wss://', 'https://')
      .replace(':81', ''); // Remove WebSocket port, use default HTTP port

    const flashUrl = `${baseUrl}/flash_${action}`;

    console.log(`💡 Proxying flash control: ${action} to ${flashUrl}`);

    // Make request to ESP32-CAM
    const response = await fetch(flashUrl, {
      method: 'GET',
      headers: {
        Accept: 'text/plain',
      },
      // Add timeout
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      throw new Error(
        `ESP32-CAM responded with ${response.status}: ${response.statusText}`,
      );
    }

    const result = await response.text();

    return NextResponse.json({
      success: true,
      message: result,
      action,
    });
  } catch (error) {
    console.error('Flash control proxy error:', error);

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        action: request.nextUrl.searchParams.get('action') || 'unknown',
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cameraUrl, action } = body;

    if (!cameraUrl || !action) {
      return NextResponse.json(
        {
          success: false,
          message: 'Missing cameraUrl or action in request body',
        },
        { status: 400 },
      );
    }

    // Validate action
    const validActions = ['on', 'off', 'bright', 'medium', 'low'];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { success: false, message: 'Invalid action' },
        { status: 400 },
      );
    }

    // Convert WebSocket URL to HTTP URL for flash control
    const baseUrl = cameraUrl
      .replace('ws://', 'http://')
      .replace('wss://', 'https://')
      .replace(':81', ''); // Remove WebSocket port, use default HTTP port

    const flashUrl = `${baseUrl}/flash_${action}`;

    console.log(`💡 Proxying flash control: ${action} to ${flashUrl}`);

    // Make request to ESP32-CAM
    const response = await fetch(flashUrl, {
      method: 'GET',
      headers: {
        Accept: 'text/plain',
      },
      // Add timeout
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      throw new Error(
        `ESP32-CAM responded with ${response.status}: ${response.statusText}`,
      );
    }

    const result = await response.text();

    return NextResponse.json({
      success: true,
      message: result,
      action,
    });
  } catch (error) {
    console.error('Flash control proxy error:', error);

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        action: 'unknown',
      },
      { status: 500 },
    );
  }
}
