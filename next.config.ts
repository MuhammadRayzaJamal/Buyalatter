import type { NextConfig } from "next";

// Header keamanan untuk semua halaman. CSP hanya berisi arahan yang tidak memengaruhi skrip/gaya Next.js dan Capacitor.
const headerKeamanan = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=(), payment=()" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'" },
  ...(process.env.NODE_ENV === "production" ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }] : []),
];

const nextConfig: NextConfig = {
  // Jangan buat AGENTS.md/CLAUDE.md otomatis saat `next dev`.
  agentRules: false,
  async headers() {
    return [{ source: "/:path*", headers: headerKeamanan }];
  },
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
