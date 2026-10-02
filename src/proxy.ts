import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { bolehAkses } from "@/lib/akses";

export default auth((request) => {
  if (!request.auth?.user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Peran tidak sesuai → tampilkan 404 (bukan 403 atau redirect) supaya keberadaan halaman tidak terbongkar.
  const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");
  const role = request.auth.user.role;
  // Untuk /admin, peran dicocokkan per bagian menu di sini supaya status HTTP-nya benar-benar 404 (sebelum halaman mulai di-stream).
  // Pemeriksaan di halaman/Server Action tetap berjalan dan membaca peran terbaru dari database.
  const boleh = isAdminRoute ? role !== "ANGGOTA" && bolehAkses(role, request.nextUrl.pathname) : role === "ANGGOTA";
  if (!boleh) return NextResponse.rewrite(new URL("/404", request.url), { status: 404 });

  return NextResponse.next();
});

export const config = { matcher: ["/anggota/:path*", "/admin/:path*"] };
