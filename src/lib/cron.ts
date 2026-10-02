import cron from "node-cron";
import { cekJatuhTempo } from "@/lib/cekJatuhTempo";

const globalForCron = globalThis as unknown as { buyalatterCron?: boolean };

/** Jadwal harian 08.00 WIB. Flag global mencegah jadwal terdaftar ganda saat hot-reload. */
export function mulaiCronJatuhTempo() {
  if (globalForCron.buyalatterCron) return;
  globalForCron.buyalatterCron = true;
  cron.schedule("0 8 * * *", async () => {
    try {
      const hasil = await cekJatuhTempo();
      console.log("[cron] pengecekan jatuh tempo selesai", hasil);
    } catch (error) {
      console.error("[cron] pengecekan jatuh tempo gagal", error);
    }
  }, { timezone: "Asia/Jakarta" });
  console.log("[cron] pengecekan jatuh tempo dijadwalkan setiap hari 08.00 WIB");
}
