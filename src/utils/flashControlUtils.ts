/**
 * Utility functions for ESP32-CAM flash control
 */

export interface FlashControlResult {
  success: boolean;
  message: string;
  action: string;
}

/**
 * Control ESP32-CAM flash LED
 * @param cameraUrl - WebSocket or HTTP URL of the camera
 * @param action - Flash action to perform
 * @returns Promise with result
 */
export async function controlCameraFlash(
  cameraUrl: string,
  action: 'on' | 'off' | 'bright' | 'medium' | 'low' | 'dim',
): Promise<FlashControlResult> {
  try {
    console.log(`💡 Controlling flash: ${action} for camera ${cameraUrl}`);

    // Try using API proxy first (recommended for CORS issues)
    try {
      const response = await fetch('/api/flash-control', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cameraUrl,
          action,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `HTTP ${response.status}`);
      }

      return {
        success: result.success,
        message: result.message,
        action: result.action,
      };
    } catch (proxyError) {
      console.warn('API proxy failed, trying direct request:', proxyError);
      // Fallback: Direct request to ESP32-CAM
      // Fix URL construction to avoid double slashes
      let baseUrl = cameraUrl
        .replace('ws://', 'http://')
        .replace('wss://', 'https://');

      // Handle port replacement more carefully
      if (baseUrl.includes(':81')) {
        baseUrl = baseUrl.replace(':81/', '/').replace(':81', '');
      }

      // Ensure baseUrl doesn't end with slash to avoid double slash
      baseUrl = baseUrl.replace(/\/$/, '');

      const flashUrl = `${baseUrl}/flash_${action}`;

      console.log(`🔗 Flash URL constructed: ${flashUrl}`);

      // Try direct fetch with CORS
      try {
        const response = await fetch(flashUrl, {
          method: 'GET',
          mode: 'cors',
          headers: {
            Accept: 'text/plain',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.text();

        return {
          success: true,
          message: result,
          action,
        };
      } catch (corsError) {
        console.warn('CORS error, trying no-cors mode:', corsError);

        // Fallback: try with no-cors mode (won't get response text but will send request)
        await fetch(flashUrl, {
          method: 'GET',
          mode: 'no-cors',
        });

        return {
          success: true,
          message: `Flash ${action} command sent (no-cors mode)`,
          action,
        };
      }
    }
  } catch (error) {
    console.error(`❌ Flash control failed for action '${action}':`, error);

    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      action,
    };
  }
}

/**
 * Test if camera flash endpoints are accessible
 * @param cameraUrl - WebSocket or HTTP URL of the camera
 * @returns Promise<boolean>
 */
export async function testFlashEndpoints(cameraUrl: string): Promise<boolean> {
  try {
    const baseUrl = cameraUrl
      .replace('ws://', 'http://')
      .replace('wss://', 'https://')
      .replace(':81', '');

    // Test basic HTTP endpoint first
    const testUrl = `${baseUrl}/`;

    // Try direct connection first
    try {
      const response = await fetch(testUrl, {
        method: 'HEAD',
        mode: 'cors',
      });
      return response.ok;
    } catch (corsError) {
      console.warn('CORS error in test, trying no-cors:', corsError);

      // Fallback: try no-cors mode
      try {
        await fetch(testUrl, {
          method: 'HEAD',
          mode: 'no-cors',
        });
        return true; // Assume success if no error thrown
      } catch (error) {
        console.error('Flash endpoint test failed completely:', error);
        return false;
      }
    }
  } catch (error) {
    console.error('Flash endpoint test failed:', error);
    return false;
  }
}

/**
 * Flash control actions with descriptions
 */
export const FLASH_ACTIONS = {
  on: {
    label: 'Flash ON',
    icon: 'fluent:lightbulb-24-filled',
    description: 'Turn on flash LED',
    color: 'bg-yellow-500 hover:bg-yellow-600',
  },
  off: {
    label: 'Flash OFF',
    icon: 'fluent:lightbulb-24-regular',
    description: 'Turn off flash LED',
    color: 'bg-gray-500 hover:bg-gray-600',
  },
  bright: {
    label: 'Bright',
    icon: 'fluent:brightness-high-24-filled',
    description: 'Maximum brightness',
    color: 'bg-orange-500 hover:bg-orange-600',
  },
  medium: {
    label: 'Medium',
    icon: 'fluent:brightness-low-24-filled',
    description: 'Medium brightness',
    color: 'bg-amber-500 hover:bg-amber-600',
  },
  low: {
    label: 'Low',
    icon: 'fluent:brightness-low-24-regular',
    description: 'Low brightness',
    color: 'bg-yellow-600 hover:bg-yellow-700',
  },
  dim: {
    label: 'Dim',
    icon: 'fluent:weather-moon-24-regular',
    description: 'Dim brightness',
    color: 'bg-indigo-500 hover:bg-indigo-600',
  },
} as const;

export type FlashAction = keyof typeof FLASH_ACTIONS;
