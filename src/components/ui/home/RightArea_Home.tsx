/* eslint-disable @next/next/no-img-element */
import React, { useState } from "react";
import { Icon } from "@iconify/react";
import Image from "next/image";
import { infoItems } from "@/utils/info";
import { motion, AnimatePresence } from "framer-motion";
import ShortInfo from "@/components/cards/ShortInfoCard";
import { useDarkMode } from "@/context/DarkModeContext";

export default function RightArea_Home() {
  const { isDark } = useDarkMode();

  const [flashOn, setFlashOn] = useState(false);
  const [fps] = useState(0);
  const [resolution] = useState({ width: 0, height: 0 });
  const [deviceCamera] = useState("None");
  const [isStreamActive] = useState(false);

  return (
    <div
      className={`flex flex-col items-start justify-start w-full max-w-[450px] md:max-w-[450px] h-full gap-4 rounded-xl p-4 md:p-5 border-2 transition-colors ${
        isDark
          ? 'border-blue-500/10 bg-[#112133] text-white'
          : 'border-[#ECECEC] bg-white text-black'
      }`}
    >
      {/* Header */}
      <div className='flex flex-col items-center justify-center w-full gap-4'>
        <h1 className='text-2xl font-bold'>RoboGo G1</h1>
        <Image
          src='/images/robogo_g1.png'
          alt='RoboGo G1'
          width={180}
          height={180}
          className='select-none'
        />
      </div>

      {/* Info Cards */}
      <ShortInfo infoItems={infoItems} />

      {/* Camera Stream */}
      <div className='h-full w-full rounded-2xl flex items-center justify-center relative min-h-[300px]'>
        <AnimatePresence mode='wait'>
          {isStreamActive ? (
            <motion.div
              key='stream-on'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className='h-full w-full rounded-2xl relative flex items-center justify-center'
            >
              <div className='absolute top-0 px-4 py-2.5 flex flex-row items-center justify-center w-full'>
                <div className='font-semibold flex flex-row items-center gap-2 text-white p-2.5'>
                  <p>{deviceCamera}</p>
                  <Icon icon='fluent:video-24-filled' width={20} height={20} />
                </div>
              </div>

              <div className='absolute bottom-0 px-4 py-2.5 flex flex-row items-center justify-between w-full'>
                <AnimatePresence mode='wait'>
                  <motion.p
                    key={`${resolution.width}x${resolution.height}-${fps}`}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.25 }}
                    className='text-white p-2.5'
                  >
                    {resolution.height}P | {fps}
                  </motion.p>
                </AnimatePresence>

                <button
                  onClick={() => setFlashOn(!flashOn)}
                  type='button'
                  aria-label='Flash'
                  title='Flash'
                  className={`text-sm font-semibold p-2.5 rounded-xl shadow-md transition-all ${
                    flashOn
                      ? 'bg-gradient-to-br from-blue-500 to-blue-400'
                      : isDark
                        ? 'bg-white/10 hover:bg-white/20'
                        : 'bg-white/20 hover:bg-[#285ec9]'
                  } text-white`}
                >
                  <Icon icon='fluent:flash-32-filled' width={20} height={20} />
                </button>
              </div>

              <img
                src='http://localhost:4000/api/v1/monitoring/camera-stream'
                alt='Live Camera Stream'
                className='rounded-2xl w-auto h-full object-cover max-h-[400px]'
              />
            </motion.div>
          ) : (
            <motion.div
              key='stream-off'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex flex-col gap-2.5 p-4 items-center justify-center w-full h-full rounded-2xl border-2 min-h-[300px] transition-all ${
                isDark
                  ? 'bg-gradient-to-br from-blue-500/5 to-blue-400/5 border-blue-500/10'
                  : 'bg-gradient-to-br from-blue-500/10 to-blue-400/10 border-blue-500/20'
              }`}
            >
              <div className='p-2 rounded-xl shadow-md bg-gradient-to-br from-blue-500 to-blue-400'>
                <Icon
                  icon='fluent:video-off-24-filled'
                  width={28}
                  height={28}
                  className='text-white'
                />
              </div>{' '}
              <p className='font-semibold text-lg bg-gradient-to-br from-blue-500 to-blue-400 text-transparent bg-clip-text text-center'>
                Video Stream Unavailable!
              </p>
              <div className='flex flex-row items-center gap-2 px-4 py-2 bg-gradient-to-br from-blue-500 to-blue-400 rounded-full text-white text-sm text-center'>
                Please check RoboGo connection!
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
