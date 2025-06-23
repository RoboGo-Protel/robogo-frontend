import { useState } from "react";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { Icon } from "@iconify/react";
import { ClipLoader } from "react-spinners";

interface Metadata {
  ultrasonic: number;
  heading?: number;
  direction?: string;
  accelerationMagnitude?: number;
  rotationRate?: number;
  distanceTraveled?: number;
  linearAcceleration?: number;
  velocity?: number;
  velocityX?: number;
  velocityY?: number;
  magnetometer?: {
    magnetometerX: number;
    magnetometerY: number;
    magnetometerZ: number;
  };
  position?: {
    positionX?: number;
    positionY?: number;
  };
  pitch?: number;
  roll?: number;
  yaw?: number;
}

interface PhotoDetailsProps {
  details: {
    id: string;
    src: string;
    alt: string;
    obstacle: boolean;
    date: string;
    fileName: string;
    createdAt: string;
    metadata?: Metadata;
    fromTab?: string; // Track which tab the photo came from ('original' or 'metadata')
  };
  isDark: boolean;
}

function ImageWithAnalysis({ details, isDark }: PhotoDetailsProps) {
  const [loading, setLoading] = useState(false);
  const [obstacle, setObstacle] = useState<null | boolean>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setObstacle(null);
    setError(null);
    try {
      const response = await fetch('/api/analyze/obstacle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: details.src }),
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data = await response.json();
      if (!data?.data) {
        throw new Error('Invalid response format');
      }

      setObstacle(data.data.obstacle);
      setImageBase64(data.data.image || null);
    } catch (error) {
      console.error('Error analyzing image:', error);
      setObstacle(null);
      setImageBase64(null);
      if (error instanceof Error) {
        setError(error.message);
      } else if (typeof error === 'string') {
        setError(error);
      } else {
        setError('Unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  };
  return (
    <div
      className={clsx(
        'relative rounded-xl overflow-hidden border-2',
        // For metadata tab photos, use natural aspect ratio, for original use fixed 4:3
        details.fromTab === 'metadata'
          ? 'w-full max-w-md mx-auto'
          : 'md:w-[420px] aspect-[4/3]',
        isDark ? 'border-[#27426C]' : 'border-[#DFDFDF]',
      )}
    >
      {/* Gambar */}{' '}
      <motion.img
        key={imageBase64 || details.src}
        src={imageBase64 || details.src}
        alt={details.alt}
        className={clsx(
          'w-full',
          // For metadata tab photos, maintain natural aspect ratio
          details.fromTab === 'metadata'
            ? 'h-auto object-contain'
            : 'h-full object-cover',
        )}
        initial={{ opacity: 0.5 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      />
      {/* Compact Distance Traveled Card - Positioned absolute at top-right */}
      {details.metadata?.distanceTraveled && (
        <motion.div
          className={clsx(
            'absolute top-3 right-3 z-30 px-3 py-2 rounded-lg border shadow-lg backdrop-blur-sm',
            isDark
              ? 'border-[#27426C] bg-[#1A2B48]/90 text-white'
              : 'border-[#DFDFDF] bg-white/90 text-black',
          )}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          {' '}
          <div className='flex items-center gap-2'>
            <div className='text-right'>
              <p
                className={clsx(
                  'text-sm font-bold leading-none',
                  isDark ? 'text-white' : 'text-black',
                )}
              >
                {details.metadata.distanceTraveled.toFixed(2)}m
              </p>
              <p
                className={clsx(
                  'text-[10px] leading-none',
                  isDark ? 'text-gray-300' : 'text-gray-500',
                )}
              >
                Distance Traveled
              </p>
            </div>
            <div className='p-1 bg-gradient-to-br from-blue-500 to-blue-400 rounded'>
              <Icon
                icon='mdi:map-marker-distance'
                width={14}
                height={14}
                className='text-white'
              />
            </div>
          </div>
        </motion.div>
      )}
      {/* Radar scanning effect */}
      <AnimatePresence>
        {loading && (
          <motion.div
            className='absolute inset-0 bg-black/20 z-10 overflow-hidden pointer-events-none'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className='absolute top-0 left-0 w-full h-[30%] bg-gradient-to-b from-blue-400/40 to-transparent'
              initial={{ y: '-30%' }}
              animate={{ y: '110%' }}
              transition={{
                duration: 1.0,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
      {/* Overlay analyze */}
      <div className='absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[15px] px-3 py-2.5 flex justify-between items-center z-20'>
        <button
          onClick={handleAnalyze}
          className='flex items-center justify-center bg-blue-600 text-white text-[13px] px-3 py-1.5 rounded-lg shadow hover:bg-blue-700 disabled:opacity-50'
          disabled={loading}
        >
          {loading ? 'Analyzing...' : 'Analyze'}
          {loading ? (
            <ClipLoader size={16} color='#ffffff' className='ml-2' />
          ) : (
            <Icon fontSize={20} icon='tabler:zoom-scan' className='ml-2' />
          )}
        </button>

        {(obstacle !== null || error) && (
          <motion.div
            className='ml-2 flex items-center gap-2'
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Icon
              icon={
                error
                  ? 'line-md:alert-circle'
                  : obstacle
                    ? 'line-md:alert-circle-twotone-loop'
                    : 'line-md:circle-to-confirm-circle-twotone-transition'
              }
              className={clsx(
                'text-xl',
                error
                  ? 'text-yellow-400'
                  : obstacle
                    ? 'text-red-400'
                    : 'text-green-400',
              )}
            />
            <span
              className={clsx(
                'text-sm',
                error
                  ? 'text-yellow-400'
                  : obstacle
                    ? 'text-red-400'
                    : 'text-green-400',
              )}
            >
              {error
                ? `Error: ${error}`
                : `Obstacle: ${obstacle ? 'Yes' : 'No'}`}
            </span>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default ImageWithAnalysis;
