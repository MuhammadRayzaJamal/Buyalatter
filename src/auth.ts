import NextAuth, { CredentialsSignin } from "next-auth";
import Apple from "next-auth/providers/apple";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcrypt";
import { catatKunci, hitungKunci } from "@/lib/batas-laju";
import { catatLogin, sisaMenitKunci } from "@/lib/login-aman";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validasi";

/** Kode galat khusus agar form login bisa menampilkan pesan "akun terkunci". */
export class AkunTerkunci extends CredentialsSignin {
  code = "terkunci";
}

/** Sesi berakhir bila tidak ada aktivitas 30 menit: token berumur 30 menit dan diperpanjang tiap kali sesi dipakai (maks. sekali per menit). */
const SESI_DETIK = 30 * 60;

/** Batas percobaan login gagal per alamat IP dalam 15 menit (di atas penguncian per akun). */
const BATAS_GAGAL_PER_IP = 20;

// Peringatan keras bila server production berjalan dengan secret bawaan/pendek (token sesi bisa dipalsukan).
if (process.env.NODE_ENV === "production" && process.env.NEXT_PHASE !== "phase-production-build") {
  const secret = process.env.AUTH_SECRET ?? "";
  if (secret.length < 32 || /development|ganti-dengan|changeme/i.test(secret)) console.error("[KEAMANAN] AUTH_SECRET lemah atau masih bawaan. Buat yang baru: openssl rand -base64 32");
}

/** Login sosial hanya aktif bila kredensial OAuth-nya diisi di .env (lihat docs/LOGIN-SOSIAL.md). */
export const loginSosialAktif = {
  google: Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET),
  apple: Boolean(process.env.AUTH_APPLE_ID && process.env.AUTH_APPLE_SECRET),
};

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt", maxAge: SESI_DETIK, updateAge: 60 },
  pages: { signIn: "/login" },
  providers: [Credentials({
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials, request) {
      const parsed = loginSchema.safeParse(credentials);
      if (!parsed.success) return null;
      const { email, password } = parsed.data;
      const ip = request?.headers?.get("x-forwarded-for")?.split(",")[0]?.trim() || request?.headers?.get("x-real-ip") || null;

      if ((await sisaMenitKunci(email)) > 0) throw new AkunTerkunci();
      // Tameng penebakan sandi lintas akun: terlalu banyak kegagalan dari satu IP dalam 15 menit memblokir IP itu sementara.
      const kunciIp = ip ? `login-gagal:${ip}` : null;
      if (kunciIp && (await hitungKunci(kunciIp, 15 * 60_000).catch(() => 0)) >= BATAS_GAGAL_PER_IP) throw new AkunTerkunci();

      const user = await prisma.user.findUnique({ where: { email }, include: { anggota: true } });
      const cocok = user ? await bcrypt.compare(password, user.password) : false;
      // Anggota yang di-soft-delete atau sudah menutup akunnya tidak boleh masuk lagi.
      const aktif = user && !(user.role === "ANGGOTA" && (!user.anggota || user.anggota.deletedAt || user.anggota.ditutupPada));
      if (!user || !cocok || !aktif) {
        await catatLogin(email, false, ip);
        if (kunciIp) await catatKunci(kunciIp).catch(() => undefined);
        if ((await sisaMenitKunci(email)) > 0) throw new AkunTerkunci();
        return null;
      }
      await catatLogin(email, true, ip);
      return { id: user.id, name: user.nama, email: user.email, role: user.role, anggotaId: user.anggota?.id };
    },
  }), ...(loginSosialAktif.google ? [Google] : []), ...(loginSosialAktif.apple ? [Apple] : [])],
  callbacks: {
    /** Login Google/Apple hanya untuk anggota yang SUDAH terdaftar (email terverifikasi sama dengan akun). Pendaftaran tetap lewat form (butuh KTP/NIK); staf wajib memakai password. */
    async signIn({ account, profile }) {
      if (!account || account.provider === "credentials") return true;
      const email = profile?.email?.toLowerCase();
      const terverifikasi = profile?.email_verified === true || (profile?.email_verified as unknown) === "true";
      if (!email || !terverifikasi) return "/login?error=sosial-email";
      const user = await prisma.user.findUnique({ where: { email }, include: { anggota: true } });
      if (!user || user.role !== "ANGGOTA") return "/login?error=sosial-belum";
      if (!user.anggota || user.anggota.deletedAt || user.anggota.ditutupPada) return "/login?error=sosial-belum";
      if ((await sisaMenitKunci(email)) > 0) return "/login?error=sosial-kunci";
      await catatLogin(email, true, null);
      return true;
    },
    async jwt({ token, user, account }) {
      if (account && account.provider !== "credentials" && token.email) {
        const db = await prisma.user.findUnique({ where: { email: token.email.toLowerCase() }, include: { anggota: true } });
        if (db) {
          token.id = db.id;
          token.name = db.nama;
          token.role = db.role;
          token.anggotaId = db.anggota?.id;
        }
        token.terbit = Date.now();
        return token;
      }
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
        token.anggotaId = user.anggotaId;
        token.terbit = Date.now();
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "ADMIN" | "MANAJER" | "TELLER" | "ANGGOTA";
        session.user.anggotaId = token.anggotaId as string | undefined;
        session.user.terbit = token.terbit as number | undefined;
      }
      return session;
    },
  },
});
