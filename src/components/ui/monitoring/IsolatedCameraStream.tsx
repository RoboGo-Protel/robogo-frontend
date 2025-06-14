import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/context/ToastProvider';
import DynamicVideoStream from '@/components/DynamicVideoStreamOptimized';
import { useUserConfig } from '@/hooks/useUserConfig';
import CompassHUD from '@/components/CompassHUD';
import BoatOrientationHUD from '@/components/OrientationHUD';

interface Metadata {
  ultrasonic?: number;
  heading?: number;
  pitch?: number;
  roll?: number;
  yaw?: number;
}

interface IsolatedCameraStreamProps {
  metadata?: Metadata;
}

export default function IsolatedCameraStream({
  metadata,
}: IsolatedCameraStreamProps) {
  const { promise } = useToast();
  const router = useRouter();

  // Camera state - isolated from parent monitoring data
  const [cameraUrl, setCameraUrl] = useState<string>('');
  const [cameraUrlError, setCameraUrlError] = useState<string>('');
  const [streamType, setStreamType] = useState<string>('');
  const [hasWebSocketError, setHasWebSocketError] = useState<boolean>(false);
  const [isStreamLoaded, setIsStreamLoaded] = useState<boolean>(false);

  const { selectedDevice, config } = useUserConfig();

  // Isolated camera config fetch - not affected by Firebase data updates
  useEffect(() => {
    const fetchCameraConfig = async () => {
      try {
        if (config?.cameraStreamUrl) {
          console.log(
            '🎥 [ISOLATED] Loading camera URL:',
            config.cameraStreamUrl,
          );
          setCameraUrl(config.cameraStreamUrl);
          setCameraUrlError('');
          setIsStreamLoaded(false);
          setHasWebSocketError(false);

          // Detect stream type
          if (
            config.cameraStreamUrl.startsWith('ws://') ||
            config.cameraStreamUrl.startsWith('wss://')
          ) {
            setStreamType('WEBSOCKET');
          } else if (
            config.cameraStreamUrl.startsWith('http://') ||
            config.cameraStreamUrl.startsWith('https://')
          ) {
            setStreamType('HTTP');
          } else {
            setStreamType('DIRECT');
          }
        } else {
          console.log('🎥 [ISOLATED] No camera URL in config');
          setCameraUrl('');
          setStreamType('');
        }
      } catch (error) {
        console.error('🚨 [ISOLATED] Error fetching camera config:', error);
        setCameraUrlError('Failed to load camera configuration');
      }
    };

    fetchCameraConfig();
  }, [config?.cameraStreamUrl, selectedDevice?.id]);

  // Stream disconnect handler
  const handleStreamDisconnect = async () => {
    try {
      console.log('🔌 [ISOLATED] Disconnecting camera stream...');

      await promise(
        new Promise((resolve) => {
          setCameraUrl('');
          setCameraUrlError('Stream disconnected by user');
          setIsStreamLoaded(false);
          setHasWebSocketError(false);

          setTimeout(resolve, 500);
        }),
        {
          loading: 'Disconnecting camera stream...',
          success: 'Camera stream disconnected successfully',
          error: 'Failed to disconnect camera stream',
        },
      );

      console.log('✅ [ISOLATED] Camera stream disconnected');
    } catch (error) {
      console.error('❌ [ISOLATED] Error disconnecting stream:', error);
    }
  };

  // Open settings page
  const openSettingsPage = () => {
    router.push('/settings');
  };

  // Validate camera URL
  const isCameraUrlValid = cameraUrl && cameraUrl.trim() !== '';

  return (
    <div className='relative w-full h-full'>
      {/* Video Stream Container */}
      <div className='relative w-full h-full rounded-2xl overflow-hidden bg-gray-900'>
        {/* Camera Label */}
        <div className='absolute top-0 left-0 right-0 z-10'>
          <div className='flex justify-between items-center p-3'>
            <div className='bg-black/50 backdrop-blur-sm rounded-lg px-3 py-1.5'>
              <div className='font-semibold flex flex-row items-center gap-2 text-white text-sm'>
                <p>Camera Stream</p>
                <Icon icon='fluent:video-24-filled' width={16} height={16} />
              </div>
            </div>
          </div>
        </div>

        {/* Video Stream */}
        {cameraUrl && isCameraUrlValid ? (
          <DynamicVideoStream
            key={`isolated-${cameraUrl}`} // Isolated key to prevent conflicts
            url={cameraUrl}
            alt='Isolated Camera Stream'
            className='w-full h-full object-cover absolute inset-0 rounded-2xl'
            onError={(error: string) => {
              console.error('🚨 [ISOLATED] Camera stream error:', error);
              setCameraUrlError(error);
              setIsStreamLoaded(false);
              if (
                error.includes('1006') ||
                error.includes('Connection closed') ||
                (streamType === 'WEBSOCKET' && error.includes('WebSocket'))
              ) {
                setHasWebSocketError(true);
              }
            }}
            onLoad={() => {
              console.log('✅ [ISOLATED] Camera stream loaded');
              setIsStreamLoaded(true);
              setHasWebSocketError(false);
              setCameraUrlError('');
            }}
            refreshInterval={1000}
          />
        ) : (
          <div className='flex flex-col items-center justify-center h-full text-white'>
            <Icon
              icon='fluent:video-off-24-filled'
              width={64}
              height={64}
              className='text-gray-400 mb-4'
            />
            <p className='text-lg font-medium mb-2'>No Camera Connected</p>
            <p className='text-sm opacity-70 mb-4'>
              Configure camera stream in settings
            </p>
            <button
              onClick={openSettingsPage}
              className='bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors'
            >
              Configure Stream
            </button>
          </div>
        )}

        {/* HUD Overlays - Only show when stream is connected and loaded */}
        {isStreamLoaded && cameraUrl && !hasWebSocketError && metadata && (
          <>
            {/* Compass HUD */}
            <div className='absolute top-16 right-4 z-20'>
              <CompassHUD heading={metadata.heading || 0} />
            </div>{' '}
            {/* Boat Orientation HUD */}
            <div className='absolute bottom-16 left-4 z-20'>
              <BoatOrientationHUD roll={metadata.roll || 0} />
            </div>
          </>
        )}

        {/* Disconnect Button */}
        {cameraUrl && (
          <div className='absolute bottom-4 right-4 z-20'>
            <button
              onClick={handleStreamDisconnect}
              className='bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-colors'
              title='Disconnect Stream'
            >
              <Icon
                icon='fluent:plug-disconnected-24-filled'
                width={20}
                height={20}
              />
            </button>
          </div>
        )}

        {/* Error Message */}
        {cameraUrlError && (
          <div className='absolute bottom-4 left-4 z-20'>
            <div className='bg-red-600/90 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-sm'>
              {cameraUrlError}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
