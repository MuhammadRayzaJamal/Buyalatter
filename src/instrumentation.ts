export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { mulaiCronJatuhTempo } = await import("@/lib/cron");
    mulaiCronJatuhTempo();
  }
}
