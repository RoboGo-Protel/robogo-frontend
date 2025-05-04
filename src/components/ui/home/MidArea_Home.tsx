import ShortSummary from "@/components/cards/ShortSummaryCard";
import TunnelPath from "@/components/cards/TunnelPathCard";
import { summaryItems } from "@/utils/summary";
import React from "react";

export default function MidArea_Home() {
  return (
    <div className="flex flex-col items-start justify-start h-full gap-4 border-2 border-[#ECECEC] rounded-xl p-5 w-full">
      <div className="flex flex-row gap-2.5 items-center justify-center bg-gradient-to-br from-[#3BD5FF]/10 to-[#367AF2]/10 w-full h-fit rounded-xl border-2 border-[#3BD5FF]/20 px-4 py-2">
        <p className="font-semibold text-base bg-gradient-to-br from-[#3BD5FF] to-[#367AF2] text-transparent bg-clip-text">
          Last Activity - March 24th, 2024
        </p>
      </div>

      <TunnelPath showStartpoint showEndpoint />

      <ShortSummary summaryItems={summaryItems} layout="grid grid-cols-1 sm:grid-cols-2 gap-4" />
    </div>
  );
}
