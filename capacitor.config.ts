// Mode koneksi aplikasi mobile ke server Next.js di laptop:
//   CAP_MODE=usb  (bawaan) -> http://localhost:3000, dipakai bersama `adb reverse` (Android) dan simulator iOS
//   CAP_MODE=wifi          -> CAP_SERVER_URL, contoh http://192.168.1.10:3000 (IP laptop)
// Saat mode usb, NEXTAUTH_URL tetap http://localhost:3000.
const mode = process.env.CAP_MODE === "wifi" ? "wifi" : "usb";
const url = mode === "wifi" ? process.env.CAP_SERVER_URL : "http://localhost:3000";

if (mode === "wifi" && !url) throw new Error("CAP_MODE=wifi membutuhkan CAP_SERVER_URL, contoh: CAP_SERVER_URL=http://192.168.1.10:3000");

const config = {
  appId: "id.buyalater.app",
  appName: "BuyaLater",
  webDir: "cap-shell",
  server: { url, cleartext: true, errorPath: "index.html" },
};

export default config;
