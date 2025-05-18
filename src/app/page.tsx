import Home from "./Home";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Home - RoboGo",
  description:
    "Halaman untuk melihat data-data dari robot, cuaca, dan lain-lain",
};

export default function HomePage() {
  return <Home />;
}
