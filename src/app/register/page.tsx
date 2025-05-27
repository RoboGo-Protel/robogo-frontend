import Register from "./Register";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Register - RoboGo",
  description: "Register untuk mengontrol Robot Gorong Gorong",
};

export default function RegisterPage() {
  return <Register />;
}
