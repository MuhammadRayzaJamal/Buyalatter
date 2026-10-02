import { IconWhatsApp } from "@/components/public/social-icons";
import { normalisasiNoHp } from "@/lib/denda";
import { waLink } from "@/lib/kontak";

export function WhatsAppFloat({ nomor }: { nomor?: string }) {
  return <a aria-label="Chat WhatsApp BuyaLater" className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xl shadow-black/25 ring-4 ring-white/80 transition hover:scale-110" href={waLink(undefined, nomor ? normalisasiNoHp(nomor) : undefined)} rel="noopener noreferrer" target="_blank"><IconWhatsApp className="h-7 w-7" /></a>;
}
