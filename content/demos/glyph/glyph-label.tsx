"use client";

import { Check } from "lucide-react";
import { Glyph } from "@/registry/ui/glyph";

export default function GlyphLabel() {
  return (
    <div className="flex items-center gap-1.5">
      <Glyph label="Verified account" className="text-[#1d9bf0]">
        <Check />
      </Glyph>
      <span className="text-caption text-muted-foreground">
        Announced to screen readers instead of hidden.
      </span>
    </div>
  );
}
