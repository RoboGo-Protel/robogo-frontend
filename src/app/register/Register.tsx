"use client";

import React, { useEffect, useState } from "react";
import { useDarkMode } from "@/context/DarkModeContext";
import { Icon } from "@iconify/react";
import clsx from "clsx";
import Link from "next/link";
import { useToast } from "@/context/ToastProvider";

export default function Register() {
  const { isDark } = useDarkMode();

  const [topNavbarHeight, setTopNavbarHeight] = useState(0);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const { promise } = useToast();

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords and confirm password do not match!");
      return;
    }

    setError("");
    await promise(
      fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      }).then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setError(data.message || "Registration failed");
          throw new Error(data.message || "Registration failed");
        }
        // Berhasil register, jeda 2 detik sebelum redirect ke login
        await new Promise((resolve) => setTimeout(resolve, 2000));
        window.location.href = "/login";
      }),
      {
        loading: "Registering...",
        success: "Registration successful! Redirecting to login...",
        error: (err: unknown) =>
          err instanceof Error ? err.message : "Registration failed",
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
        <h1 className="text-3xl font-bold mb-6 text-center">Register</h1>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="block mb-1 text-sm font-semibold">Name</label>
            <input
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full px-4 py-2 rounded-xl border transition-colors duration-300 ${
                isDark
                  ? "bg-[#0F1B2D] border-gray-600 text-white placeholder-gray-400"
                  : "bg-white border-gray-300 text-black"
              }`}
            />
          </div>
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
          <div>
            <label className="block mb-1 text-sm font-semibold">
              Confirm Password
            </label>
            <input
              type="password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`w-full px-4 py-2 rounded-xl border transition-colors duration-300 ${
                isDark
                  ? "bg-[#0F1B2D] border-gray-600 text-white placeholder-gray-400"
                  : "bg-white border-gray-300 text-black"
              }`}
            />
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>
          <button
            type="submit"
            className="hover:opacity-90 hover:cursor-pointer w-full flex items-center justify-center gap-2 px-5 py-3 text-white bg-gradient-to-br from-[#3BD5FF] to-[#367AF2] rounded-xl transition duration-200 ease-in-out"
          >
            <p>Register</p>
            <Icon icon="solar:user-plus-bold" fontSize={24} />
          </button>
        </form>
        <p className="text-sm text-center mt-4">
          Already have an account?{" "}
          <Link
            href="/login"
            className="underline cursor-pointer text-blue-500"
          >
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
}
