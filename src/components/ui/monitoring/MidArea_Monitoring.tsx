/* eslint-disable @next/next/no-img-element */
import React, { useState, useEffect, useRef } from "react";
import { Icon } from "@iconify/react";
import { motion, AnimatePresence } from "framer-motion";
import { distance } from "@/utils/distance";
import StatCardList from "@/components/cards/StatsCard";
import { velocity } from "@/utils/velocity";
import DirectionalControl from "@/components/DirectionalControl";
import CompassHUD from "@/components/CompassHUD";
import BoatOrientationHUD from "@/components/OrientationHUD";

export default function MidArea_Monitoring() {
  const [recordingState, setRecordingState] = useState<"idle" | "recording">(
    "idle"
  );
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [flashOn, setFlashOn] = useState(false);
  const [fps, setFps] = useState(0);
  const [resolution, setResolution] = useState({ width: 0, height: 0 });
  const [deviceCamera, setDeviceCamera] = useState("None");
  const [isStreamActive, setIsStreamActive] = useState(false);
  const [imuHeading, setImuHeading] = useState(380);

  useEffect(() => {
    const interval = setInterval(() => {
      setImuHeading((prev) => (prev + 1) % 360);
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const lastFrameTimeRef = useRef(Date.now());

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

  const listButtons = [
    {
      icon: "ion:game-controller",
      text: "Connect with Gamepad",
      onClick: () => {},
    },
    {
      icon:
        recordingState === "idle"
          ? "fluent:video-recording-20-filled"
          : "fluent:stop-24-filled",
      text: recordingState === "idle" ? "Start Recording" : "Stop Recording",
      onClick: handleRecordClick,
    },
    {
      icon: "mynaui:chip-solid",
      text: "Recalibrate IMU",
      onClick: () => {},
    },
    {
      icon: "mingcute:camera-2-ai-fill",
      text: "Take Photo",
      onClick: () => {
        fetch("http://localhost:4000/capture")
          .then((res) => res.json())
          .then((data) => {
            console.log("📸 Captured:", data);
            alert("Snapshot berhasil disimpan!");
          })
          .catch((err) => {
            console.error("Capture failed:", err);
          });
      },
    },
  ];

  useEffect(() => {
    let socket: WebSocket;
    let reconnectTimer: NodeJS.Timeout;

    const connectSocket = () => {
      socket = new WebSocket("ws://localhost:3001/ws");

      socket.onopen = () => {
        console.log("🔌 WebSocket Connected");
      };

      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === "frame") {
            setImageSrc(message.data);
            setIsStreamActive(true);
            lastFrameTimeRef.current = Date.now();
          }
        } catch (error) {
          console.error("WebSocket message parsing error:", error);
        }
      };

      socket.onerror = (err) => {
        console.error("WebSocket error:", err);
      };

      socket.onclose = () => {
        console.warn("⚠️ WebSocket closed, retrying in 3s...");
        setIsStreamActive(false);
        reconnectTimer = setTimeout(connectSocket, 3000);
      };
    };

    connectSocket();

    return () => {
      clearTimeout(reconnectTimer);
      socket?.close();
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastFrame = now - lastFrameTimeRef.current;

      if (timeSinceLastFrame > 5000) {
        setIsStreamActive(false);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      fetch("http://localhost:3001/info")
        .then((res) => res.json())
        .then((data) => {
          if (data) {
            setFps(data.fps);
            const [w, h] = data.resolution.split("x").map(Number);
            setResolution({ width: w, height: h });
            setDeviceCamera(data.device);
          }
        });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-start justify-start h-full gap-4 border-2 border-[#ECECEC] rounded-xl p-5 w-full">
      <div className="flex flex-row gap-4 items-center w-full h-fit">
        <StatCardList variant="distance" infoItems={distance} />
        <StatCardList variant="velocity" infoItems={velocity} />
      </div>

      <div className="relative flex-1 w-full h-full rounded-2xl overflow-hidden">
        <AnimatePresence mode="wait">
          {!isStreamActive ? (
            <motion.div
              key="stream-on"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 bg-black flex items-center justify-center"
            >
              <CompassHUD heading={imuHeading} />
              <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                <BoatOrientationHUD roll={0} />
              </div>
              <div className="absolute bottom-0 px-4 py-2.5 flex flex-row items-center justify-between w-full z-10">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={`${resolution.width}x${resolution.height}-${fps}`}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.25 }}
                    className="text-white p-2.5"
                  >
                    {resolution.height}P | {fps}
                  </motion.p>
                </AnimatePresence>

                <div className="absolute top-0 px-4 py-2.5 flex flex-row items-center justify-center w-full">
                  <div className="font-semibold flex flex-row items-center gap-2 text-white p-2.5">
                    <p>{deviceCamera}</p>
                    <Icon
                      icon="fluent:video-24-filled"
                      width={20}
                      height={20}
                    />
                  </div>
                </div>

                <button
                  onClick={() => setFlashOn(!flashOn)}
                  type="button"
                  aria-label="Flash"
                  title="Flash"
                  className={`${
                    flashOn
                      ? "bg-gradient-to-br from-[#3BD5FF] to-[#367AF2]"
                      : "bg-white/20"
                  } text-white text-sm font-semibold p-2.5 rounded-xl shadow-md hover:bg-[#285ec9] transition-all`}
                >
                  <Icon icon="fluent:flash-32-filled" width={20} height={20} />
                </button>
              </div>

              <img
                src={imageSrc!}
                alt="Live Camera Stream"
                className="w-full h-full object-cover"
              />
            </motion.div>
          ) : (
            <motion.div
              key="stream-off"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-2.5 p-4 items-center justify-center bg-gradient-to-br from-[#3BD5FF]/10 to-[#367AF2]/10 w-full h-full rounded-2xl border-2 border-[#3BD5FF]/20"
            >
              <div className="p-2 rounded-xl shadow-md bg-gradient-to-br from-[#3BD5FF] to-[#367AF2]">
                <Icon
                  icon="fluent:video-off-24-filled"
                  width={28}
                  height={28}
                  className="text-white"
                />
              </div>
              <p className="font-semibold text-lg bg-gradient-to-br from-[#3BD5FF] to-[#367AF2] text-transparent bg-clip-text text-center">
                Video Stream Unavailable!
              </p>
              <div className="flex flex-row items-center gap-2 px-4 py-2 bg-gradient-to-br from-[#3BD5FF] to-[#367AF2] rounded-full text-white text-sm text-center">
                Please check RoboGo connection or camera stream.
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex flex-row w-full gap-4">
        <DirectionalControl onDirectionClick={(dir) => console.log(dir)} />
        <div className="flex flex-col w-full gap-2.5">
          <div className="flex flex-row items-center justify-center gap-2.5 bg-gradient-to-br from-[#3BD5FF] to-[#367AF2] w-full h-fit rounded-xl px-4 py-2 text-white">
            <Icon icon="mingcute:settings-1-fill" width={20} height={20} />
            <span className="font-semibold text-base">Tools</span>
          </div>
          <div className="grid grid-cols-2 gap-2.5 w-full h-fit">
            {listButtons.map((item, index) => (
              <button
                key={index}
                onClick={item.onClick}
                className="flex flex-row gap-2 items-center justify-center border-[#367AF2]/20 px-6 py-3 border-2 rounded-xl"
              >
                <p className="bg-gradient-to-br from-[#3BD5FF] to-[#367AF2] text-transparent bg-clip-text font-semibold text-sm">
                  {item.text}
                </p>
                <Icon
                  icon={item.icon}
                  width={20}
                  height={20}
                  className="text-[#39A9F9]"
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
