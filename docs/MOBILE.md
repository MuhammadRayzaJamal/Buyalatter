# BuyaLater Mobile (Capacitor)

Aplikasi mobile membuka server Next.js di laptop lewat WebView. Mode koneksi dipilih dengan variabel `CAP_MODE` (dibaca di `capacitor.config.ts`):

| Mode | `server.url` | Script |
|---|---|---|
| `usb` (bawaan) | `http://localhost:3000` | `npm run android:usb`, `npm run ios:sim` |
| `wifi` | `CAP_SERVER_URL` (IP laptop, mis. `http://192.168.1.10:3000`) | `npm run android:wifi` |

Pada mode `usb`, `NEXTAUTH_URL` tetap `http://localhost:3000`. Pada mode `wifi`, set `NEXTAUTH_URL` sama dengan `CAP_SERVER_URL`.

## Mode Kabel USB

Mode ini tidak membutuhkan Wi-Fi yang sama antara laptop dan HP.

### 1. Aktifkan Opsi Developer dan USB Debugging (Android)
1. Buka **Pengaturan → Tentang ponsel**, ketuk **Nomor build** 7 kali sampai muncul "Anda sekarang adalah developer".
2. Buka **Pengaturan → Sistem → Opsi developer** (letaknya bisa berbeda per merek).
3. Aktifkan **USB debugging**.
4. Colokkan kabel ke laptop, lalu setujui dialog **Izinkan debugging USB** di HP (centang "Selalu izinkan").

### 2. Cek perangkat terhubung
```bash
adb devices
```
HP harus muncul dengan status `device`. Jika `unauthorized`, setujui ulang dialog di HP. Jika kosong, ganti kabel (pakai kabel data, bukan kabel khusus charger) atau port USB.

### 3. Jalankan adb reverse
```bash
npm run usb:reverse      # sama dengan: adb reverse tcp:3000 tcp:3000
```
Perintah ini membuat `localhost:3000` di HP menunjuk ke `localhost:3000` di laptop. Setelah itu jalankan `npm run dev` dan `npm run android:usb` (script ini sudah menjalankan `adb reverse` sendiri).

> **Catatan:** `adb reverse` hilang saat kabel dicabut, HP restart, atau `adb` di-restart. Ulangi `npm run usb:reverse` setiap kali menyambungkan kabel kembali, lalu tekan **Coba Lagi** di halaman offline aplikasi.

### iOS
- **Simulator:** `npm run ios:sim` (simulator berbagi `localhost` dengan laptop, tidak perlu `adb reverse`).
- **iPhone asli lewat Hotspot Pribadi via kabel:** `adb` tidak berlaku untuk iPhone.
  1. Colokkan iPhone ke Mac dengan kabel, lalu aktifkan **Pengaturan → Hotspot Pribadi** di iPhone.
  2. Di Mac, pilih jaringan iPhone tersebut (muncul sebagai antarmuka USB/Hotspot) sehingga Mac dan iPhone berada di satu jaringan.
  3. Cari IP Mac pada jaringan itu (`ipconfig getifaddr en0`, atau antarmuka hotspot yang muncul di Pengaturan Jaringan).
  4. Jalankan dengan mode wifi: `CAP_MODE=wifi CAP_SERVER_URL=http://<IP-Mac>:3000 npx cap sync ios`, set `NEXTAUTH_URL` ke alamat yang sama, lalu jalankan dari Xcode.
