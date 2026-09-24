"use client";

import { useState } from "react";
import { useIcon } from "@/registry/lib/icon-context";
import { Button } from "@/registry/ui/button";

type IconSize = "icon-sm" | "icon" | "icon-lg" | "icon-xl";

export default function ButtonIcon() {
  const Play = useIcon("play");
  const Pause = useIcon("pause");
  const [playing, setPlaying] = useState(false);
  const [size, setSize] = useState<IconSize>("icon-xl");

  return (
    <div className="flex w-fit flex-col items-center gap-5">
      {/* No visible text, so the label is the accessible name, and it names
          the action the press will take, not the state the button shows. */}
      <Button
        size={size}
        aria-label={playing ? "Pause" : "Play"}
        aria-pressed={playing}
        onClick={() => setPlaying((value) => !value)}
      >
        {/* A transport control is a filled shape: the glyph is the thing
            itself, not an outline of it. */}
        {playing ? <Pause className="fill-current" /> : <Play className="fill-current" />}
      </Button>

      <label className="text-caption text-muted-foreground flex items-center gap-2 self-start">
        Size
        <select
          value={size}
          onChange={(e) => setSize(e.target.value as IconSize)}
          className="border-border bg-background text-foreground text-caption rounded-md border px-2 py-1 outline-none focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)]"
        >
          <option value="icon-sm">icon-sm</option>
          <option value="icon">icon</option>
          <option value="icon-lg">icon-lg</option>
          <option value="icon-xl">icon-xl</option>
        </select>
      </label>
    </div>
  );
}
