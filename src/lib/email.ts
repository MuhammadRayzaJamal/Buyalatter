import path from "node:path";
import nodemailer from "nodemailer";
import { formatRupiah, formatTanggal } from "@/lib/format";
import { dec, type MasukanUang } from "@/lib/uang";

/** Meng-escape teks sebelum disisipkan ke HTML email (nama atau tautan tidak boleh menyuntikkan tag). */
export const esc = (nilai: string) => nilai.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

const NAVY = "#1A2A6C";
const BLUE = "#1E5FC7";
const SKY = "#4FB8EC";

export function emailTerkonfigurasi() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

let transporter: nodemailer.Transporter | null = null;
function getTransporter() {
  transporter ??= nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 2525),
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return transporter;
}

const LOGO_CID = "logo-buyalater@buyalater";
const LOGO_PATH = path.join(process.cwd(), "public", "images", "logo-buyalater-putih.png");

export type DataEmailAngsuran = {
  nama: string;
  angsuranKe: number;
  jumlah: MasukanUang;
  denda: MasukanUang;
  jatuhTempo: Date;
  hariTerlambat: number;
  link: string;
};

export function templateEmailAngsuran(data: DataEmailAngsuran) {
  const terlambat = data.hariTerlambat > 0;
  const aksen = terlambat ? "#dc2626" : BLUE;
  const judul = terlambat ? "Angsuran Anda Terlambat" : "Pengingat Jatuh Tempo Angsuran";
  const intro = terlambat
    ? `Angsuran ke-${data.angsuranKe} Anda sudah terlambat <strong>${data.hariTerlambat} hari</strong>. Mohon segera lakukan pembayaran agar denda tidak bertambah.`
    : `Angsuran ke-${data.angsuranKe} Anda akan jatuh tempo pada <strong>${formatTanggal(data.jatuhTempo)}</strong>. Mohon siapkan pembayaran tepat waktu.`;
  const baris = (label: string, nilai: string, tebal = false) =>
    `<tr><td style="padding:10px 0;color:#64748b;font-size:14px;border-bottom:1px solid #e2e8f0">${label}</td><td style="padding:10px 0;text-align:right;font-size:14px;border-bottom:1px solid #e2e8f0;${tebal ? "font-weight:700;color:#0f172a" : "color:#334155"}">${nilai}</td></tr>`;
  const html = `<!doctype html><html lang="id"><body style="margin:0;padding:24px;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden">
<tr><td style="background:${NAVY};background-image:linear-gradient(90deg,${NAVY},${BLUE},${SKY});padding:20px 32px"><img src="cid:${LOGO_CID}" alt="BuyaLater" height="44" style="display:block;height:44px;width:auto;border:0" /></td></tr>
<tr><td style="padding:32px">
<div style="height:4px;width:48px;background:${aksen};border-radius:2px;margin-bottom:16px"></div>
<h1 style="margin:0 0 12px;font-size:22px;color:#0f172a">${judul}</h1>
<p style="margin:0 0 8px;font-size:15px;color:#334155;line-height:1.6">Halo ${esc(data.nama)},</p>
<p style="margin:0 0 20px;font-size:15px;color:#334155;line-height:1.6">${intro}</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px">
${baris("Angsuran ke", String(data.angsuranKe))}${baris("Jatuh tempo", formatTanggal(data.jatuhTempo))}${baris("Nominal angsuran", formatRupiah(data.jumlah))}${baris("Denda", dec(data.denda).gt(0) ? formatRupiah(data.denda) : "-")}${baris("Total tagihan", formatRupiah(dec(data.jumlah).plus(dec(data.denda))), true)}
</table>
<a href="${esc(data.link)}" style="display:inline-block;background:${BLUE};color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 24px;border-radius:8px">Bayar Sekarang</a>
</td></tr>
<tr><td style="background:#f8fafc;padding:20px 32px;font-size:12px;color:#94a3b8;line-height:1.6">Email ini dikirim otomatis oleh sistem BuyaLater. Abaikan jika Anda sudah melakukan pembayaran.</td></tr>
</table></td></tr></table></body></html>`;
  return { subject: `${terlambat ? "[Terlambat]" : "[Pengingat]"} Angsuran ke-${data.angsuranKe} — BuyaLater`, html };
}

/** Mengirim email; tidak pernah melempar error supaya pengecekan harian tidak terhenti. */
export async function kirimEmail(to: string, subject: string, html: string): Promise<string> {
  if (!emailTerkonfigurasi()) return "TIDAK_DIKONFIGURASI";
  try {
    await getTransporter().sendMail({ from: process.env.MAIL_FROM ?? "BuyaLater <noreply@buyalatter.com>", to, subject, html, attachments: html.includes(`cid:${LOGO_CID}`) ? [{ filename: "logo-buyalater.png", path: LOGO_PATH, cid: LOGO_CID }] : [] });
    return "TERKIRIM";
  } catch (error) {
    return `GAGAL: ${error instanceof Error ? error.message : "kesalahan tidak diketahui"}`.slice(0, 190);
  }
}

/** Email tautan reset password (berlaku 1 jam). Di lingkungan non-produksi tautan juga dicetak ke log server agar bisa dicoba tanpa SMTP. */
export async function kirimEmailResetPassword(to: string, nama: string, link: string) {
  if (process.env.NODE_ENV !== "production") console.info(`[reset-password] tautan untuk ${to}: ${link}`);
  const html = `<!doctype html><html lang="id"><body style="margin:0;padding:24px;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden">
<tr><td style="background:${NAVY};background-image:linear-gradient(90deg,${NAVY},${BLUE},${SKY});padding:20px 32px"><img src="cid:${LOGO_CID}" alt="BuyaLater" height="44" style="display:block;height:44px;width:auto;border:0" /></td></tr>
<tr><td style="padding:32px">
<h1 style="margin:0 0 12px;font-size:22px;color:#0f172a">Atur ulang password</h1>
<p style="margin:0 0 8px;font-size:15px;color:#334155;line-height:1.6">Halo ${esc(nama)},</p>
<p style="margin:0 0 20px;font-size:15px;color:#334155;line-height:1.6">Kami menerima permintaan untuk mengatur ulang password akun BuyaLater Anda. Tautan di bawah berlaku <strong>1 jam</strong> dan hanya dapat dipakai sekali.</p>
<a href="${esc(link)}" style="display:inline-block;background:${BLUE};color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 24px;border-radius:8px">Atur Ulang Password</a>
<p style="margin:24px 0 0;font-size:13px;color:#64748b;line-height:1.6">Jika Anda tidak merasa meminta ini, abaikan email ini; password Anda tidak akan berubah.</p>
</td></tr></table></td></tr></table></body></html>`;
  return kirimEmail(to, "Atur ulang password — BuyaLater", html);
}
