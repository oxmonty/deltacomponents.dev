"use client";

import { Tooltip } from "@/registry/ui/tooltip";
import { Button } from "@/registry/ui/button";

export default function TooltipDemo() {
  return (
    <div className="flex gap-3">
      <Tooltip content="Save your changes">
        <Button>Save</Button>
      </Tooltip>
      <Tooltip content="Discard this draft" side="bottom">
        <Button variant="secondary">Discard</Button>
      </Tooltip>
    </div>
  );
}
