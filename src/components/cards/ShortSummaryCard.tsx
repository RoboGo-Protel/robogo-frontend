import React from "react";
import { Icon } from "@iconify/react";
import { useDarkMode } from "@/context/DarkModeContext";

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
    <div className={`w-full h-fit ${layout}`}>
      {summaryItems.map((summary, index) => {
        return (
          <div
            key={index}
            className={`flex flex-row items-center justify-start w-full h-full gap-3 p-3 rounded-2xl border-2 ${
              isDark
                ? 'border-blue-500/10 bg-[#112133] bg-gradient-to-br from-blue-500/5 to-blue-400/5'
                : 'border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-blue-400/10'
            }`}
          >
            <div
              className={`p-2 rounded-xl shadow-md bg-gradient-to-br from-blue-500 to-blue-400`}
            >
              <Icon
                icon={summary.icon}
                width={24}
                height={24}
                className='text-white'
              />
            </div>
            <div className='flex flex-col items-start justify-start w-full'>
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
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ShortSummary;
