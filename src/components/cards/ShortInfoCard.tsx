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

        const containerClasses = isActive
          ? isDark
            ? 'border-blue-500/10 bg-gradient-to-br from-blue-500/5 to-blue-400/5'
            : 'border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-blue-400/10'
          : isDark
            ? 'border-white/10 bg-white/5'
            : 'border-gray-300 bg-gray-100';
        const iconWrapperClasses = isActive
          ? 'bg-gradient-to-br from-blue-500 to-blue-400'
          : isDark
            ? 'bg-white/10'
            : 'bg-gray-300';

        const iconColor = isActive
          ? 'text-white'
          : isDark
            ? 'text-white/50'
            : 'text-gray-500';

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
            className={`flex flex-row items-center justify-start w-full gap-3 p-3 border-2 rounded-2xl h-fit ${containerClasses}`}
          >
            <div className={`p-2 rounded-xl shadow-md ${iconWrapperClasses}`}>
              <Icon
                icon={item.icon}
                width={24}
                height={24}
                className={iconColor}
              />
            </div>
            <div className='flex flex-col items-start justify-start w-full'>
              <p className={`text-base font-semibold ${statusColor}`}>
                {item.status}
              </p>
              <p
                className={`text-xs ${isDark ? 'text-white/40' : 'opacity-40'}`}
              >
                {item.title}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ShortInfo;
