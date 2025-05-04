import type { Metadata } from "next";
import "../globals.css";
import ReportsNavbar from "@/components/ReportsNavbar";

export const metadata: Metadata = {
  title: "Reports - RoboGo",
  description:
    "RoboGo Reports page to monitor performance data, robot activity, and operational results in real-time with accuracy and clarity.",
  keywords: [
    "RoboGo",
    "Robot Reports",
    "Robot Performance Monitoring",
    "AI Robot Dashboard",
    "Operational Reports",
    "Automation Insights",
    "RoboGo Analytics",
  ],
  authors: [{ name: "RoboGo Team", url: "https://robogo.id" }],
  openGraph: {
    title: "Reports - RoboGo",
    description:
      "Monitor your robot’s performance and activities with RoboGo’s comprehensive reporting tools.",
    url: "https://robogo.id/reports",
    siteName: "RoboGo",
    images: [
      {
        url: "https://robogo.id/og-image-reports.png",
        width: 1200,
        height: 630,
        alt: "RoboGo Reports Dashboard",
      },
    ],
    type: "website",
  },
};

export default function ReportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ReportsNavbar />
      {children}
    </>
  );
}
