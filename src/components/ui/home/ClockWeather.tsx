import React, { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { useDarkMode } from "@/context/DarkModeContext";
import clsx from "clsx";

function getCurrentTime() {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const seconds = now.getSeconds().toString().padStart(2, "0");

  return {
    time: `${hours}:${minutes}:${seconds}`,
    date: now.toLocaleDateString("en-US", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
  };
}

export default function ClockWeather() {
  const { isDark } = useDarkMode();
  const [clock, setClock] = useState(getCurrentTime());
  const [weather, setWeather] = useState<{
    condition: string;
    temperature: number;
    location: string;
    icon: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  // const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setClock(getCurrentTime());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const getWeatherData = React.useCallback(async () => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${apiKey}`;
      const locationRes = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
      );
      const locationData = await locationRes.json();

      const adminInfo = locationData.localityInfo?.administrative || [];
      const kecamatan = adminInfo.find(
        (a: { adminLevel: number }) => a.adminLevel === 6
      )?.name;
      const provinsi = adminInfo.find(
        (a: { adminLevel: number }) => a.adminLevel === 4
      )?.name;

      const locationName = [kecamatan, provinsi].filter(Boolean).join(", ");

      try {
        const res = await fetch(url);
        const data = await res.json();
        setWeather({
          condition: data.weather[0].main,
          temperature: Math.round(data.main.temp),
          location: locationName,
          icon: getWeatherIcon(data.weather[0].main),
        });
        // const updatedTime = new Date();
        // setLastUpdated(
        //   updatedTime.toLocaleTimeString("id-ID", {
        //     hour: "2-digit",
        //     minute: "2-digit",
        //   })
        // );
        setLoading(false);
      } catch (err) {
        console.error("Gagal ambil data cuaca:", err);
        setLoading(false);
      }
    });
  }, []);

  useEffect(() => {
    getWeatherData();
    const interval = setInterval(getWeatherData, 600000);
    return () => clearInterval(interval);
  }, [getWeatherData]);

  const getWeatherIcon = (condition: string): string => {
    switch (condition.toLowerCase()) {
      case "clear":
        return "material-symbols:sunny";
      case "clouds":
        return "material-symbols:cloudy";
      case "rain":
        return "material-symbols:rainy";
      case "thunderstorm":
        return "material-symbols:thunderstorm";
      case "snow":
        return "material-symbols:ac-unit";
      default:
        return "material-symbols:cloud";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-full max-w-5xl mx-auto"
    >
      <div className="flex flex-col-reverse sm:flex-row gap-4">
        {/* Time Card */}
        <div
          className={clsx(
            "shadow-md rounded-2xl p-6 flex flex-col justify-center text-center sm:text-left w-full",
            isDark
              ? "bg-gradient-to-br from-[#104f61] to-[#092047]"
              : "bg-gradient-to-br from-[#28a7ca] to-[#2865ce]"
          )}
        >
          {loading ? (
            <>
              <Skeleton width={140} height={36} />
              <Skeleton width={180} height={20} className="mt-2" />
            </>
          ) : (
            <>
              <p
                className={clsx(
                  "text-4xl font-semibold tabular-nums mb-2 text-white"
                )}
              >
                {clock.time}
              </p>

              <p className={clsx("text-md text-white")}>{clock.date}</p>
            </>
          )}
        </div>

        {/* Weather Card */}
        <div
          className={clsx(
            "shadow-md rounded-2xl p-6 flex flex-row sm:flex-col justify-between sm:justify-start items-center sm:items-start w-full",
            isDark
              ? "bg-gradient-to-br from-[#1d7c96] to-[#0f2d61]"
              : "bg-gradient-to-br from-[#28a7ca] to-[#2865ce]"
          )}
        >
          {loading || !weather ? (
            <>
              <Skeleton width={130} height={24} />
              <Skeleton width={110} height={18} className="mt-2" />
              <Skeleton width={80} height={42} className="mt-4" />
            </>
          ) : (
            <>
              <div className="flex sm:flex-col sm:items-start items-center justify-between gap-4 w-full">
                <div className="flex flex-col items-start">
                  <div className="flex items-center gap-3">
                    <Icon
                      icon={weather.icon}
                      width={32}
                      height={32}
                      className="text-white"
                    />
                    <p className={clsx("text-xl font-medium text-white")}>
                      {weather.condition}
                    </p>
                  </div>
                  <p
                    className={clsx(
                      "text-sm mt-1",
                      isDark ? "text-gray-400" : "text-gray-200"
                    )}
                  >
                    {weather.location}
                  </p>
                </div>
                <p
                  className={clsx("text-5xl font-extrabold sm:mt-4 text-white")}
                >
                  {weather.temperature}°C
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
