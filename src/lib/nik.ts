/** NIK tersamar: 3201********0001 (4 digit awal dan 4 digit akhir). Halaman admin menampilkan NIK utuh. */
export function samarkanNik(nik: string) {
  const digit = nik.replace(/\s/g, "");
  if (digit.length < 9) return "*".repeat(digit.length);
  return `${digit.slice(0, 4)}${"*".repeat(digit.length - 8)}${digit.slice(-4)}`;
}
