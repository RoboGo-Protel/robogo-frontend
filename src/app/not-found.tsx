import { Sora } from "next/font/google";
import Link from "next/link";
const SoraFont = Sora({ subsets: ["latin"] });
export default function NotFound() {
  return (
    <div
      className={`bg-white flex flex-col items-center justify-center min-h-screen text-center p-10 text-black ${SoraFont.className}`}
    >
      <img
        src="/images/404.svg"
        alt="404 Illustration"
        className="w-64 h-auto mb-6"
      />

      <p className="text-lg text-gray-6 00 mb-6">
        Halaman yang kamu cari tidak ditemukan.
      </p>

      <Link
        href="/"
        className="bg-gradient-to-br from-[#3BD5FF] to-[#367AF2] text-white px-6 py-3 rounded-xl hover:bg-[#C1862E] transition"
      >
        Kembali ke Beranda
      </Link>
    </div>
  );
}
