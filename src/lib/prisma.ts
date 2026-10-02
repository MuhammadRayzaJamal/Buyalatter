import { PrismaClient } from "@prisma/client";

const SOFT_DELETE_MODEL = new Set(["Anggota", "Galeri", "Artikel", "Mitra"]);
const BACA_FILTER = ["findMany", "findFirst", "findFirstOrThrow", "findUnique", "findUniqueOrThrow", "count", "aggregate", "groupBy"];
const APPEND_ONLY = ["update", "updateMany", "upsert", "delete", "deleteMany"];

function buatClient() {
  const dasar = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

  return dasar.$extends({
    name: "keamanan-data",
    query: {
      // Soft delete: baris dengan deletedAt terisi disembunyikan dari semua pembacaan kecuali where.deletedAt diberikan eksplisit.
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (SOFT_DELETE_MODEL.has(model) && BACA_FILTER.includes(operation)) {
            const where = ((args as { where?: Record<string, unknown> }).where ?? {}) as Record<string, unknown>;
            if (!("deletedAt" in where)) (args as { where?: Record<string, unknown> }).where = { ...where, deletedAt: null };
          }
          // Buku mutasi dan audit log tidak boleh diedit atau dihapus lewat aplikasi.
          if ((model === "Mutasi" || model === "AuditLog") && APPEND_ONLY.includes(operation)) {
            throw new Error(`${model} bersifat append-only dan tidak dapat diubah atau dihapus.`);
          }
          return query(args);
        },
      },
    },
  });
}

type ClientDiperluas = ReturnType<typeof buatClient>;

const globalForPrisma = globalThis as unknown as { prismaAman: ClientDiperluas | undefined };

export const prisma = globalForPrisma.prismaAman ?? buatClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prismaAman = prisma;

/** Tipe klien di dalam `prisma.$transaction(async (tx) => ...)`. */
export type Tx = Parameters<Extract<Parameters<typeof prisma.$transaction>[0], (...args: never[]) => unknown>>[0];
