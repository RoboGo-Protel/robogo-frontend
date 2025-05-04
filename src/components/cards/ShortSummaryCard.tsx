import React from "react";
import { Icon } from "@iconify/react";

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
  return (
    <div className={`w-full h-fit ${layout}`}>
      {summaryItems.map((summary, index) => {
        return (
          <div
            key={index}
            className="flex flex-row items-center justify-start w-full gap-3 p-3 border-2 rounded-2xl border-[#3BD5FF]/20 bg-gradient-to-br from-[#3BD5FF]/10 to-[#367AF2]/10 h-fit"
          >
            <div className="p-2 rounded-xl shadow-md bg-gradient-to-br from-[#3BD5FF] to-[#367AF2]">
              <Icon
                icon={summary.icon}
                width={24}
                height={24}
                className="text-white"
              />
            </div>
            <div className="flex flex-col items-start justify-start w-full">
              <p className={`text-base font-semibold text-black`}>
                {summary.summary}
              </p>
              <p className="text-xs opacity-40">{summary.title}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ShortSummary;
