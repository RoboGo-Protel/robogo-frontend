"use client";
import React, { useEffect, useState } from "react";
import { useDarkMode } from "@/context/DarkModeContext";
import clsx from "clsx";
import Link from "next/link";
import { useToast } from "@/context/ToastProvider";
import { useRouter, useSearchParams } from "next/navigation";

export default function Login() {
  const { isDark } = useDarkMode();
  const { promise } = useToast();

  const [topNavbarHeight, setTopNavbarHeight] = useState(0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  useEffect(() => {
    const updateHeights = () => {
      const top = document.querySelector("#top-navbar");
      if (top) setTopNavbarHeight(top.clientHeight);
      else setTopNavbarHeight(0);
    };

    updateHeights();
    window.addEventListener("resize", updateHeights);
    return () => window.removeEventListener("resize", updateHeights);
  }, []);

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await promise(
      fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      }).then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || "Login failed");
        }
        return res.json();
      }),
      {
        loading: "Logging in...",
        success: (data) => {
          router.replace(callbackUrl);
          return `Welcome back, ${data.data?.user?.name || "User"}!`;
        },
        error: (err) =>
          err instanceof Error ? err.message : "An unexpected error occurred",
      }
    );
  };

  return (
    <div
      className={clsx(
        "flex flex-col md:flex-row items-start md:items-center justify-center gap-4 min-h-screen md:h-screen p-5 overflow-auto transition-colors duration-300",
        isDark ? "bg-[#112133] text-white" : "bg-white text-black"
      )}
      style={{ paddingTop: topNavbarHeight }}
    >
      <div
        className={`w-full max-w-md p-8 rounded-2xl shadow-xl transition-colors duration-300 ${
          isDark ? "bg-[#0F1B2D] text-white" : "bg-gray-100 text-black"
        }`}
      >
        <h1 className="text-3xl font-bold mb-6 text-center">Log In</h1>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="block mb-1 text-sm font-semibold">Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full px-4 py-2 rounded-xl border transition-colors duration-300 ${
                isDark
                  ? "bg-[#0F1B2D] border-gray-600 text-white placeholder-gray-400"
                  : "bg-white border-gray-300 text-black"
              }`}
            />
          </div>
          <div>
            <label className="block mb-1 text-sm font-semibold">Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full px-4 py-2 rounded-xl border transition-colors duration-300 ${
                isDark
                  ? "bg-[#0F1B2D] border-gray-600 text-white placeholder-gray-400"
                  : "bg-white border-gray-300 text-black"
              }`}
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
          >
            Log In
          </button>
        </form>
        <p className="mt-4 text-sm text-center">
          Don’t have an account?{" "}
          <Link href="/register" className="text-blue-500 hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
