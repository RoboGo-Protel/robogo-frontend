import ShortSummary from "@/components/cards/ShortSummaryCard";
import TunnelPath from "@/components/cards/TunnelPathCard";
import { summaryItems } from "@/utils/summary";
import React from "react";
import { useDarkMode } from "@/context/DarkModeContext";
import clsx from "clsx";

const pathData = [
  {
    id: "R1YdU00PTvQoeZZOKml3",
    timestamp: "2025-04-27T08:51:35.092Z",
    sessionId: 1,
    position: {
      x: 0.5,
      y: 0.5,
    },
    speed: 1.25,
    heading: 45,
    status: "Start",
    createdAt: "2025-05-05T04:34:30.027Z",
  },
  {
    id: "PeFkafFbvirNb2A9QyZO",
    timestamp: "2025-04-27T08:53:40.092Z",
    sessionId: 1,
    position: {
      x: 2.5,
      y: 1,
    },
    imageUrl:
      "https://t3.ftcdn.net/jpg/01/80/46/56/360_F_180465639_UAJJt5COMPSSDuMS8w0NuHFqF7wvteCE.jpg",
    speed: 2.5,
    heading: 90,
    status: "Moving",
    createdAt: "2025-05-05T04:34:45.276Z",
  },
  {
    id: "tNwMn6erKWr5i1XZwQF5",
    timestamp: "2025-04-27T08:58:40.092Z",
    sessionId: 1,
    position: {
      x: 5.8,
      y: 3.4,
    },
    speed: 0,
    heading: 134,
    status: "Stop",
    createdAt: "2025-05-05T05:50:19.979Z",
  },
];

export default function MidArea_Home() {
  const { isDark } = useDarkMode();
  return (
    <div
      className={clsx(
        'flex flex-col items-start justify-start w-full flex-1 gap-4 border-2 rounded-xl p-5 self-stretch',
        isDark ? 'border-[#113541]' : 'border-[#ECECEC]',
      )}
      style={{ minHeight: '100%' }}
    >
      {' '}
      <div className='flex flex-row gap-2.5 items-center justify-center bg-gradient-to-br from-blue-500/10 to-blue-400/10 w-full h-fit rounded-xl border-2 border-blue-500/20 px-4 py-2 text-center'>
        <p className='font-semibold text-base bg-gradient-to-br from-blue-500 to-blue-400 text-transparent bg-clip-text w-full'>
          Last Activity - March 24th, 2024
        </p>
      </div>{' '}
      <div className='flex-1 w-full min-h-0'>
        <TunnelPath showStartpoint showEndpoint pathData={pathData} />
      </div>
      <ShortSummary
        summaryItems={summaryItems}
        layout='grid grid-cols-2 gap-4'
      />
    </div>
  );
}
