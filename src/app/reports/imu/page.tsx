import IMU from "./IMU";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "IMU - Reports - RoboGo",
  description: "IMU untuk melihat data IMU robot",
};

export default function IMUPage() {
  return <IMU />;
}
