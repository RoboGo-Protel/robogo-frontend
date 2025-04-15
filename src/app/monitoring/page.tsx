import Monitoring from "./Monitoring";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Monitoring - RoboGo",
  description: "Monitoring untuk mengontrol Robot Gorong Gorong",
};

export default function MonitoringPage() {
  return <Monitoring />;
}
