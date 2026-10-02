import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Unggahan KTP, swafoto, dan bukti bayar lewat Server Action (maks 5MB per berkas; KYC mengirim dua berkas sekaligus).
  experimental: { serverActions: { bodySizeLimit: "12mb" } },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "placehold.co" },
      { protocol: "https", hostname: "i.pravatar.cc" },
    ],
  },
};

export default nextConfig;
