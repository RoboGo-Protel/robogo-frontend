import Gallery from "./Gallery";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gallery - Reports - RoboGo",
  description: "Gallery untuk melihat foto-foto hasil pengambilan gambar robot",
};

export default function GalleryPage() {
  return <Gallery />;
}
