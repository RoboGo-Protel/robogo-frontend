"use client";

import { useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";
import { useMeQuery } from "@/hooks/useMeQuery";
import { SyncLoader } from "react-spinners";

type ProtectedLayoutProps = {
  children: ReactNode;
};

const ProtectedLayout = ({ children }: ProtectedLayoutProps) => {
  const router = useRouter();
  const { data: user, isLoading, unauthorized } = useMeQuery();

  useEffect(() => {
    if (unauthorized) {
      const callbackUrl = window.location.pathname + window.location.search;
      router.replace(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
    }
  }, [unauthorized, router]);

  if (isLoading)
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <SyncLoader color='#60a5fa' />
      </div>
    );

  if (!user) return null;

  return <>{children}</>;
};

export default ProtectedLayout;
