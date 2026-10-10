import { describe, expect, it } from "vitest";
import { periksaBatas } from "./batas-laju";

describe("periksaBatas", () => {
  it("menolak setelah melewati batas dan pulih setelah jendela lewat", () => {
    const t0 = 1_000_000;
    for (let i = 0; i < 3; i++) expect(periksaBatas("uji-a", 3, 60_000, t0 + i).boleh).toBe(true);
    const ditolak = periksaBatas("uji-a", 3, 60_000, t0 + 10);
    expect(ditolak.boleh).toBe(false);
    expect(ditolak.tungguDetik).toBeGreaterThan(0);
    expect(periksaBatas("uji-a", 3, 60_000, t0 + 61_000).boleh).toBe(true);
  });
  it("kunci berbeda tidak saling memengaruhi", () => {
    for (let i = 0; i < 2; i++) periksaBatas("uji-b", 2, 60_000, 5);
    expect(periksaBatas("uji-b", 2, 60_000, 6).boleh).toBe(false);
    expect(periksaBatas("uji-c", 2, 60_000, 6).boleh).toBe(true);
  });
});
