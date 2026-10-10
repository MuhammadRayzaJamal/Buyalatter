import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { ambilTema } from "@/lib/tema";

export default async function PublicLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const tema = await ambilTema();
  return <div className={`flex min-h-screen flex-col tema-latar ${tema === "gelap" ? "dark" : ""}`} data-tema-root><Navbar /><main className="flex-1">{children}</main><Footer /></div>;
}