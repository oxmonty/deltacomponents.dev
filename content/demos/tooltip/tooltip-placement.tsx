"use client";

import { Tooltip } from "@/registry/ui/tooltip";
import { Button } from "@/registry/ui/button";

export default function TooltipPlacement() {
  return (
    <div className="flex gap-3">
      <Tooltip content="Top" side="top">
        <Button variant="secondary">Top</Button>
      </Tooltip>
      <Tooltip content="Right" side="right">
        <Button variant="secondary">Right</Button>
      </Tooltip>
      <Tooltip content="Bottom" side="bottom">
        <Button variant="secondary">Bottom</Button>
      </Tooltip>
      <Tooltip content="Left" side="left">
        <Button variant="secondary">Left</Button>
      </Tooltip>
    </div>
  );
}
