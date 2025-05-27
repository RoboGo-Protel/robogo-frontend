"use client";

import React, { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SyncLoader } from "react-spinners";
import { useMeQuery } from "@/hooks/useMeQuery";
import Login from "./Login";

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const { data: user, isLoading } = useMeQuery();

  useEffect(() => {
    if (user) {
      router.replace(callbackUrl);
    }
  }, [user, router, callbackUrl]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <SyncLoader color="#2563EB" size={12} />
      </div>
    );
  }

  return <Login />;
}
