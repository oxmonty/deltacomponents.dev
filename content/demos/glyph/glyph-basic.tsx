"use client";

import { Glyph } from "@/registry/ui/glyph";

export default function GlyphBasic() {
  return (
    <div className="flex items-center gap-1.5">
      <span style={{ fontVariationSettings: "'wght' 550" }}>Ada Lovelace</span>
      <Glyph />
    </div>
  );
}
