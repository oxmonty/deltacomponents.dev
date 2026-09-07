"use client";

import { Glyph } from "@/registry/ui/glyph";

export default function GlyphColors() {
  return (
    <div className="flex items-center gap-4">
      <Glyph color="#1d9bf0" />
      <Glyph color="#22c55e" />
      <Glyph color="#f59e0b" />
      <Glyph color="#8b5cf6" />
      <Glyph color="#000000" />
    </div>
  );
}
