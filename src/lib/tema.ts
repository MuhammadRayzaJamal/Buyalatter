import { cookies } from "next/headers";

export const KUNCI_TEMA = "bl-tema";
export type Tema = "gelap" | "terang";

/** Tema dashboard dari cookie; bawaannya gelap (admin dan portal anggota). */
export async function ambilTema(): Promise<Tema> {
  const nilai = (await cookies()).get(KUNCI_TEMA)?.value;
  return nilai === "terang" ? "terang" : "gelap";
}
