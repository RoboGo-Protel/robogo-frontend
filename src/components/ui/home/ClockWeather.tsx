import React, { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

function getCurrentTime() {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const seconds = now.getSeconds().toString().padStart(2, "0");

  return {
    time: `${hours}:${minutes}:${seconds}`,
    date: now.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
  };
}

export default function ClockWeather() {
  const [clock, setClock] = useState(getCurrentTime());
  const [weather, setWeather] = useState<{
    condition: string;
    temperature: number;
    location: string;
    icon: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // Update time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setClock(getCurrentTime());
    }, 1000);

    return () => clearInterval(interval); // Cleanup on component unmount
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
        const updatedTime = new Date();
        setLastUpdated(
          updatedTime.toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
          })
        );
        setLoading(false);
      } catch (err) {
        console.error("Gagal ambil data cuaca:", err);
        setLoading(false);
      }
    });
  }, []);

  useEffect(() => {
    getWeatherData();
    const interval = setInterval(getWeatherData, 60);
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Time Card */}
        <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 shadow-md rounded-2xl p-6 flex flex-col justify-center">
          {loading ? (
            <>
              <Skeleton width={140} height={36} />
              <Skeleton width={180} height={20} className="mt-2" />
            </>
          ) : (
            <>
              <p className="text-4xl font-semibold text-gray-900 dark:text-white tabular-nums mb-2">
                {clock.time}
              </p>

              <p className="text-md text-gray-500 dark:text-gray-400">
                {clock.date}
              </p>
            </>
          )}
        </div>

        {/* Weather Card */}
        <div className="bg-gradient-to-br from-[#e0f2ff] to-[#f0f7ff] dark:from-[#1e3a8a] dark:to-[#0f172a] shadow-md rounded-2xl p-6 flex flex-col justify-center">
          {loading || !weather ? (
            <>
              <Skeleton width={130} height={24} />
              <Skeleton width={110} height={18} className="mt-2" />
              <Skeleton width={80} height={42} className="mt-4" />
            </>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <Icon
                  icon={weather.icon}
                  width={32}
                  height={32}
                  className="text-[#367AF2]"
                />
                <p className="text-xl font-medium text-gray-800 dark:text-white">
                  {weather.condition}
                </p>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {weather.location}
              </p>
              <p className="text-5xl font-extrabold text-[#367AF2] dark:text-white mt-4">
                {weather.temperature}°C
              </p>
            </>
          )}
        </div>
      </div>

      {lastUpdated && (
        <p className="text-xs text-center text-gray-400 dark:text-gray-500 mt-4">
          Terakhir diperbarui: {lastUpdated}
        </p>
      )}
    </motion.div>
  );
}
