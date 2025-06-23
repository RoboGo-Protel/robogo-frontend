import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useDarkMode } from '@/context/DarkModeContext';
import clsx from 'clsx';

interface TimeState {
  hours: string;
  minutes: string;
  seconds: string;
  dayName: string;
  date: string;
  month: string;
  year: string;
}

function getCurrentTimeState(): TimeState {
  const now = new Date();

  return {
    hours: now.getHours().toString().padStart(2, '0'),
    minutes: now.getMinutes().toString().padStart(2, '0'),
    seconds: now.getSeconds().toString().padStart(2, '0'),
    dayName: now.toLocaleDateString('en-US', { weekday: 'long' }),
    date: now.getDate().toString().padStart(2, '0'),
    month: now.toLocaleDateString('en-US', { month: 'short' }),
    year: now.getFullYear().toString(),
  };
}

export default function ModernClock() {
  const { isDark } = useDarkMode();
  const [timeState, setTimeState] = useState<TimeState>(getCurrentTimeState());

  useEffect(() => {
    const updateTime = () => {
      setTimeState(getCurrentTimeState());
    };

    // Update immediately
    updateTime();

    // Set interval for updates
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  const timeDigitVariants = {
    initial: { scale: 1 },
    animate: { scale: [1, 1.05, 1] },
  };
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className='w-full'
    >
      <div
        className={clsx(
          'relative overflow-hidden rounded-2xl p-4 border',
          isDark
            ? 'bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 border-slate-700/50'
            : 'bg-gradient-to-br from-white via-blue-50 to-indigo-100 border-blue-200/50',
        )}
      >
        {/* Background Pattern */}
        <div className='absolute inset-0 opacity-10'>
          <div
            className={clsx(
              'absolute inset-0',
              isDark
                ? 'bg-gradient-to-r from-blue-600/20 to-cyan-600/20'
                : 'bg-gradient-to-r from-blue-400/30 to-cyan-500/30',
            )}
          />
        </div>

        {/* Content */}
        <div className='relative z-10'>
          {/* Time Display - Compact horizontal layout */}
          <div className='flex items-center justify-between mb-3'>
            <div className='flex items-baseline space-x-1'>
              <motion.span
                key={timeState.hours}
                variants={timeDigitVariants}
                initial='initial'
                animate='animate'
                transition={{ duration: 0.3 }}
                className={clsx(
                  'text-3xl md:text-4xl font-bold tabular-nums',
                  isDark ? 'text-white' : 'text-slate-800',
                )}
              >
                {timeState.hours}
              </motion.span>

              <motion.span
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className={clsx(
                  'text-3xl md:text-4xl font-bold',
                  isDark ? 'text-blue-400' : 'text-blue-600',
                )}
              >
                :
              </motion.span>

              <motion.span
                key={timeState.minutes}
                variants={timeDigitVariants}
                initial='initial'
                animate='animate'
                transition={{ duration: 0.3 }}
                className={clsx(
                  'text-3xl md:text-4xl font-bold tabular-nums',
                  isDark ? 'text-white' : 'text-slate-800',
                )}
              >
                {timeState.minutes}
              </motion.span>

              <motion.span
                key={timeState.seconds}
                initial={{ opacity: 0.7, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
                className={clsx(
                  'text-lg font-medium tabular-nums ml-2',
                  isDark ? 'text-slate-400' : 'text-slate-600',
                )}
              >
                {timeState.seconds}
              </motion.span>
            </div>

            {/* Decorative Element */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
              className={clsx(
                'w-2 h-2 rounded-full',
                isDark ? 'bg-blue-400' : 'bg-blue-500',
              )}
            />
          </div>

          {/* Date Display - Compact horizontal layout */}
          <div className='flex items-center justify-between text-sm'>
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className={clsx(
                'font-semibold',
                isDark ? 'text-blue-300' : 'text-blue-700',
              )}
            >
              {timeState.dayName}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className='flex items-center space-x-2'
            >
              <span
                className={clsx(
                  'text-lg font-bold',
                  isDark ? 'text-white' : 'text-slate-800',
                )}
              >
                {timeState.date}
              </span>
              <span
                className={clsx(
                  'font-medium',
                  isDark ? 'text-slate-300' : 'text-slate-700',
                )}
              >
                {timeState.month}
              </span>
              <span
                className={clsx(
                  'text-xs',
                  isDark ? 'text-slate-500' : 'text-slate-500',
                )}
              >
                {timeState.year}
              </span>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
