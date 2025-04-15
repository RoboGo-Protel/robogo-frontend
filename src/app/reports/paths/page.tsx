import Paths from "./Paths";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Paths - Reports - RoboGo",
  description: "Paths untuk melihat foto-foto hasil pengambilan gambar robot",
};

export default function PathsPage() {
  return <Paths />;
}