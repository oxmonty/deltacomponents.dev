import { describe, it, expect } from "vitest";
import { collectToc } from "../scripts/build-toc";
import { TOC } from "../lib/docs/toc.generated";
import { componentList } from "../lib/docs/components";

describe("table of contents", () => {
  it("matches the doc pages it was generated from", () => {
    // The manifest is committed, so it can go stale the moment a section is
    // added or renamed. This is the guard: regenerate in memory and compare.
    // If it fails, run `make toc`.
    expect(TOC).toEqual(collectToc());
  });

  it("lists every component page", () => {
    for (const entry of componentList) {
      expect(TOC[`/docs/${entry.slug}`]?.length ?? 0).toBeGreaterThan(1);
    }
  });

  it("opens each component page with its Installation section", () => {
    for (const entry of componentList) {
      expect(TOC[`/docs/${entry.slug}`]?.[0]).toEqual({
        id: "installation",
        text: "Installation",
        depth: 2,
      });
    }
  });

  it("gives every entry a usable anchor", () => {
    for (const entries of Object.values(TOC)) {
      for (const entry of entries) {
        expect(entry.id).toMatch(/^[^\s]+$/);
        expect(entry.text.trim()).not.toBe("");
      }
    }
  });
});
