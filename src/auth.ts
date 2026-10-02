import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { catatLogin, sisaMenitKunci } from "@/lib/login-aman";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validasi";

/** Kode galat khusus agar form login bisa menampilkan pesan "akun terkunci". */
export class AkunTerkunci extends CredentialsSignin {
  code = "terkunci";
}

/** Sesi berakhir bila tidak ada aktivitas 30 menit: token berumur 30 menit dan diperpanjang tiap kali sesi dipakai (maks. sekali per menit). */
const SESI_DETIK = 30 * 60;

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

      const user = await prisma.user.findUnique({ where: { email }, include: { anggota: true } });
      const cocok = user ? await bcrypt.compare(password, user.password) : false;
      // Anggota yang sudah di-soft-delete tidak boleh masuk lagi.
      const aktif = user && !(user.role === "ANGGOTA" && (!user.anggota || user.anggota.deletedAt));
      if (!user || !cocok || !aktif) {
        await catatLogin(email, false, ip);
        if ((await sisaMenitKunci(email)) > 0) throw new AkunTerkunci();
        return null;
      }
      await catatLogin(email, true, ip);
      return { id: user.id, name: user.nama, email: user.email, role: user.role, anggotaId: user.anggota?.id };
    },
  })],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
        token.anggotaId = user.anggotaId;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "ADMIN" | "MANAJER" | "TELLER" | "ANGGOTA";
        session.user.anggotaId = token.anggotaId as string | undefined;
      }
      return session;
    },
  },
});
