import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const baca = (...bagian: string[]) => readFileSync(path.join(process.cwd(), ...bagian), "utf8");

/** Kebijakan privasi: aplikasi seluler tidak boleh meminta izin kontak, galeri, SMS, atau lokasi; hanya kamera untuk KTP. */
describe("izin aplikasi mobile (Capacitor)", () => {
  const manifest = baca("android", "app", "src", "main", "AndroidManifest.xml");
  const izinAndroid = [...manifest.matchAll(/<uses-permission[^>]*android:name="([^"]+)"/g)].map((m) => m[1].replace("android.permission.", ""));

  it("Android hanya meminta INTERNET dan CAMERA", () => {
    expect(izinAndroid.sort()).toEqual(["CAMERA", "INTERNET"]);
  });
  it("Android tidak meminta kontak, galeri/penyimpanan, SMS, atau lokasi", () => {
    for (const terlarang of ["READ_CONTACTS", "WRITE_CONTACTS", "GET_ACCOUNTS", "READ_SMS", "RECEIVE_SMS", "SEND_SMS", "READ_EXTERNAL_STORAGE", "WRITE_EXTERNAL_STORAGE", "READ_MEDIA_IMAGES", "READ_MEDIA_VIDEO", "ACCESS_FINE_LOCATION", "ACCESS_COARSE_LOCATION"]) expect(izinAndroid).not.toContain(terlarang);
  });

  const plist = baca("ios", "App", "App", "Info.plist");
  const kunciUsage = [...plist.matchAll(/<key>(NS[A-Za-z]+UsageDescription)<\/key>/g)].map((m) => m[1]);
  it("iOS hanya mendeklarasikan penggunaan kamera", () => {
    expect(kunciUsage).toEqual(["NSCameraUsageDescription"]);
  });

  it("tidak memasang plugin Capacitor untuk kontak, lokasi, atau galeri", () => {
    const paket = JSON.parse(baca("package.json")) as { dependencies: Record<string, string> };
    const terpasang = Object.keys(paket.dependencies).filter((n) => n.startsWith("@capacitor/"));
    for (const plugin of ["@capacitor/contacts", "@capacitor/geolocation", "@capacitor/camera", "@capacitor/filesystem", "@capacitor-community/contacts"]) expect(terpasang).not.toContain(plugin);
  });
});
