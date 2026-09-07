"use client";

import { Check } from "lucide-react";
import { Glyph } from "@/registry/ui/glyph";

const SIZES = ["size-4", "size-5", "size-6", "size-8"] as const;

// Sizing is a className, not a prop — Glyph takes whatever box the utility
// gives it and scales the shape and the knockout to match, the same way any
// icon in this codebase behaves.
export default function GlyphSizes() {
  return (
    <div className="flex items-end gap-8">
      {SIZES.map((size) => (
        <div key={size} className="flex flex-col items-center gap-2">
          <Glyph className={`${size} text-[#1d9bf0]`}>
            <Check />
          </Glyph>
          <span className="text-caption text-muted-foreground font-mono">{size}</span>
        </div>
      ))}
    </div>
  );
}
