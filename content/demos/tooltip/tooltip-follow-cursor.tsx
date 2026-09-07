"use client";

import { Tooltip } from "@/registry/ui/tooltip";

export default function TooltipFollowCursor() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-6">
      <Tooltip content="Following x" side="top" followCursor="x">
        <div className="flex h-12 w-64 cursor-default items-center justify-center rounded-lg border border-border text-[12px] text-muted-foreground">
          Move along me
        </div>
      </Tooltip>
      <Tooltip content="Following y" side="right" followCursor="y">
        <div className="flex h-40 w-12 cursor-default items-center justify-center rounded-lg border border-border text-[12px] text-muted-foreground">
          <span className="rotate-90 whitespace-nowrap">Move along me</span>
        </div>
      </Tooltip>
    </div>
  );
}
