import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useDarkMode } from '@/context/DarkModeContext';
import { Icon } from '@iconify/react';
import clsx from 'clsx';

interface TimeData {
  hours: string;
  minutes: string;
  seconds: string;
  ampm: string;
  date: string;
  day: string;
}

function getCurrentTimeData(): TimeData {
  const now = new Date();
  const hours24 = now.getHours();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();

  return {
    hours: hours24.toString().padStart(2, '0'),
    minutes: minutes.toString().padStart(2, '0'),
    seconds: seconds.toString().padStart(2, '0'),
    ampm: hours24 >= 12 ? 'PM' : 'AM',
    date: now.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }),
    day: now.toLocaleDateString('en-US', {
      weekday: 'long',
    }),
  };
}

export default function DigitalClock() {
  const { isDark } = useDarkMode();
  const [timeData, setTimeData] = useState<TimeData>(getCurrentTimeData());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    console.log('[DigitalClock] Component mounted and timer started');

    const interval = setInterval(() => {
      setTimeData(getCurrentTimeData());
    }, 1000);

    return () => {
      clearInterval(interval);
      console.log('[DigitalClock] Timer cleaned up');
    };
  }, []);

  // Don't render anything until mounted to avoid hydration issues
  if (!mounted) {
    return (
      <div className='w-full max-w-md mx-auto'>
        <div
          className={clsx(
            'shadow-lg rounded-2xl p-8 min-h-[160px] flex items-center justify-center',
            isDark
              ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700'
              : 'bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200',
          )}
        >
          <div
            className={clsx(
              'animate-pulse',
              isDark ? 'text-gray-400' : 'text-gray-500',
            )}
          >
            Loading clock...
          </div>
        </div>
      </div>
    );
  }
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: 0.4,
        ease: 'easeOut',
        type: 'spring',
        stiffness: 100,
      }}
      className='w-full'
    >
      <div
        className={clsx(
          'relative overflow-hidden shadow-md rounded-2xl p-6 backdrop-blur-sm transition-all duration-300 hover:shadow-lg min-h-[120px] flex items-center',
          isDark
            ? 'bg-gradient-to-br from-slate-800/95 to-slate-900/95 border border-slate-700/50'
            : 'bg-gradient-to-br from-white/95 to-blue-50/95 border border-blue-200/50',
        )}
      >
        {/* Background decorative elements */}
        <div className='absolute top-2 right-2 w-12 h-12 opacity-10'>
          <Icon
            icon='solar:clock-circle-bold'
            className={clsx(
              'w-full h-full',
              isDark ? 'text-blue-400' : 'text-blue-600',
            )}
          />
        </div>

        {/* Main content */}
        <div className='relative z-10 flex-1'>
          {/* Time display */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className='flex items-baseline gap-1 mb-2'
          >
            <span
              className={clsx(
                'text-4xl font-bold tabular-nums tracking-tight',
                isDark ? 'text-white' : 'text-gray-900',
              )}
            >
              {timeData.hours}
            </span>
            <motion.span
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className={clsx(
                'text-4xl font-bold',
                isDark ? 'text-blue-400' : 'text-blue-600',
              )}
            >
              :
            </motion.span>
            <span
              className={clsx(
                'text-4xl font-bold tabular-nums tracking-tight',
                isDark ? 'text-white' : 'text-gray-900',
              )}
            >
              {timeData.minutes}
            </span>
            <span
              className={clsx(
                'text-xl font-medium ml-2',
                isDark ? 'text-gray-400' : 'text-gray-600',
              )}
            >
              :{timeData.seconds}
            </span>
          </motion.div>

          {/* Date and day display */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className='flex items-center gap-4'
          >
            <div className='flex items-center gap-2'>
              <Icon
                icon='solar:calendar-bold'
                className={clsx(
                  'w-3 h-3',
                  isDark ? 'text-blue-400' : 'text-blue-600',
                )}
              />
              <span
                className={clsx(
                  'text-sm font-medium',
                  isDark ? 'text-blue-300' : 'text-blue-700',
                )}
              >
                {timeData.day}
              </span>
            </div>
            <div className='flex items-center gap-2'>
              <Icon
                icon='solar:calendar-date-bold'
                className={clsx(
                  'w-3 h-3',
                  isDark ? 'text-gray-400' : 'text-gray-600',
                )}
              />
              <span
                className={clsx(
                  'text-sm font-medium',
                  isDark ? 'text-gray-300' : 'text-gray-700',
                )}
              >
                {timeData.date}
              </span>{' '}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
