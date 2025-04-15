// app/reports/page.tsx
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reports - RoboGo",
  description: "Reports untuk melihat data-data robot",
};

export default function ReportsPage() {
  redirect("/reports/gallery");
}
