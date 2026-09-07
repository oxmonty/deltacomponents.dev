"use client";

import { Glyph } from "@/registry/ui/glyph";

export default function GlyphSizes() {
  return (
    <div className="flex items-end gap-4">
      <Glyph size={14} />
      <Glyph size={20} />
      <Glyph size={32} />
      <Glyph size={48} />
    </div>
  );
}
