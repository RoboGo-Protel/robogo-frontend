/* eslint-disable @next/next/no-img-element */
import React, { useState } from "react";
import { Icon } from "@iconify/react";
import { motion, AnimatePresence } from "framer-motion";
import StatCardList from "@/components/cards/StatsCard";
import DirectionalControl from "@/components/DirectionalControl";
import CompassHUD from "@/components/CompassHUD";
import BoatOrientationHUD from "@/components/OrientationHUD";
import { useDarkMode } from "@/context/DarkModeContext";
import { useToast } from "@/context/ToastProvider";
import StopMonitoringResult from "./StopMonitoringResult";
import { useStopMonitoringResult } from "./StopMonitoringResultContext";


interface ImportLogResult {
  totalData: number;
  success: boolean;
  duplication: boolean;
  message: string;
}

interface ImportedReport {
  ultrasonic_logs: ImportLogResult;
  imu_logs: ImportLogResult;
}

export interface StopMonitoringResultType {
  stopped: boolean;
  sessionId: number;
  date: string;
  importedReport: ImportedReport;
}

interface Metadata {
  ultrasonic: number;
  heading: number;
  direction?: string;
  accelerationMagnitude?: number;
  rotationRate?: number;
  distanceTraveled?: number;
  linearAcceleration?: number;
  distances: {
    distTotal: number;
    distX: number;
    distY: number;
  };
  velocity: {
    velocity?: number;
    velocityX?: number;
    velocityY?: number;
    velTotal?: number;
    velX?: number;
    velY?: number;
  };
  magnetometer?: {
    magnetometerX: number;
    magnetometerY: number;
    magnetometerZ: number;
  };
  position: {
    positionX?: number;
    positionY?: number;
    posX?: number;
    posY?: number;
  };
  pitch?: number;
  roll?: number;
  yaw?: number;
}

interface Data {
  id: string;
  src: string;
  alt: string;
  obstacle: boolean;
  date: string;
  fileName: string;
  createdAt: string;
  metadata: Metadata;
}

interface MidAreaMonitoringProps {
  dataMonitoring: Data[];
  currentSession?: number | null;
}

export default function MidArea_Monitoring({
  dataMonitoring,
  currentSession = 0,
}: MidAreaMonitoringProps) {
  const [recordingState, setRecordingState] = useState<"idle" | "recording">(
    "idle"
  );
  const { promise } = useToast();
  const { isDark } = useDarkMode();
  const [flashOn, setFlashOn] = useState(false);
  const [fps] = useState(0);
  const [resolution] = useState({ width: 0, height: 0 });
  const [deviceCamera] = useState("None");
  const [isStreamActive] = useState(false);
  const { stopResult, setStopResult } = useStopMonitoringResult();

  const latestData = dataMonitoring[dataMonitoring.length - 1];

  const handleRecordClick = async () => {
    try {
      if (recordingState === "idle") {
        const res = await fetch("http://localhost:4000/record/start");
        const json = await res.json();
        if (json.success) {
          setRecordingState("recording");
          alert("Recording started!");
        } else {
          alert("❌ Failed: " + json.message);
        }
      } else {
        const res = await fetch("http://localhost:4000/record/stop");
        const json = await res.json();
        if (json.success && json.saved) {
          alert("📁 Recording saved to:\n" + json.saved);
        } else {
          alert("❌ Failed to stop/save recording.");
        }
        setRecordingState("idle");
      }
    } catch (err) {
      console.error("Recording error:", err);
      alert("❌ Error saat menghubungi server.");
    }
  };

  const handleStartMonitoring = async () => {
    try {
      await promise(
        fetch("/api/monitoring/realtime/start-monitoring", {
          method: "GET",
        }).then((res) => {
          if (!res.ok) {
            return res.text().then((text) => {
              throw new Error(
                text || res.statusText || "Failed to start monitoring"
              );
            });
          }
        }),
        {
          loading: "Starting monitoring...",
          success: "Monitoring started successfully!",
          error: "Failed to start monitoring. Please try again.",
        }
      );
    } catch (error) {
      console.error("Error starting monitoring:", error);
    }
  };

  const showStopResult = (result: StopMonitoringResultType) => {
    setStopResult(result);
  };

  const handleStopMonitoring = async () => {
    try {
      const res = await fetch("/api/monitoring/realtime/stop-monitoring", {
        method: "GET",
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || res.statusText || "Failed to stop monitoring");
      }
      const json = await res.json();
      showStopResult(json);
      await promise(Promise.resolve(), {
        loading: "Stopping monitoring...",
        success: "Monitoring stopped successfully!",
        error: "Failed to stop monitoring. Please try again.",
      });
    } catch (error) {
      console.error("Error stopping monitoring:", error);
      await promise(Promise.reject(), {
        loading: "Stopping monitoring...",
        success: "Monitoring stopped successfully!",
        error: "Failed to stop monitoring. Please try again.",
      });
    }
  };

  const listButtons = [
    {
      icon:
        recordingState === 'idle'
          ? 'fluent:video-recording-20-filled'
          : 'fluent:stop-24-filled',
      text: recordingState === 'idle' ? 'Start Recording' : 'Stop Recording',
      onClick: handleRecordClick,
    },
    {
      icon: 'mynaui:chip-solid',
      text: 'Recalibrate IMU',
      onClick: () => {},
    },
    {
      icon: 'mingcute:camera-2-ai-fill',
      text: 'Take Photo',
      onClick: () => {
        fetch('http://localhost:4000/capture')
          .then((res) => res.json())
          .then((data) => {
            console.log('📸 Captured:', data);
            alert('Snapshot berhasil disimpan!');
          })
          .catch((err) => {
            console.error('Capture failed:', err);
          });
      },
    },
  ];

  return (
    <div
      className={`flex flex-col items-start justify-start h-full gap-4 rounded-xl p-4 md:p-5 w-full border-2 ${
        isDark
          ? 'border-[#113541] bg-[#0F1B2B] text-white'
          : 'border-[#ECECEC] bg-white text-black'
      }`}
    >
      <div className='relative flex-1 w-full h-[300px] md:h-full rounded-2xl overflow-hidden'>
        <AnimatePresence mode='wait'>
          {isStreamActive ? (
            <motion.div
              key='stream-off'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex flex-col gap-2.5 p-4 items-center justify-center w-full h-full rounded-2xl border-2 ${
                isDark
                  ? 'bg-[#0F1B2B] border-[#113541]'
                  : 'bg-gradient-to-br from-[#3BD5FF]/10 to-[#367AF2]/10 border-[#3BD5FF]/20'
              }`}
            >
              <CompassHUD heading={dataMonitoring[0]?.metadata?.heading ?? 0} />
              <div className='absolute top-0 left-0 w-full h-full flex items-center justify-center'>
                <BoatOrientationHUD
                  roll={dataMonitoring[0]?.metadata?.roll ?? 0}
                />
              </div>
              <div className='absolute bottom-0 px-4 py-2.5 flex flex-row items-center justify-between w-full z-10'>
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

                <div className='absolute top-0 px-4 py-2.5 flex flex-row items-center justify-center w-full'>
                  <div className='font-semibold flex flex-row items-center gap-2 text-white p-2.5'>
                    <p>{deviceCamera}</p>
                    <Icon
                      icon='fluent:video-24-filled'
                      width={20}
                      height={20}
                    />
                  </div>
                </div>

                <button
                  onClick={() => setFlashOn(!flashOn)}
                  type='button'
                  aria-label='Flash'
                  title='Flash'
                  className={`text-white text-sm font-semibold p-2.5 rounded-xl shadow-md transition-all ${
                    flashOn
                      ? 'bg-gradient-to-br from-[#3BD5FF] to-[#367AF2]'
                      : isDark
                        ? 'bg-white/10 hover:bg-white/20'
                        : 'bg-white/20 hover:bg-[#285ec9]'
                  }`}
                >
                  <Icon icon='fluent:flash-32-filled' width={20} height={20} />
                </button>
              </div>

              <img
                src='http://192.168.171.17/stream'
                alt='Live Camera Stream'
                className='w-full h-full object-cover'
              />
            </motion.div>
          ) : (
            <motion.div
              key='stream-off'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className='flex flex-col gap-2.5 p-4 items-center justify-center bg-gradient-to-br from-[#3BD5FF]/10 to-[#367AF2]/10 w-full h-full rounded-2xl border-2 border-[#3BD5FF]/20'
            >
              <div className='p-2 rounded-xl shadow-md bg-gradient-to-br from-[#3BD5FF] to-[#367AF2]'>
                <Icon
                  icon='fluent:video-off-24-filled'
                  width={28}
                  height={28}
                  className='text-white'
                />
              </div>
              <p className='font-semibold text-lg bg-gradient-to-br from-[#3BD5FF] to-[#367AF2] text-transparent bg-clip-text text-center'>
                Video Stream Unavailable!
              </p>
              <div className='flex flex-row items-center gap-2 px-4 py-2 bg-gradient-to-br from-[#3BD5FF] to-[#367AF2] rounded-full text-white text-sm text-center'>
                Please check RoboGo connection!
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {dataMonitoring && dataMonitoring.length > 0 ? (
        <div className='flex flex-col gap-4 items-stretch w-full h-fit'>
          <StatCardList
            variant='distance'
            infoItems={
              dataMonitoring[0]?.metadata?.distances
                ? [
                    {
                      title: 'Distance Total',
                      value:
                        latestData.metadata.distances.distTotal != null
                          ? `${latestData.metadata.distances.distTotal.toFixed(2)} cm`
                          : '-',
                    },
                    {
                      title: 'Distance X',
                      value:
                        latestData.metadata.distances.distX != null
                          ? `${latestData.metadata.distances.distX.toFixed(2)} cm`
                          : '-',
                    },
                    {
                      title: 'Distance Y',
                      value:
                        latestData.metadata.distances.distY != null
                          ? `${latestData.metadata.distances.distY.toFixed(2)} cm`
                          : '-',
                    },
                  ]
                : []
            }
          />
          <StatCardList
            variant='velocity'
            infoItems={
              dataMonitoring[0]?.metadata?.velocity
                ? [
                    {
                      title: 'Velocity Total',
                      value:
                        latestData.metadata.velocity.velTotal != null
                          ? `${latestData.metadata.velocity.velTotal.toFixed(2)} m/s`
                          : latestData.metadata.velocity.velocity != null
                            ? `${latestData.metadata.velocity.velocity.toFixed(2)} m/s`
                            : '-',
                    },
                    {
                      title: 'Velocity X',
                      value:
                        latestData.metadata.velocity.velX != null
                          ? `${latestData.metadata.velocity.velX.toFixed(2)} m/s`
                          : latestData.metadata.velocity.velocityX != null
                            ? `${latestData.metadata.velocity.velocityX.toFixed(2)} m/s`
                            : '-',
                    },
                    {
                      title: 'Velocity Y',
                      value:
                        latestData.metadata.velocity.velY != null
                          ? `${latestData.metadata.velocity.velY.toFixed(2)} m/s`
                          : latestData.metadata.velocity.velocityY != null
                            ? `${latestData.metadata.velocity.velocityY.toFixed(2)} m/s`
                            : '-',
                    },
                  ]
                : []
            }
          />
        </div>
      ) : (
        <div
          className={`flex items-center justify-center w-full h-32 rounded-xl font-semibold text-lg ${
            isDark ? 'bg-[#113541] text-gray-300' : 'bg-gray-100 text-gray-500'
          }`}
        >
          Start monitoring to show the data
        </div>
      )}

      <div className='flex flex-col md:flex-row w-full gap-4'>
        <DirectionalControl onDirectionClick={(dir) => console.log(dir)} />
        <div className='flex flex-col w-full gap-2.5'>
          <div
            className={`flex flex-row items-center justify-center gap-2.5 w-full h-fit rounded-xl px-4 py-2 ${
              isDark
                ? 'bg-[#113541] text-white'
                : 'bg-gradient-to-br from-[#3BD5FF] to-[#367AF2] text-white'
            }`}
          >
            <Icon icon='mingcute:settings-1-fill' width={20} height={20} />
            <span className='font-semibold text-base'>Tools</span>
          </div>
          <div className='grid grid-cols-1 md:grid-cols-6 gap-2.5 w-full h-fit'>
            <button
              onClick={handleStartMonitoring}
              disabled={!!currentSession && currentSession > 0}
              className={`flex flex-row gap-2 items-center justify-center px-6 py-3 rounded-xl bg-gradient-to-br from-[#3BD5FF] to-[#367AF2] text-white col-span-1 md:col-span-3 ${!!currentSession && currentSession > 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Icon icon='mingcute:play-fill' width={20} height={20} />
              <p className={`font-semibold text-sm text-white`}>
                Start Monitoring
              </p>
            </button>

            <button
              onClick={handleStopMonitoring}
              disabled={!currentSession || currentSession === 0}
              className={`flex flex-row gap-2 items-center justify-center px-6 py-3 rounded-xl col-span-1 md:col-span-3 ${currentSession && currentSession > 0 ? 'bg-gradient-to-br from-red-500 to-red-700 text-white' : 'bg-gradient-to-br from-[#3BD5FF] to-[#367AF2] text-white opacity-50 cursor-not-allowed'}`}
            >
              <Icon icon='mingcute:stop-fill' width={20} height={20} />
              <p className={`font-semibold text-sm text-white`}>
                Stop Monitoring
              </p>
            </button>

            {listButtons.map((item, index) => (
              <button
                key={index}
                onClick={item.onClick}
                className={`flex flex-row gap-2 items-center justify-center px-6 py-3 border-2 rounded-xl col-span-1 md:col-span-2 ${
                  isDark
                    ? 'border-[#3BD5FF]/10 bg-[#0A1625] text-white'
                    : 'border-[#367AF2]/20 bg-white text-black'
                }`}
              >
                <p
                  className={`font-semibold text-sm ${
                    isDark
                      ? 'text-white'
                      : 'bg-gradient-to-br from-[#3BD5FF] to-[#367AF2] text-transparent bg-clip-text'
                  }`}
                >
                  {item.text}
                </p>
                <Icon
                  icon={item.icon}
                  width={20}
                  height={20}
                  className={isDark ? 'text-[#3BD5FF]' : 'text-[#39A9F9]'}
                />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Dialog Stop Monitoring Result */}
      <AnimatePresence>
        {stopResult && (
          <motion.div
            key='stop-result-popup'
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className='fixed inset-0 z-50 flex items-center justify-center bg-black/40'
          >
            <div className='bg-white rounded-xl shadow-xl p-0 md:p-0 max-w-lg w-full relative dark:bg-[#101c2b]'>
              <button
                className='absolute top-2 right-2 text-gray-400 hover:text-gray-700 dark:hover:text-white text-xl font-bold z-10 p-2 rounded-full transition-colors'
                onClick={() => setStopResult(null)}
                aria-label='Close'
                type='button'
              >
                <Icon icon='mingcute:close-line' width={24} height={24} />
              </button>
              <StopMonitoringResult result={stopResult} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
