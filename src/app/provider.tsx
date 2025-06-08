"use client";

import { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import NextAuthProvider from '@/components/NextAuthProvider';

const queryClient = new QueryClient();

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <NextAuthProvider>{children}</NextAuthProvider>
    </QueryClientProvider>
  );
}
