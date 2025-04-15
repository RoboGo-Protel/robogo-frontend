import Ultrasonic from "./Ultrasonic";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ultrasonic - Reports - RoboGo",
  description: "Ultrasonic untuk melihat foto-foto hasil pengambilan gambar robot",
};

export default function UltrasonicPage() {
  return <Ultrasonic />;
}
