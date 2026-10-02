import Image from "next/image";
import Link from "next/link";

// Rasio asli aset: logo penuh 1464×598, ikon persegi.
const ASPECT = { full: 1464 / 598, putih: 1464 / 598, ikon: 1 } as const;
const SRC = { full: "/images/logo-buyalater.png", putih: "/images/logo-buyalater-putih.png", ikon: "/images/logo-icon.png" } as const;

type LogoProps = { variant?: keyof typeof ASPECT; height?: number; href?: string | null; className?: string; priority?: boolean };

/** Logo BuyaLater. `full` = logo lengkap, `putih` = untuk latar gelap, `ikon` = dompet B✓ saja. */
export function Logo({ variant = "full", height = 40, href = "/", className = "", priority = false }: LogoProps) {
  const image = <Image alt="BuyaLater" className="w-auto shrink-0" height={height} priority={priority} src={SRC[variant]} style={{ height, width: "auto" }} width={Math.round(height * ASPECT[variant])} />;
  if (href === null) return <span className={`inline-flex ${className}`}>{image}</span>;
  return <Link aria-label="BuyaLater - beranda" className={`inline-flex ${className}`} href={href}>{image}</Link>;
}
