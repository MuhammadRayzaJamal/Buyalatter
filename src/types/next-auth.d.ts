import type { DefaultSession } from "next-auth";

type Peran = "ADMIN" | "MANAJER" | "TELLER" | "ANGGOTA";

declare module "next-auth" {
  interface User {
    role: Peran;
    anggotaId?: string;
  }

  interface Session {
    user: {
      id: string;
      role: Peran;
      anggotaId?: string;
      terbit?: number;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Peran;
    anggotaId?: string;
    terbit?: number;
  }
}
