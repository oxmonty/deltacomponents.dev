"use client";

import { BadgeCheck } from "lucide-react";
import { Glyph } from "@/registry/ui/glyph";

// A gradient tile, not a flat card: the knockout only reads as a hole when
// what sits behind the badge isn't a solid color.
function Tile({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex size-24 items-center justify-center rounded-2xl bg-[conic-gradient(from_180deg,#f97316,#ec4899,#8b5cf6,#f97316)]">
      {children}
    </div>
  );
}

export default function GlyphDemo() {
  return (
    <div className="flex items-center gap-10">
      <div className="flex flex-col items-center gap-2">
        <Tile>
          <Glyph size={40} />
        </Tile>
        <span className="text-caption text-muted-foreground">Knockout</span>
      </div>
      {/* The conventional approach: a solid icon painted on top. It matches
          on a flat card, then seams the moment it sits over anything else. */}
      <div className="flex flex-col items-center gap-2">
        <Tile>
          <BadgeCheck
            size={40}
            fill="#1d9bf0"
            stroke="white"
            strokeWidth={2}
          />
        </Tile>
        <span className="text-caption text-muted-foreground">Painted</span>
      </div>
    </div>
  );
}
