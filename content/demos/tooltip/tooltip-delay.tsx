"use client";

import { Tooltip } from "@/registry/base/tooltip";
import { Button } from "@/registry/base/button";

export default function TooltipDelay() {
  return (
    <div className="flex gap-3">
      <Tooltip content="Instant" delayDuration={0}>
        <Button variant="secondary">No delay</Button>
      </Tooltip>
      <Tooltip content="Slow" delayDuration={500}>
        <Button variant="secondary">500ms delay</Button>
      </Tooltip>
    </div>
  );
}
