import React, { useEffect, useState } from "react";
import { Icon } from "@iconify/react";

function getCurrentTime() {
  const now = new Date();
  const hours = now.getHours();
  const isAM = hours < 12;
  const hour12 = hours % 12 || 12;
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const seconds = now.getSeconds().toString().padStart(2, "0");

  return {
    time: `${hour12}:${minutes}:${seconds}`,
    period: isAM ? "AM" : "PM",
    date: now.toLocaleDateString("en-US", {
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

  // Update jam tiap detik
  useEffect(() => {
    const interval = setInterval(() => {
      setClock(getCurrentTime());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Ambil cuaca berdasarkan koordinat
  useEffect(() => {
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
      } catch (err) {
        console.error("Gagal ambil data cuaca:", err);
      }
    });
  }, []);

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
    <div className="flex flex-col items-start justify-start w-full gap-4 h-fit">
      {/* Clock */}
      <div className="flex flex-col items-start justify-start w-full gap-1 px-5 py-4 border-2 border-[#ECECEC] rounded-xl">
        <p className="text-xl font-semibold">
          {clock.time} <span className="text-sm">{clock.period}</span>
        </p>
        <p>{clock.date}</p>
      </div>

      {/* Weather */}
      {weather && (
        <div className="flex flex-row items-center justify-between w-full px-5 py-4 border-2 border-[#ECECEC] rounded-xl">
          <div className="flex flex-col items-start justify-center gap-1.5">
            <div className="flex flex-row items-center justify-start gap-2.5">
              <Icon
                icon={weather.icon}
                width={24}
                height={24}
                className="text-[#367AF2]"
              />
              <p className="text-xl font-semibold">{weather.condition}</p>
            </div>
            <p>{weather.location}</p>
          </div>
          <p className="bg-gradient-to-br from-[#3BD5FF] to-[#367AF2] bg-clip-text text-transparent text-3xl font-bold">
            {weather.temperature}°C
          </p>
        </div>
      )}
    </div>
  );
}
