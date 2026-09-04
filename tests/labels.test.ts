import { describe, it, expect } from "vitest";
import { toLabel, labelOf, componentList } from "../lib/docs/components";

describe("toLabel", () => {
  it("splits PascalCase into words", () => {
    expect(toLabel("CodeBlock")).toBe("Code Block");
    expect(toLabel("AskUserQuestions")).toBe("Ask User Questions");
    expect(toLabel("TabsSubtle")).toBe("Tabs Subtle");
  });

  it("leaves a single word alone", () => {
    for (const name of ["Button", "Switch", "Tooltip", "Sidebar"]) {
      expect(toLabel(name)).toBe(name);
    }
  });

  it("keeps acronym runs together", () => {
    // The naive one-pass split would give "A P I Key".
    expect(toLabel("APIKey")).toBe("API Key");
    expect(toLabel("HTMLPreview")).toBe("HTML Preview");
  });

  it("splits a digit-to-capital boundary", () => {
    expect(toLabel("H1Heading")).toBe("H1 Heading");
  });
});

describe("labelOf", () => {
  it("prefers an explicit label over the derived one", () => {
    expect(labelOf({ name: "GitHubStar", label: "GitHub Star" })).toBe("GitHub Star");
  });

  it("derives one when no override is set", () => {
    expect(labelOf({ name: "CodeBlock" })).toBe("Code Block");
  });

  it("gives every shipped component a non-empty label", () => {
    for (const entry of componentList) {
      expect(labelOf(entry).length).toBeGreaterThan(0);
    }
  });
});

describe("registry titles", () => {
  it("match the label the site shows for the same component", async () => {
    const { readFileSync } = await import("node:fs");
    const registry = JSON.parse(
      readFileSync(new URL("../registry.json", import.meta.url), "utf-8")
    );
    const byName = new Map(registry.items.map((i: { name: string; title: string }) => [i.name, i.title]));
    for (const entry of componentList) {
      const title = byName.get(entry.slug);
      if (title === undefined) continue; // not published yet
      expect(title, `registry title for "${entry.slug}"`).toBe(labelOf(entry));
    }
  });
});
