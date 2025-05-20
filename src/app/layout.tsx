import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { DarkModeProvider } from "@/context/DarkModeContext";
import AppWrapper from "@/components/AppWrapper";
import { ToastProvider } from "@/context/ToastProvider";

const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Dashboard - RoboGo",
  description: "Dashboard untuk mengontrol Robot Gorong Gorong",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${poppins.className} antialiased`}>
        <DarkModeProvider>
          <ToastProvider position="bottom-center">
            <AppWrapper>{children}</AppWrapper>
          </ToastProvider>
        </DarkModeProvider>
      </body>
    </html>
  );
}
