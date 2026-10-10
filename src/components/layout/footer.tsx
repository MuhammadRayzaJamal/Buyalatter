import Image from "next/image";
import Link from "next/link";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { getBannerAktif } from "@/lib/banner";
import { normalisasiNoHp } from "@/lib/denda";
import { getSitus, KOLOM_LABEL } from "@/lib/situs";
import { DynamicIcon } from "@/components/ui/dynamic-icon";
import { FooterKolom } from "@/components/layout/footer-kolom";
import { Logo } from "@/components/ui/logo";
import { BannerCarousel } from "@/components/public/banner-carousel";
import { NewsletterForm } from "@/components/public/newsletter-form";
import { IconFacebook, IconInstagram, IconTikTok, IconWhatsApp, IconYoutube } from "@/components/public/social-icons";
import { WhatsAppFloat } from "@/components/public/whatsapp-float";

const IKON_SOSIAL = { INSTAGRAM: IconInstagram, FACEBOOK: IconFacebook, YOUTUBE: IconYoutube, TIKTOK: IconTikTok, WHATSAPP: IconWhatsApp } as const;
const NAMA_SOSIAL = { INSTAGRAM: "Instagram", FACEBOOK: "Facebook", YOUTUBE: "YouTube", TIKTOK: "TikTok", WHATSAPP: "WhatsApp" } as const;
const linkClass = "text-sm text-blue-100/80 transition hover:text-white";
const KOLOM = ["LAYANAN", "PERUSAHAAN", "BANTUAN"] as const;

/** Banner iklan (posisi FOOTER) + footer dinamis dari database + tombol WhatsApp melayang untuk seluruh halaman publik. */
export async function Footer() {
  const [banners, situs] = await Promise.all([getBannerAktif("FOOTER"), getSitus()]);
  return (
    <>
      <BannerCarousel slides={banners.map((b) => ({ id: b.id, judul: b.judul, subjudul: b.subjudul, gambarUrl: b.gambarUrl, linkTujuan: b.linkTujuan, teksTombol: b.teksTombol }))} />
      <div className="relative z-10 mx-auto -mb-24 mt-16 w-full max-w-7xl px-5 lg:px-8">
        <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-r from-[#1A2A6C] via-[#1E5FC7] to-[#4FB8EC] p-8 shadow-2xl shadow-primary/30 sm:p-12">
          <div aria-hidden className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
          <div className="relative grid items-center gap-10 lg:grid-cols-[1.4fr_1fr]">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Mulai Rencanakan Keuangan Anda Hari Ini</h2>
              <p className="mt-4 max-w-xl text-blue-50/90">Daftar sebagai anggota dan lihat simulasi cicilan beserta seluruh biayanya tanpa komitmen.</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link className="inline-flex h-12 items-center rounded-[10px] bg-white px-6 text-sm font-bold text-primary transition hover:bg-blue-50" href="/register">Jadi Anggota</Link>
                <Link className="inline-flex h-12 items-center rounded-[10px] border-2 border-white px-6 text-sm font-bold text-white transition hover:bg-white/10" href="/kontak">Hubungi Kami</Link>
              </div>
            </div>
            <div aria-hidden className="hidden justify-center lg:flex">
              <div className="w-52 rotate-3 rounded-[2rem] border-4 border-[#0B1438] bg-[#0B1438] p-2 shadow-2xl">
                <div className="rounded-[1.5rem] bg-slate-50 p-3 pb-4">
                  <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-slate-300" />
                  <p className="text-[10px] font-semibold text-slate-500">Halo, Budi</p>
                  <div className="mt-2 rounded-2xl bg-gradient-to-br from-[#1A2A6C] to-[#1E5FC7] p-3 text-white">
                    <p className="text-[9px] uppercase tracking-wider text-blue-100">Saldo Simpanan</p>
                    <p className="mt-1 font-heading text-lg font-bold">Rp 12.450.000</p>
                    <div className="mt-3 flex items-center justify-between text-[9px] text-blue-100"><span>BuyaLater</span><span>•••• 2026</span></div>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2">{["Simpan", "Pinjam", "Bayar"].map((x) => <div className="rounded-lg bg-white py-2 text-center text-[9px] font-semibold text-primary shadow-sm" key={x}>{x}</div>)}</div>
                  <div className="mt-3 space-y-1.5"><div className="h-2 w-full rounded bg-slate-200" /><div className="h-2 w-2/3 rounded bg-slate-200" /></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <footer className="relative overflow-hidden bg-[#0B1438] text-white">
        <Image alt="" aria-hidden className="pointer-events-none absolute -bottom-24 -right-24 h-[28rem] w-auto opacity-[0.03]" height={448} src="/images/logo-icon.png" width={448} />
        <div className="relative mx-auto max-w-7xl px-5 pt-36 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr_1fr_1fr_1.4fr] lg:gap-10">
            <div>
              <Logo height={48} variant="putih" />
              <p className="mt-4 text-sm leading-6 text-blue-100/80">{situs.deskripsi}</p>
              <div className="mt-5 flex flex-wrap gap-3">{situs.sosial.map((item) => { const Icon = IKON_SOSIAL[item.platform]; return <a aria-label={NAMA_SOSIAL[item.platform]} className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white transition hover:border-secondary hover:bg-secondary/20 hover:text-accent" href={item.url} key={item.id} rel="noopener noreferrer" target="_blank"><Icon /></a>; })}</div>
            </div>
            <div className="lg:contents">
              {KOLOM.map((kolom) => <FooterKolom judul={KOLOM_LABEL[kolom]} key={kolom}><nav aria-label={KOLOM_LABEL[kolom]}><ul className="space-y-3">{situs.menu[kolom].map((item) => <li key={item.id}>{/^https?:\/\//.test(item.href) ? <a className={linkClass} href={item.href} rel="noopener noreferrer" target="_blank">{item.label}</a> : <Link className={linkClass} href={item.href}>{item.label}</Link>}</li>)}</ul></nav></FooterKolom>)}
            </div>
            <div><h2 className="text-sm font-bold uppercase tracking-wider text-accent">Kantor Pusat</h2>
              <ul className="mt-4 space-y-3 text-sm text-blue-100/80">
                <li className="flex gap-3"><MapPin aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-accent" />{situs.alamat}</li>
                <li className="flex gap-3"><Phone aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-accent" /><a className="hover:text-white" href={`tel:+${normalisasiNoHp(situs.telepon.replace(/[()]/g, ""))}`}>{situs.telepon}</a></li>
                <li className="flex gap-3"><Mail aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-accent" /><a className="hover:text-white" href={`mailto:${situs.email}`}>{situs.email}</a></li>
                <li className="flex gap-3"><Clock aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-accent" />{situs.jam}</li>
              </ul>
              <Link className="mt-4 inline-block text-sm font-semibold text-accent hover:text-white" href="/kantor-cabang">Lihat semua kantor cabang →</Link>
            </div>
          </div>

          <div className="mt-12 flex flex-col gap-4 border-t border-white/10 py-8 lg:flex-row lg:items-center lg:justify-between"><h2 className="max-w-sm font-bold">Dapatkan info promo dan tips keuangan setiap bulan</h2><NewsletterForm /></div>

          {situs.metode.length > 0 && <div className="flex flex-col gap-3 border-t border-white/10 py-6 sm:flex-row sm:items-center"><p className="text-xs font-bold uppercase tracking-wider text-blue-200/70">Metode pembayaran</p><ul className="flex flex-wrap gap-2">{situs.metode.map((item) => <li className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-blue-50" key={item.id}><DynamicIcon className="h-4 w-4 text-accent" name={item.ikon} />{item.nama}</li>)}</ul></div>}

          <div className="border-t border-white/10 pb-24 pt-6 sm:pb-8">
            <div className="flex flex-col gap-3 text-sm text-blue-100/80 sm:flex-row sm:items-center sm:justify-between"><p>© 2026 {situs.namaInstansi}. Hak cipta dilindungi.</p><ul className="flex flex-wrap gap-x-6 gap-y-2"><li><Link className="hover:text-white" href="/syarat-ketentuan">Syarat &amp; Ketentuan</Link></li><li><Link className="hover:text-white" href="/kebijakan-privasi">Kebijakan Privasi</Link></li><li><Link className="hover:text-white" href="/keamanan">Keamanan</Link></li></ul></div>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center"><Image alt="Logo OJK" className="h-12 w-auto shrink-0 self-start rounded-md bg-white" height={48} src="/images/logo-ojk.jpg" width={72} /><p className="text-xs leading-5 text-blue-100/80">BuyaLater adalah koperasi simpan pinjam yang hanya melayani anggota. Suku bunga mengacu pada Permenkop UKM 8/2023 dan penagihan mengikuti prinsip POJK 22/2023.</p></div>
            <p className="mt-3 text-xs text-blue-200/60">Website ini merupakan proyek tugas akademik. Seluruh data, angka, testimoni, dan mitra bersifat fiktif.</p>
          </div>
        </div>
      </footer>
      <WhatsAppFloat nomor={situs.whatsapp} />
    </>
  );
}
