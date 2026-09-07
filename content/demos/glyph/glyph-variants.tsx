"use client";

import { Check, Flame, Zap } from "lucide-react";
import { Glyph } from "@/registry/ui/glyph";

function Specimen({
  children,
  caption,
}: {
  children: React.ReactNode;
  caption: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      {children}
      <span className="text-caption text-muted-foreground">{caption}</span>
    </div>
  );
}

// Icons come from lucide here, which is the point: Glyph only owns the
// shape, the consumer brings whatever icon library they already use.
export default function GlyphVariants() {
  return (
    <div className="flex items-center gap-8">
      <Specimen caption="Verified">
        <Glyph mask="rosette" className="size-8 text-[#1d9bf0]">
          <Check />
        </Glyph>
      </Specimen>
      <Specimen caption="Streak">
        <Glyph mask="circle" className="size-8 text-orange-500">
          <Flame />
        </Glyph>
      </Specimen>
      <Specimen caption="Premium">
        <Glyph mask="squircle" className="size-8 text-violet-500">
          <Zap />
        </Glyph>
      </Specimen>
    </div>
  );
}
