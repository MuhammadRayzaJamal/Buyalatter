import { describe, expect, it } from "vitest";
import { esc, templateEmailAngsuran } from "./email";

describe("escape HTML email", () => {
  it("esc mengubah karakter berbahaya", () => {
    expect(esc(`<img src=x onerror="a()">&'`)).toBe("&lt;img src=x onerror=&quot;a()&quot;&gt;&amp;&#39;");
  });
  it("nama berisi tag tidak lolos ke HTML email", () => {
    const { html } = templateEmailAngsuran({ nama: "<script>alert(1)</script>", angsuranKe: 1, jumlah: 100000, denda: 0, jatuhTempo: new Date("2026-10-10"), hariTerlambat: 0, link: 'http://x/"><b>' });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain('"><b>');
  });
});
