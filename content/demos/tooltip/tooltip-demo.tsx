"use client";

import { Tooltip } from "@/registry/base/tooltip";
import { Button } from "@/registry/base/button";

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
