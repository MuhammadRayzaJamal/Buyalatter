import type { Metadata, Viewport } from "next";
import { Inter, Montserrat } from "next/font/google";
import { SplashAwal } from "@/components/ui/splash-awal";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "BuyaLater - Koperasi Simpan Pinjam Digital untuk Anggota",
    template: "%s | BuyaLater",
  },
  description: "BuyaLater, Koperasi Simpan Pinjam Digital untuk Anggota.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className={`${inter.variable} ${montserrat.variable} h-full antialiased`}>
      <body className="min-h-full"><SplashAwal />{children}</body>
    </html>
  );
}
