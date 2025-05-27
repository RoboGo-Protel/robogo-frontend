import React, { Suspense } from "react";
import LoginClient from "./LoginClient";
import { SyncLoader } from "react-spinners";

export const metadata = {
  title: "Login - RoboGo",
  description: "Login untuk mengontrol Robot Gorong Gorong",
};

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center h-screen">
          <SyncLoader color="#2563EB" size={12} />
        </div>
      }
    >
      <LoginClient />
    </Suspense>
  );
}
