import { requireAnggota } from "@/lib/otorisasi";
import { prisma } from "@/lib/prisma";
import { MemberSidebar } from "@/components/layout/member-sidebar";
import { NotifikasiBell } from "@/components/layout/notifikasi-bell";
import { ambilTema } from "@/lib/tema";

const waktu = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" });

export default async function MemberLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const anggota = await requireAnggota();
  const tema = await ambilTema();
  const userId = anggota.userId;
  const [latest, unread] = await Promise.all([
    prisma.notifikasi.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.notifikasi.count({ where: { userId, sudahDibaca: false } }),
  ]);
  const notif = { unread, items: latest.map((item) => ({ id: item.id, judul: item.judul, pesan: item.pesan, tipe: item.tipe, sudahDibaca: item.sudahDibaca, waktu: waktu.format(item.createdAt) })) };
  return <div className={`min-h-screen tema-latar ${tema === "gelap" ? "dark" : ""}`} data-tema-root><MemberSidebar memberFoto={anggota.foto ?? null} memberName={anggota.user.nama} notif={notif} /><main className="min-h-screen transition-[padding] duration-200 lg:pl-(--sidebar-w) print:pl-0"><div className="mx-auto max-w-7xl p-5 lg:p-8"><div className="mb-6 hidden justify-end lg:flex"><NotifikasiBell items={notif.items} unread={notif.unread} /></div>{children}</div></main></div>;
}
