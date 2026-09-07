"use client";

import { Check } from "lucide-react";
import { Glyph } from "@/registry/ui/glyph";

export default function GlyphBasic() {
  return (
    <div className="flex items-center gap-1.5">
      <span style={{ fontVariationSettings: "'wght' 550" }}>Ada Lovelace</span>
      <Glyph className="text-[#1d9bf0]">
        <Check />
      </Glyph>
    </div>
  );
}
