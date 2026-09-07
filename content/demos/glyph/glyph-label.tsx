"use client";

import { Glyph } from "@/registry/ui/glyph";

export default function GlyphLabel() {
  return (
    <div className="flex items-center gap-1.5">
      <Glyph label="Verified account" />
      <span className="text-caption text-muted-foreground">
        Announced to screen readers instead of hidden.
      </span>
    </div>
  );
}
