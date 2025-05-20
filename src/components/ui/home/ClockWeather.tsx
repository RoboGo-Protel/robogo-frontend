import React, { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import ClipLoader from "react-spinners/ClipLoader";
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

  const loaderColor = isDark ? "#ffffff" : "#f1f1f1";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-full max-w-5xl mx-auto"
    >
      <div className="flex flex-col-reverse md:flex-row gap-4">
        {/* Time Card */}
        <div
          className={clsx(
            "shadow-md rounded-2xl p-6 flex justify-center items-center text-center md:text-left w-full min-h-[120px]",
            isDark
              ? "bg-gradient-to-br from-[#104f61] to-[#092047]"
              : "bg-gradient-to-br from-[#28a7ca] to-[#2865ce]"
          )}
        >
          {loading ? (
            <ClipLoader size={35} color={loaderColor} />
          ) : (
            <div className="flex flex-col justify-center">
              <p className="text-4xl font-semibold tabular-nums mb-2 text-white">
                {clock.time}
              </p>
              <p className="text-md text-white">{clock.date}</p>
            </div>
          )}
        </div>

        {/* Weather Card */}
        <div
          className={clsx(
            "shadow-md rounded-2xl p-6 flex justify-center items-center w-full min-h-[120px]",
            isDark
              ? "bg-gradient-to-br from-[#1d7c96] to-[#0f2d61]"
              : "bg-gradient-to-br from-[#28a7ca] to-[#2865ce]"
          )}
        >
          {loading || !weather ? (
            <ClipLoader size={35} color={loaderColor} />
          ) : (
            <div className="flex md:flex-col md:items-start items-center justify-between gap-4 w-full">
              <div className="flex flex-col items-start">
                <div className="flex items-center gap-3">
                  <Icon
                    icon={weather.icon}
                    width={32}
                    height={32}
                    className="text-white"
                  />
                  <p className="text-xl font-medium text-white">
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
              <p className="text-5xl font-extrabold md:mt-4 text-white">
                {weather.temperature}°C
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
