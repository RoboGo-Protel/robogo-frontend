import React from "react";
import { Icon } from "@iconify/react";
import { useDarkMode } from "@/context/DarkModeContext";
import { InfoItem } from '@/utils/info';

interface ShortInfoProps {
  infoItems: readonly InfoItem[];
}

const ShortInfo: React.FC<ShortInfoProps> = ({ infoItems }) => {
  const { isDark } = useDarkMode();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full h-fit">
      {infoItems.map((item, index) => {
        const isActive = item.status === 'ON';
        const containerClasses = isDark
          ? 'bg-gradient-to-br from-slate-700/50 to-slate-800/50 border border-slate-600/50'
          : 'bg-gradient-to-br from-white/80 to-blue-50/80 border border-blue-200/50';
        const iconColor = isActive
          ? isDark
            ? 'text-blue-400'
            : 'text-blue-600'
          : isDark
            ? 'text-white/50'
            : 'text-gray-400';
        const statusColor = isActive
          ? isDark
            ? 'text-white'
            : 'text-black'
          : isDark
            ? 'text-white/50'
            : 'text-gray-500';
        return (
          <div
            key={index}
            className={`relative flex flex-row items-start justify-between p-4 rounded-xl transition-all duration-300 min-h-[64px] ${containerClasses}`}
          >
            {/* Label & Value kiri atas */}
            <div className='flex flex-col items-start justify-start'>
              <span
                className={`text-xs font-medium mb-1 ${isDark ? 'text-blue-300' : 'text-blue-700'}`}
              >
                {item.title}
              </span>
              <span className={`text-lg font-bold ${statusColor}`}>
                {item.status}
              </span>
            </div>
            {/* Icon kanan atas */}
            <div className='absolute top-3 right-3'>
              <Icon
                icon={item.icon}
                width={24}
                height={24}
                className={iconColor}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ShortInfo;
