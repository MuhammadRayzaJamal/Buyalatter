const GELAR_DEPAN = new Set(["dr", "drs", "dra", "ir", "prof", "h", "hj", "haji", "hajjah", "kh", "ust", "ustadz", "ustadzah", "mr", "mrs", "ms"]);
const GELAR_BELAKANG = new Set(["mba", "phd", "cpa", "se", "sh", "st", "mm", "msi", "mkom", "skom", "spd", "mpd", "ssos", "spsi", "skep", "sked", "sag", "ma", "mhum", "shi", "mh", "ak", "amd"]);

/** Nama tanpa gelar, huruf kecil, tanpa tanda baca: "Dr. H. Budi Santoso, S.E., M.M." → "budi santoso". */
export function normalisasiNama(nama: string) {
  const tanpaKoma = nama.split(",")[0];
  const token = tanpaKoma
    .toLowerCase()
    .replace(/[^a-z\s.]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((t) => t.replace(/\./g, ""))
    .filter(Boolean);
  while (token.length > 1 && GELAR_DEPAN.has(token[0])) token.shift();
  while (token.length > 1 && GELAR_BELAKANG.has(token[token.length - 1])) token.pop();
  return token.join(" ");
}

/** Nama pemilik rekening harus sama dengan nama anggota (abaikan huruf besar/kecil, spasi ganda, dan gelar). */
export function namaSama(a: string, b: string) {
  return normalisasiNama(a) === normalisasiNama(b);
}
