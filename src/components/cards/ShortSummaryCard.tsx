import React from "react";
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useDarkMode } from '@/context/DarkModeContext';

interface SummaryItem {
  icon: string;
  summary: string;
  title: string;
}

interface ShortSummaryProps {
  summaryItems: readonly SummaryItem[];
  layout?: string;
}

const ShortSummary: React.FC<ShortSummaryProps> = ({
  summaryItems,
  layout,
}) => {
  const { isDark } = useDarkMode();
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={`w-full h-fit ${layout}`}
    >
      {summaryItems.map((summary, index) => {
        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              delay: index * 0.1,
              duration: 0.3,
              type: 'spring',
              stiffness: 120,
            }}
            whileHover={{ scale: 1.02, y: -2 }}
            className={`flex flex-row items-center justify-start w-full h-full gap-3 p-3 rounded-2xl border-2 ${
              isDark
                ? 'border-blue-500/10 bg-[#112133] bg-gradient-to-br from-blue-500/5 to-blue-400/5'
                : 'border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-blue-400/10'
            }`}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                delay: index * 0.1 + 0.2,
                duration: 0.3,
                type: 'spring',
                stiffness: 150,
              }}
              className={`p-2 rounded-xl shadow-md bg-gradient-to-br from-blue-500 to-blue-400`}
            >
              <Icon
                icon={summary.icon}
                width={24}
                height={24}
                className='text-white'
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 + 0.1, duration: 0.3 }}
              className='flex flex-col items-start justify-start w-full'
            >
              <p
                className={`text-base font-semibold ${
                  isDark ? 'text-white' : 'text-black'
                }`}
              >
                {summary.summary}
              </p>
              <p
                className={`text-xs ${
                  isDark ? 'text-white/40' : 'text-black/40'
                }`}
              >
                {summary.title}
              </p>
            </motion.div>
          </motion.div>
        );
      })}
    </motion.div>
  );
};

export default ShortSummary;
