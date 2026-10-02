import { describe, expect, it } from "vitest";
import { deteksiJenis } from "./berkas-jenis";

const b = (...byte: number[]) => Buffer.from([...byte, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

describe("deteksiJenis (magic bytes)", () => {
  it("mengenali JPEG, PNG, PDF, GIF, WEBP dari isi, bukan ekstensi", () => {
    expect(deteksiJenis(b(0xff, 0xd8, 0xff, 0xe0))?.mime).toBe("image/jpeg");
    expect(deteksiJenis(b(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a))?.mime).toBe("image/png");
    expect(deteksiJenis(Buffer.from("%PDF-1.7\n..."))?.mime).toBe("application/pdf");
    expect(deteksiJenis(Buffer.from("GIF89a....."))?.mime).toBe("image/gif");
    expect(deteksiJenis(Buffer.from("RIFF\0\0\0\0WEBPVP8 "))?.mime).toBe("image/webp");
  });

  it("menolak berkas yang menyamar (HTML/script/exe berekstensi gambar)", () => {
    expect(deteksiJenis(Buffer.from("<html><script>alert(1)</script></html>"))).toBeNull();
    expect(deteksiJenis(Buffer.from("MZ\x90\x00\x03"))).toBeNull();
    expect(deteksiJenis(Buffer.from("<svg onload=alert(1)>"))).toBeNull();
    expect(deteksiJenis(Buffer.alloc(0))).toBeNull();
  });
});
