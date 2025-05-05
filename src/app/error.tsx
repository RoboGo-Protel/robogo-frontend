/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="bg-white flex flex-col items-center justify-center min-h-screen text-center p-10 text-black">
      <img
        src="/images/error.svg"
        alt="Error Illustration"
        className="w-64 h-auto mb-6"
      />

      <h1 className="text-3xl font-bold text-black mb-4">
        Oops! Terjadi Kesalahan
      </h1>
      <p className="text-lg text-gray-600 mb-6">
        Sepertinya ada masalah teknis. Silakan coba lagi nanti.
      </p>

      <button
        onClick={() => reset()}
        className="bg-gradient-to-br from-[#3BD5FF] to-[#367AF2] text-white px-6 py-3 rounded-xl hover:opacity-80 transition"
      >
        Coba Lagi
      </button>
    </div>
  );
}
