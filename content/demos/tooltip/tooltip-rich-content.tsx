"use client";

import { Tooltip } from "@/registry/base/tooltip";
import { Button } from "@/registry/base/button";

export default function TooltipRichContent() {
  return (
    <Tooltip
      content={
        <div className="flex flex-col gap-1">
          <span style={{ fontVariationSettings: "'wght' 550" }}>
            Keyboard shortcut
          </span>
          <span className="text-muted-foreground">⌘ + S</span>
        </div>
      }
    >
      <Button>Save</Button>
    </Tooltip>
  );
}
